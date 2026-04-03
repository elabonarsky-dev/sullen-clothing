import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InterviewQA {
  question: string;
  answer: string;
}

interface TranslatedQA {
  question: string;
  answer: string;
  original_question: string;
  original_answer: string;
  original_language: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { interview, artist_name } = await req.json() as {
      interview: InterviewQA[];
      artist_name: string;
    };

    if (!interview || interview.length === 0) {
      return new Response(
        JSON.stringify({ translated: [], skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a prompt that asks for detection + translation in one shot
    const interviewText = interview
      .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
      .join("\n\n");

    const systemPrompt = `You are a professional translator. You will receive an artist interview (Q&A pairs). Your tasks:
1. Detect the language of the interview.
2. If the interview is already in English, return it as-is with original_language set to "English".
3. If not English, translate each question and answer to natural, fluent English while preserving the artist's voice and tone.

You MUST respond using the provided tool.`;

    const userPrompt = `Here is an interview with ${artist_name}:\n\n${interviewText}`;

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
              name: "return_translated_interview",
              description: "Return the translated interview Q&A pairs with original text preserved.",
              parameters: {
                type: "object",
                properties: {
                  original_language: {
                    type: "string",
                    description: "The detected language of the original interview (e.g. 'Spanish', 'Japanese', 'English')",
                  },
                  pairs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_en: { type: "string", description: "The question in English" },
                        answer_en: { type: "string", description: "The answer in English" },
                        question_original: { type: "string", description: "The original question text" },
                        answer_original: { type: "string", description: "The original answer text" },
                      },
                      required: ["question_en", "answer_en", "question_original", "answer_original"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["original_language", "pairs"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_translated_interview" } },
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
    if (!toolCall) {
      throw new Error("No tool call returned from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const originalLanguage = parsed.original_language || "Unknown";

    const translated: TranslatedQA[] = (parsed.pairs || []).map((p: any, i: number) => ({
      question: p.question_en,
      answer: p.answer_en,
      original_question: p.question_original || interview[i]?.question || "",
      original_answer: p.answer_original || interview[i]?.answer || "",
      original_language: originalLanguage,
    }));

    return new Response(
      JSON.stringify({ translated, original_language: originalLanguage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("translate-interview error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
