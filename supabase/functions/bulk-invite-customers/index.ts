import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
    try {
      const adminSb = createClient(supabaseUrl, supabaseServiceKey);
      const { data: tokenSetting } = await adminSb
        .from("site_settings").select("value").eq("key", "shopify_returns_token").single();
      if (tokenSetting?.value) shopifyToken = tokenSetting.value;
    } catch (_) { /* use env var */ }
    const shopifyStore = "sullenclothing.myshopify.com";

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun ?? true;
    const batchSize = Math.min(body.batchSize ?? 50, 100);

    // Fetch all existing auth users to skip duplicates
    const existingEmails = new Set<string>();
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const { data: { users: authUsers }, error: listErr } =
        await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (listErr || !authUsers || authUsers.length === 0) {
        hasMore = false;
      } else {
        for (const u of authUsers) {
          if (u.email) existingEmails.add(u.email.toLowerCase());
        }
        if (authUsers.length < 1000) hasMore = false;
        page++;
      }
    }

    // Fetch Shopify customers (paginated)
    const shopifyCustomers: { email: string; first_name: string; last_name: string }[] = [];
    let nextPageUrl: string | null =
      `https://${shopifyStore}/admin/api/2025-07/customers.json?limit=250&fields=email,first_name,last_name`;

    while (nextPageUrl) {
      const res = await fetch(nextPageUrl, {
        headers: {
          "X-Shopify-Access-Token": shopifyToken,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Shopify API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      for (const c of data.customers || []) {
        if (c.email && !existingEmails.has(c.email.toLowerCase())) {
          shopifyCustomers.push({
            email: c.email,
            first_name: c.first_name || "",
            last_name: c.last_name || "",
          });
        }
      }

      // Parse Link header for pagination
      const linkHeader = res.headers.get("link");
      nextPageUrl = null;
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        if (nextMatch) {
          nextPageUrl = nextMatch[1];
        }
      }
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          totalShopifyCustomers: shopifyCustomers.length + existingEmails.size,
          alreadyHaveAccounts: existingEmails.size,
          newCustomersToInvite: shopifyCustomers.length,
          sampleEmails: shopifyCustomers.slice(0, 10).map((c) => c.email),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Process invitations in batches
    let invited = 0;
    let skipped = 0;
    let errors: string[] = [];

    const batch = shopifyCustomers.slice(0, batchSize);

    for (const customer of batch) {
      try {
        const { error: inviteErr } =
          await adminClient.auth.admin.inviteUserByEmail(customer.email, {
            data: {
              full_name: `${customer.first_name} ${customer.last_name}`.trim(),
              source: "shopify_migration",
            },
          });

        if (inviteErr) {
          if (inviteErr.message?.includes("already been registered")) {
            skipped++;
          } else {
            errors.push(`${customer.email}: ${inviteErr.message}`);
          }
        } else {
          invited++;
        }

        // Rate limit: ~2 per second to avoid overwhelming email system
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        errors.push(
          `${customer.email}: ${e instanceof Error ? e.message : "Unknown error"}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        dryRun: false,
        invited,
        skipped,
        errors: errors.slice(0, 20),
        remaining: shopifyCustomers.length - batchSize,
        totalToInvite: shopifyCustomers.length,
        batchProcessed: batch.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("bulk-invite error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
