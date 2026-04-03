import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyShopifyHmac(
  body: string,
  hmacHeader: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return computed === hmacHeader;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const hmac = req.headers.get("x-shopify-hmac-sha256") || "";
    const secret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET") || "";

    if (!await verifyShopifyHmac(rawBody, hmac, secret)) {
      console.error("HMAC verification failed");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const order = JSON.parse(rawBody);
    const orderId = String(order.id);
    const orderName = order.name || `#${order.order_number || orderId}`;
    const financialStatus = order.financial_status || "cancelled";
    const email = (order.email || order.contact_email || "").toLowerCase().trim();

    console.log(`Cancel webhook for order ${orderId} (${orderName}), financial_status: ${financialStatus}, email: ${email}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update the order_history record
    const { error } = await supabase
      .from("order_history")
      .update({
        financial_status: financialStatus === "paid" ? "cancelled" : financialStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    if (error) {
      console.error("Failed to update order_history:", error);
    } else {
      console.log(`Updated order ${orderId} to cancelled`);
    }

    // --- Revoke loyalty points earned from this order ---
    const { data: earnedTxns } = await supabase
      .from("reward_transactions")
      .select("id, points, user_id")
      .eq("reference_id", orderId)
      .eq("type", "purchase");

    if (earnedTxns && earnedTxns.length > 0) {
      for (const txn of earnedTxns) {
        // Check if we already reversed this transaction (idempotency)
        const { data: existing } = await supabase
          .from("reward_transactions")
          .select("id")
          .eq("reference_id", `cancel-${txn.id}`)
          .eq("type", "admin_adjustment")
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`Points already reversed for txn ${txn.id}`);
          continue;
        }

        // Insert negative points to reverse
        const { error: revErr } = await supabase
          .from("reward_transactions")
          .insert({
            user_id: txn.user_id,
            points: -Math.abs(txn.points),
            type: "admin_adjustment",
            description: `Points reversed — order ${orderName} cancelled`,
            reference_id: `cancel-${txn.id}`,
            source: "cancel_webhook",
          });

        if (revErr) {
          console.error(`Failed to reverse points for txn ${txn.id}:`, revErr);
        } else {
          console.log(`Reversed ${txn.points} pts for user ${txn.user_id} (order ${orderName})`);
        }
      }

      // Also reverse lifetime/annual spend on vault_members
      const orderTotal = parseFloat(order.total_price || "0");
      if (orderTotal > 0 && email) {
        const { error: spendErr } = await supabase.rpc("vault_reverse_cancelled_spend", {
          p_email: email,
          p_amount: orderTotal,
        });
        if (spendErr) {
          console.error("Failed to reverse spend:", spendErr);
        } else {
          console.log(`Reversed $${orderTotal} spend for ${email}`);
        }
      }
    } else {
      console.log(`No purchase points found for order ${orderId}`);
    }

    // --- Cancel any pending review request tokens for this order ---
    const { data: cancelledTokens, error: tokenErr } = await supabase
      .from("review_request_tokens")
      .update({ status: "cancelled" })
      .eq("order_id", orderId)
      .in("status", ["pending", "scheduled"])
      .select("id");

    if (tokenErr) {
      console.error("Failed to cancel review request tokens:", tokenErr);
    } else if (cancelledTokens && cancelledTokens.length > 0) {
      console.log(`Cancelled ${cancelledTokens.length} review request token(s) for order ${orderId}`);
    }

    // NOTE: Cancellation email sending is disabled for now.
    // The branded order-cancelled template exists and is registered,
    // but Shopify's native cancellation notification cannot be suppressed yet.
    // Re-enable this block when ready to switch.

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cancel webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
