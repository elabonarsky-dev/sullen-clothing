import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find pending review requests whose send_after has passed
    const { data: pendingRequests, error: fetchErr } = await supabase
      .from("review_request_tokens")
      .select("*")
      .eq("status", "pending")
      .not("send_after", "is", null)
      .lte("send_after", new Date().toISOString())
      .limit(20);

    if (fetchErr) {
      console.error("Failed to fetch pending review requests:", fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const request of pendingRequests) {
      try {
        const lineItems = (request.line_items as any[] || []).map((li: any) => ({
          title: li.title || "",
          handle: li.product_handle || "",
          image: li.image || "",
        }));

        // Send Attentive custom event for SMS/email journeys
        const attentiveApiKey = Deno.env.get("ATTENTIVE_API_KEY");
        if (attentiveApiKey) {
          try {
            const reviewUrl = `https://www.sullenclothing.com/write-review/${request.token}`;
            await fetch("https://api.attentivemobile.com/v1/events/custom", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${attentiveApiKey}`,
              },
              body: JSON.stringify({
                type: "Review Request",
                properties: { reviewUrl },
                user: { email: request.email },
              }),
            });
            console.log(`Attentive Review Request event sent for ${request.order_name}`);
          } catch (attErr) {
            console.error("Attentive event failed:", attErr);
          }
        }

        const { data: invokeData, error: invokeError } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "review-request",
            recipientEmail: request.email,
            idempotencyKey: `review-request-${request.order_id}`,
            templateData: {
              customerName: request.customer_name || undefined,
              orderName: request.order_name,
              token: request.token,
              items: lineItems,
            },
          },
        });

        if (invokeError) {
          throw new Error(`send-transactional-email invoke failed: ${invokeError.message}`);
        }

        await supabase
          .from("review_request_tokens")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("token", request.token);

        sent++;
        console.log(`Review request email sent for ${request.order_name} (${request.email})`);
      } catch (sendErr) {
        failed++;
        console.error(`Failed to send review request for ${request.order_name}:`, sendErr);
      }
    }

    console.log(`Processed review requests: ${sent} sent, ${failed} failed`);
    return new Response(JSON.stringify({ processed: sent, failed }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Process review requests error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
