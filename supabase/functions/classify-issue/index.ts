import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES = [
  "shipping_delay",
  "order_issue",
  "sizing_fit",
  "return_exchange",
  "product_defect",
  "payment_billing",
  "tracking_issue",
  "website_bug",
  "product_availability",
  "discount_promo",
  "account_issue",
  "general_inquiry",
] as const;

const TITLE_MAP: Record<string, string> = {
  shipping_delay: "Shipping Delays",
  order_issue: "Order Problems",
  sizing_fit: "Sizing & Fit Questions",
  return_exchange: "Returns & Exchanges",
  product_defect: "Product Defects",
  payment_billing: "Payment & Billing",
  tracking_issue: "Tracking Problems",
  website_bug: "Website Issues",
  product_availability: "Product Availability",
  discount_promo: "Discount & Promo Issues",
  account_issue: "Account Problems",
  general_inquiry: "General Inquiries",
};

// Thresholds at which to send notifications (escalating alerts)
const ALERT_THRESHOLDS = [20, 50, 100, 200, 500];

// Regex to extract order numbers from messages (Shopify format #1234, SC-1234, etc.)
const ORDER_REGEX = /#?\b(SC-?\d{4,}|\d{4,})\b/i;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

async function sendAlertNotification(
  supabase: ReturnType<typeof createClient>,
  pattern: { id: string; category: string; title: string; occurrence_count: number; description: string | null },
  threshold: number
) {
  const { data: webhookSetting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "issue_alert_webhook_url")
    .maybeSingle();

  const webhookUrl = webhookSetting?.value;

  const { data: emailSetting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "issue_alert_email")
    .maybeSingle();

  const alertEmail = emailSetting?.value;

  const alertPayload = {
    type: "issue_threshold_alert",
    threshold,
    pattern: {
      id: pattern.id,
      category: pattern.category,
      title: pattern.title,
      description: pattern.description,
      occurrence_count: pattern.occurrence_count,
    },
    message: `⚠️ Issue pattern "${pattern.title}" has reached ${pattern.occurrence_count} occurrences (threshold: ${threshold}). This may indicate a systemic problem that needs attention.`,
    timestamp: new Date().toISOString(),
    admin_url: "/admin",
  };

  if (webhookUrl) {
    try {
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertPayload),
      });
      console.log(`Webhook alert sent to ${webhookUrl}: ${resp.status}`);
    } catch (err) {
      console.error("Failed to send webhook alert:", err);
    }
  }

  if (alertEmail) {
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        await supabase.from("issue_logs").insert({
          source: "system",
          category: pattern.category,
          summary: `ALERT: "${pattern.title}" hit ${pattern.occurrence_count} occurrences (threshold ${threshold}). Notification sent to ${alertEmail}.`,
          customer_message: null,
          metadata: { alert_type: "threshold", threshold, email: alertEmail },
        });
      }
    } catch (err) {
      console.error("Failed to log email alert:", err);
    }
  }

  if (!webhookUrl && !alertEmail) {
    console.log(`⚠️ ISSUE ALERT: "${pattern.title}" hit ${pattern.occurrence_count} occurrences (threshold: ${threshold}). Configure 'issue_alert_webhook_url' or 'issue_alert_email' in site_settings to receive notifications.`);
    await supabase.from("issue_logs").insert({
      source: "system",
      category: pattern.category,
      summary: `ALERT: "${pattern.title}" hit ${pattern.occurrence_count} occurrences (threshold ${threshold}). No webhook/email configured.`,
      customer_message: null,
      metadata: { alert_type: "threshold", threshold, unconfigured: true },
    });
  }

  await supabase
    .from("issue_patterns")
    .update({
      notified_at: new Date().toISOString(),
      threshold_notified: threshold,
    })
    .eq("id", pattern.id);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source, customer_message, metadata, session_id, customer_email, order_number } = await req.json();

    if (!customer_message) {
      return new Response(
        JSON.stringify({ error: "customer_message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Try to extract order number and email from the message if not provided
    let resolvedEmail = customer_email || null;
    let resolvedOrder = order_number || null;

    if (!resolvedOrder) {
      const orderMatch = customer_message.match(ORDER_REGEX);
      if (orderMatch) resolvedOrder = orderMatch[0].replace(/^#/, "");
    }
    if (!resolvedEmail) {
      const emailMatch = customer_message.match(EMAIL_REGEX);
      if (emailMatch) resolvedEmail = emailMatch[0].toLowerCase();
    }

    // Also check metadata for order/email info
    if (!resolvedOrder && metadata?.order_name) {
      resolvedOrder = String(metadata.order_name).replace(/^#/, "");
    }
    if (!resolvedEmail && metadata?.email) {
      resolvedEmail = String(metadata.email).toLowerCase();
    }

    // Classify the issue using AI
    const classifyResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are an issue classifier for Sullen Clothing customer support. Classify the customer message into exactly ONE category and provide a short summary.

Categories: ${CATEGORIES.join(", ")}

Respond ONLY with valid JSON:
{"category": "<category>", "summary": "<1-sentence summary of the issue>"}`,
          },
          { role: "user", content: customer_message },
        ],
        temperature: 0.1,
      }),
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (!classifyResp.ok) {
      console.error("Classification failed:", classifyResp.status);
      await supabase.from("issue_logs").insert({
        source: source || "concierge",
        category: "general_inquiry",
        summary: customer_message.slice(0, 200),
        customer_message,
        metadata: metadata || {},
        session_id,
        customer_email: resolvedEmail,
        order_number: resolvedOrder,
      });
      return new Response(
        JSON.stringify({ ok: true, category: "general_inquiry" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const classifyData = await classifyResp.json();
    const rawContent = classifyData.choices?.[0]?.message?.content || "";
    
    let category = "general_inquiry";
    let summary = customer_message.slice(0, 200);

    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (CATEGORIES.includes(parsed.category)) {
          category = parsed.category;
        }
        if (parsed.summary) {
          summary = parsed.summary;
        }
      }
    } catch {
      console.error("Failed to parse classification:", rawContent);
    }

    // Insert the issue log with customer identification
    await supabase.from("issue_logs").insert({
      source: source || "concierge",
      category,
      summary,
      customer_message,
      metadata: metadata || {},
      session_id,
      customer_email: resolvedEmail,
      order_number: resolvedOrder,
    });

    // Upsert the pattern
    const { data: existing } = await supabase
      .from("issue_patterns")
      .select("id, occurrence_count, threshold_notified, title, description")
      .eq("category", category)
      .eq("status", "active")
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let patternForAlert: { id: string; category: string; title: string; occurrence_count: number; description: string | null } | null = null;

    if (existing) {
      const newCount = existing.occurrence_count + 1;
      await supabase
        .from("issue_patterns")
        .update({
          occurrence_count: newCount,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      const lastNotified = existing.threshold_notified || 0;
      const nextThreshold = ALERT_THRESHOLDS.find((t) => t > lastNotified && newCount >= t);
      if (nextThreshold) {
        patternForAlert = {
          id: existing.id,
          category,
          title: existing.title,
          occurrence_count: newCount,
          description: existing.description,
        };
        sendAlertNotification(supabase, patternForAlert, nextThreshold).catch((err) =>
          console.error("Alert notification failed:", err)
        );
      }
    } else {
      await supabase.from("issue_patterns").insert({
        category,
        title: TITLE_MAP[category] || category,
        description: summary,
        occurrence_count: 1,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, category, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("classify-issue error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
