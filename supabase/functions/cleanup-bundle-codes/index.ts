import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SHOPIFY_DOMAIN = "sullenclothing.myshopify.com";
const SHOPIFY_API_VERSION = "2026-01";

interface DiscountNode {
  id: string;
  title: string;
  endsAt: string | null;
  usageLimit: number | null;
  asyncUsageCount: number;
}

/**
 * Fetches bundle discount codes that are expired or fully used,
 * then deletes them from Shopify to prevent accumulation.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let shopifyToken = Deno.env.get("SHOPIFY_ACCESS_TOKEN") || "";
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: tokenSetting } = await sb
      .from("site_settings").select("value").eq("key", "shopify_returns_token").single();
    if (tokenSetting?.value) shopifyToken = tokenSetting.value;
  } catch (_) { /* use env var */ }
  if (!shopifyToken) {
    return new Response(
      JSON.stringify({ error: "Shopify not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Search for discount codes with "Bundle Consolidation" in title
    const searchQuery = `
      query ($first: Int!, $query: String, $after: String) {
        codeDiscountNodes(first: $first, query: $query, after: $after) {
          edges {
            node {
              id
              codeDiscount {
                ... on DiscountCodeBasic {
                  title
                  endsAt
                  usageLimit
                  asyncUsageCount
                }
              }
            }
            cursor
          }
          pageInfo { hasNextPage }
        }
      }
    `;

    let deletedCount = 0;
    let skippedCount = 0;
    let hasNextPage = true;
    let after: string | null = null;
    const now = new Date();

    while (hasNextPage) {
      const variables: Record<string, unknown> = {
        first: 50,
        query: "title:Bundle Consolidation",
      };
      if (after) variables.after = after;

      const res = await fetch(
        `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": shopifyToken,
          },
          body: JSON.stringify({ query: searchQuery, variables }),
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        console.error("Shopify search error:", errBody);
        break;
      }

      const json = await res.json();
      const edges = json?.data?.codeDiscountNodes?.edges || [];
      hasNextPage = json?.data?.codeDiscountNodes?.pageInfo?.hasNextPage ?? false;

      if (edges.length === 0) break;
      after = edges[edges.length - 1].cursor;

      // Collect IDs to delete: expired OR fully used
      const idsToDelete: string[] = [];

      for (const edge of edges) {
        const discount = edge.node.codeDiscount as DiscountNode | null;
        if (!discount) continue;

        const expired = discount.endsAt && new Date(discount.endsAt) < now;
        const fullyUsed =
          discount.usageLimit != null &&
          discount.asyncUsageCount >= discount.usageLimit;

        if (expired || fullyUsed) {
          idsToDelete.push(edge.node.id);
        } else {
          skippedCount++;
        }
      }

      // Batch delete (Shopify allows one at a time via mutation)
      for (const id of idsToDelete) {
        const deleteRes = await fetch(
          `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": shopifyToken,
            },
            body: JSON.stringify({
              query: `mutation discountCodeDelete($id: ID!) {
                discountCodeDelete(id: $id) {
                  deletedCodeDiscountId
                  userErrors { field message }
                }
              }`,
              variables: { id },
            }),
          }
        );

        if (deleteRes.ok) {
          const delJson = await deleteRes.json();
          const userErrors = delJson?.data?.discountCodeDelete?.userErrors;
          if (userErrors && userErrors.length > 0) {
            console.error(`Failed to delete ${id}:`, userErrors);
          } else {
            deletedCount++;
          }
        } else {
          console.error(`HTTP error deleting ${id}:`, deleteRes.status);
        }
      }
    }

    console.log(
      `Cleanup complete: deleted=${deletedCount}, active=${skippedCount}`
    );

    // Log to database
    await logCleanup("cleanup-bundle-codes", deletedCount, skippedCount, null);

    return new Response(
      JSON.stringify({ deleted: deletedCount, active: skippedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Cleanup error:", err);

    await logCleanup("cleanup-bundle-codes", 0, 0, errorMsg);

    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function logCleanup(
  functionName: string,
  deletedCount: number,
  activeCount: number,
  error: string | null
) {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await supabase.from("cleanup_logs").insert({
      function_name: functionName,
      deleted_count: deletedCount,
      active_count: activeCount,
      error,
    });
  } catch (logErr) {
    console.error("Failed to log cleanup result:", logErr);
  }
}
