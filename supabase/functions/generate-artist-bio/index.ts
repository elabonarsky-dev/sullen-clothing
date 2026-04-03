import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, specialty, styles, location, studio, instagram, interview } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context from available artist data
    const context: string[] = [];
    if (specialty) context.push(`Specialty: ${specialty}`);
    if (styles?.length) context.push(`Styles: ${styles.join(", ")}`);
    if (location) context.push(`Location: ${location}`);
    if (studio) context.push(`Studio: ${studio}`);
    if (instagram) context.push(`Instagram: ${instagram}`);
    if (interview?.length) {
      const interviewText = interview
        .slice(0, 5)
        .map((qa: any) => `Q: ${qa.question || qa.original_question || ""}\nA: ${qa.answer || qa.original_answer || ""}`)
        .join("\n\n");
      context.push(`Interview excerpts:\n${interviewText}`);
    }

    const systemPrompt = `You are the editorial voice of Sullen Clothing — a tattoo culture streetwear brand. You write artist bios that are punchy, authentic, and editorial. No generic filler. No fabricated facts.

Study these examples of our voice:
- "GUIZO is Lisbon's lettering king and a true Sullen family original. Operating from Dilúvio Tattoo Studio, his signature bold blackletter and Chicano-influenced script tattooing is immediately recognizable."
- "Some artists make tattoos. Cleo Kinnaman makes portraits that happen to live on skin. Born in Belgium to a Swedish mother and Ethiopian father, her nomadic upbringing gave her a visual vocabulary built across cultures."
- "Zach Goldin's work sits firmly in the world of black and grey realism, but with a darker edge. His tattoos lean heavily into contrast, shadow, and imagery that carries a certain weight."
- "Known globally as Don Rodrigues, André is one of São Paulo's most accomplished neo-traditional artists."

Rules:
- NEVER fabricate locations, studios, or biographical details not provided in the context
- Focus on craft, style, and what makes their work distinctive
- Short bio: 1-2 sentences, punchy, captures their essence (like the examples above)
- Long bio: 3-5 paragraphs with markdown formatting. SEO-rich, editorial depth. Include their style, approach, and connection to tattoo culture. Use **bold** for emphasis. Can reference their interview if provided.
- If you don't have enough info for rich detail, keep it tighter rather than padding with fluff`;

    const userPrompt = `Write a short bio and a long bio for tattoo artist "${name}".

Available context:
${context.join("\n")}

Use ONLY the information provided. Do not invent details.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_artist_bios",
              description: "Return the generated short and long artist bios.",
              parameters: {
                type: "object",
                properties: {
                  short_bio: {
                    type: "string",
                    description: "1-2 sentence punchy bio capturing the artist's essence",
                  },
                  long_bio: {
                    type: "string",
                    description: "3-5 paragraph SEO-rich editorial bio with markdown formatting",
                  },
                },
                required: ["short_bio", "long_bio"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_artist_bios" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned from AI");

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        short_bio: parsed.short_bio,
        long_bio: parsed.long_bio,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-artist-bio error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
