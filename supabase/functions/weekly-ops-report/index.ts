import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const storefrontToken = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN")!;
    const shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN")!;

    const admin = createClient(supabaseUrl, serviceKey);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const weekAgoISO = weekAgo.toISOString();
    const twoWeeksAgoISO = twoWeeksAgo.toISOString();
    const nowISO = now.toISOString();

    // Format week label in PT
    const ptFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const weekLabel = `${ptFormatter.format(weekAgo)} – ${ptFormatter.format(now)}`;

    // ── Gather data in parallel ──
    const [
      thisWeekOrders,
      lastWeekOrders,
      newMembersRes,
      pointsEarnedRes,
      redemptionsRes,
      newReviewsRes,
      pendingReviewsRes,
    ] = await Promise.all([
      // This week orders
      admin.from("order_history")
        .select("total_price, line_items, order_date")
        .gte("order_date", weekAgoISO)
        .lt("order_date", nowISO)
        .limit(1000),
      // Last week orders (for comparison)
      admin.from("order_history")
        .select("total_price")
        .gte("order_date", twoWeeksAgoISO)
        .lt("order_date", weekAgoISO)
        .limit(1000),
      // New vault members
      admin.from("vault_members")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgoISO),
      // Points earned
      admin.from("reward_transactions")
        .select("points")
        .gt("points", 0)
        .gte("created_at", weekAgoISO)
        .limit(1000),
      // Redemptions
      admin.from("reward_redemptions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgoISO),
      // New reviews
      admin.from("reviews")
        .select("rating")
        .gte("created_at", weekAgoISO)
        .limit(500),
      // Pending reviews
      admin.from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    // ── Compute metrics ──
    const thisWeekData = thisWeekOrders.data || [];
    const lastWeekData = lastWeekOrders.data || [];

    const thisRevenue = thisWeekData.reduce((s, o) => s + (o.total_price || 0), 0);
    const lastRevenue = lastWeekData.reduce((s, o) => s + (o.total_price || 0), 0);
    const thisCount = thisWeekData.length;
    const lastCount = lastWeekData.length;
    const thisAOV = thisCount > 0 ? thisRevenue / thisCount : 0;
    const lastAOV = lastCount > 0 ? lastRevenue / lastCount : 0;

    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+∞" : "—";
      const pct = ((curr - prev) / prev) * 100;
      return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
    };

    const metrics = [
      { label: "Total Revenue", value: `$${thisRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: pctChange(thisRevenue, lastRevenue) },
      { label: "Orders", value: thisCount.toString(), change: pctChange(thisCount, lastCount) },
      { label: "AOV", value: `$${thisAOV.toFixed(2)}`, change: pctChange(thisAOV, lastAOV) },
    ];

    // Top products by units sold
    const productCounts: Record<string, { units: number; revenue: number }> = {};
    for (const order of thisWeekData) {
      const items = order.line_items as any[];
      if (!Array.isArray(items)) continue;
      for (const li of items) {
        const title = li.title;
        if (!title) continue;
        const qty = li.quantity || 1;
        const price = parseFloat(li.price || "0") * qty;
        if (!productCounts[title]) productCounts[title] = { units: 0, revenue: 0 };
        productCounts[title].units += qty;
        productCounts[title].revenue += price;
      }
    }
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1].units - a[1].units)
      .slice(0, 5)
      .map(([title, data]) => ({
        title,
        units: data.units,
        revenue: `$${data.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      }));

    // Rewards
    const totalPointsEarned = (pointsEarnedRes.data || []).reduce((s, t) => s + t.points, 0);
    const rewardsSummary = {
      newMembers: newMembersRes.count || 0,
      pointsEarned: totalPointsEarned,
      redemptions: redemptionsRes.count || 0,
    };

    // Reviews
    const reviewsData = newReviewsRes.data || [];
    const avgRating = reviewsData.length > 0
      ? (reviewsData.reduce((s, r) => s + r.rating, 0) / reviewsData.length).toFixed(1)
      : "0";
    const reviewsSummary = {
      newReviews: reviewsData.length,
      avgRating,
      pendingCount: pendingReviewsRes.count || 0,
    };

    // ── AI Insights ──
    const dataForAI = {
      weekLabel,
      metrics,
      topProducts,
      rewardsSummary,
      reviewsSummary,
      orderCount: thisCount,
      prevOrderCount: lastCount,
    };

    let insights: string[] = [];
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a strategic e-commerce analyst for Sullen Clothing, a tattoo-culture streetwear brand.
Given weekly operations data, provide exactly 4 concise, actionable strategic insights.
Focus on: revenue trends, product performance, loyalty program health, and actionable recommendations.
Each insight should be 1-2 sentences. Be specific with numbers.`,
            },
            {
              role: "user",
              content: JSON.stringify(dataForAI),
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "provide_insights",
                parameters: {
                  type: "object",
                  properties: {
                    insights: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4,
                    },
                  },
                  required: ["insights"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "provide_insights" } },
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          insights = JSON.parse(toolCall.function.arguments)?.insights ?? [];
        }
      } else {
        const errText = await aiRes.text();
        console.error("AI insights error:", aiRes.status, errText);
      }
    } catch (aiErr) {
      console.error("AI insights failed:", aiErr);
      insights = ["AI insights unavailable this week. Review the metrics above for manual analysis."];
    }

    // ── Send email ──
    const templateData = {
      weekLabel,
      metrics,
      topProducts,
      rewardsSummary,
      reviewsSummary,
      insights,
    };

    const idempotencyKey = `weekly-ops-${weekAgo.toISOString().split("T")[0]}`;

    const { error: emailError } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "weekly-ops-report",
        recipientEmail: "ryan@sullenclothing.com",
        idempotencyKey,
        templateData,
      },
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      throw new Error(`Email failed: ${emailError.message}`);
    }

    console.log("Weekly ops report sent successfully for", weekLabel);

    return new Response(JSON.stringify({ success: true, weekLabel, metrics, topProducts: topProducts.length, insights: insights.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("weekly-ops-report error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
