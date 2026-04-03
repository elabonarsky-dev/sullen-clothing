/**
 * shopify-oauth-callback
 * 
 * Handles OAuth for the Shopify Returns Portal app.
 * 1. Initial app load (no code) → 302 redirect to Shopify OAuth authorize
 * 2. Callback (with code) → exchange for token, store it, redirect to admin
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const SCOPES = "read_orders,write_orders";
const LOVABLE_ADMIN_URL = "https://spotlight-to-cart.lovable.app/admin";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const params = url.searchParams;
  const code = params.get("code");
  const shop = params.get("shop") || SHOPIFY_STORE;

  const clientId = Deno.env.get("SHOPIFY_APP_CLIENT_ID");
  const clientSecret = Deno.env.get("SHOPIFY_APP_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "Missing app credentials" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const redirectUri = `${supabaseUrl}/functions/v1/shopify-oauth-callback`;

  // Step 2: OAuth callback with authorization code
  if (code) {
    try {
      const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Token exchange failed:", errText);
        return new Response(JSON.stringify({ error: "Token exchange failed", details: errText }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const tokenData = await tokenRes.json();
      console.log("OAuth token exchange successful. Scopes:", tokenData.scope);

      // Store the access token in site_settings
      const supabase = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { error: upsertError } = await supabase
        .from("site_settings")
        .upsert(
          { key: "shopify_returns_token", value: tokenData.access_token },
          { onConflict: "key" }
        );

      if (upsertError) {
        console.error("Failed to store token:", upsertError.message);
      } else {
        console.log("Shopify returns token stored successfully");
      }

      // Redirect to admin dashboard
      return new Response(null, {
        status: 302,
        headers: { Location: LOVABLE_ADMIN_URL },
      });
    } catch (err) {
      console.error("OAuth error:", err);
      return new Response(JSON.stringify({ error: (err as Error).message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Step 1: Initial app load — redirect to Shopify OAuth
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  console.log("Redirecting to Shopify OAuth:", authUrl);

  return new Response(null, {
    status: 302,
    headers: { Location: authUrl },
  });
});
