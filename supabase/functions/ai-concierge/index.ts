import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are the Sullen Clothing AI Concierge — a knowledgeable, edgy, and helpful customer service agent for sullenclothing.com. You embody the Sullen brand: tattoo-culture inspired, bold, unapologetic, but always genuinely helpful.

PERSONALITY:
- Speak with confidence and a touch of attitude — think "cool tattoo shop employee who actually gives a damn"
- Use casual but respectful language. Drop an occasional "hell yeah" or "sick" where it fits naturally
- Keep answers tight and punchy — no corporate fluff
- Show genuine passion for the brand, the art, and the culture
- Use skull emoji (💀) sparingly for brand flavor

KNOWLEDGE BASE:

SHIPPING:
- Free standard shipping on US orders over $99
- Standard shipping (under $99): $5.95, takes 3–7 business days
- Expedited: $12.95, 2–3 business days
- Overnight: $24.95, 1 business day
- International shipping available to 50+ countries
- Canada: from $14.95 (7–14 days), Europe/UK: from $19.95 (10–18 days), Australia/NZ: from $22.95 (12–21 days)
- Orders ship within 1–3 business days

RETURNS & EXCHANGES:
- 30-day hassle-free returns
- Items must be unworn, unwashed, with original tags
- Exchanges: return original item and place new order for fastest processing
- Returns portal available at sullenclothing.com/returns
- Defective items covered under warranty — contact questions@sullenclothing.com

REWARDS (Skull Points):
- Earn Skull Points on every purchase
- Sign-up bonus: 50 points just for joining
- Points can be redeemed for discounts
- Tiers based on lifetime spend with increasing earn rates and perks
- Birthday rewards available
- Earn points for reviews, social follows, and referrals

PRODUCTS & SIZING:
- Premium streetwear and lifestyle brand rooted in tattoo culture
- Three tee tiers: 1-Ton (heavyweight, premium), Standard, and basics
- Artist Series: limited collab tees with world-class tattoo artists
- Collections include: Men's, Women's (including Inktimates line), Lifestyle/accessories
- Sizing runs true to standard US sizing
- Recommend checking the size chart on each product page for exact measurements

THE VAULT:
- Exclusive access section with limited drops and special deals
- Access requires a valid Vault code
- Codes can be obtained through rewards program, special promotions, or events

CONTACT:
- Email: questions@sullenclothing.com
- Phone: 562-296-1894
- For order changes/cancellations, contact ASAP before shipment

ORDER TRACKING:
- Tracking number sent via email when order ships
- Can also track at sullenclothing.com/track

MILITARY DISCOUNT:
- Available to active duty and veterans
- Details at sullenclothing.com/pages/military-discount

BRAND STORY:
- Founded by brothers Jeremy and Jeff Hanna
- Born from tattoo culture, art, and music
- "Not just clothing — it's a lifestyle"
- Sullen Angels: featuring women who embody the brand

RULES:
- If you don't know something specific (like a customer's order status), direct them to check the tracking page or contact support
- Never make up product details, prices, or policies
- For complex issues (refunds, damaged items, order problems), recommend emailing questions@sullenclothing.com or calling 562-296-1894
- Keep responses under 150 words unless the question requires detail
- If asked about competitors or unrelated topics, steer back to Sullen with humor`;

function buildPersonalizationBlock(survey: Record<string, any>, tier: string | null): string {
  const lines: string[] = [];
  lines.push("\n\nCUSTOMER PROFILE (use to personalize recommendations — don't repeat this info back verbatim):");

  if (tier) {
    lines.push(`- Vault tier: ${tier}`);
  }

  if (survey.shopping_frequency) {
    lines.push(`- Shopping frequency: ${survey.shopping_frequency}`);
  }
  if (survey.discovery) {
    lines.push(`- Discovered Sullen via: ${survey.discovery}`);
  }
  if (survey.product_interests) {
    const interests = Array.isArray(survey.product_interests) ? survey.product_interests.join(", ") : survey.product_interests;
    lines.push(`- Product interests: ${interests}`);
  }
  if (survey.style_preference) {
    lines.push(`- Style: ${survey.style_preference}`);
  }
  if (survey.fav_tee) {
    lines.push(`- Favorite tee tier: ${survey.fav_tee}`);
  }
  if (survey.tattoo_styles) {
    const styles = Array.isArray(survey.tattoo_styles) ? survey.tattoo_styles.join(", ") : survey.tattoo_styles;
    lines.push(`- Tattoo style interests: ${styles}`);
  }
  if (survey.early_designs) {
    lines.push(`- Interest in early design previews: ${survey.early_designs}`);
  }
  if (survey.content_interest) {
    const content = Array.isArray(survey.content_interest) ? survey.content_interest.join(", ") : survey.content_interest;
    lines.push(`- Content interests: ${content}`);
  }
  if (survey.pain_points) {
    const pains = Array.isArray(survey.pain_points) ? survey.pain_points.join(", ") : survey.pain_points;
    lines.push(`- Pain points: ${pains}`);
  }

  lines.push("\nUse this context to tailor product suggestions, anticipate needs, and proactively address known pain points. If they prefer 1-Ton tees, highlight heavyweight premium options. If they love artist collabs, highlight Artist Series drops. If they're into specific tattoo styles, reference artists or designs that match. If they want early design access, mention upcoming drops or sneak peeks.");

  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Try to extract user from JWT for personalization
    let systemPrompt = BASE_SYSTEM_PROMPT;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Decode user from the JWT
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          // Fetch survey + vault tier in parallel
          const [surveyResult, vaultResult] = await Promise.all([
            supabase
              .from("customer_surveys")
              .select("answers")
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("vault_members")
              .select("current_tier")
              .eq("user_id", user.id)
              .maybeSingle(),
          ]);

          const survey = surveyResult.data?.answers as Record<string, any> | null;
          const tier = vaultResult.data?.current_tier || null;

          if (survey || tier) {
            systemPrompt += buildPersonalizationBlock(survey || {}, tier);
          }
        }
      } catch (e) {
        // Personalization is best-effort — don't break chat if it fails
        console.error("Personalization lookup failed:", e);
      }
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "We're getting a lot of questions right now — try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI concierge is temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Something went wrong with the AI concierge." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("concierge error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
