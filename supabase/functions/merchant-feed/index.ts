const SITE_URL = "https://www.sullenclothing.com";
const SHOPIFY_API_VERSION = "2025-07";
const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const STOREFRONT_URL = `https://${SHOPIFY_STORE}/api/${SHOPIFY_API_VERSION}/graphql.json`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function storefrontQuery(query: string, variables: Record<string, unknown> = {}) {
  const token = Deno.env.get("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
  if (!token) throw new Error("SHOPIFY_STOREFRONT_ACCESS_TOKEN not set");

  const res = await fetch(STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`Storefront API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (data.errors) throw new Error(`GQL errors: ${JSON.stringify(data.errors)}`);
  return data.data;
}

const QUERY = `query ($first: Int!, $after: String) {
  products(first: $first, after: $after) {
    pageInfo { hasNextPage endCursor }
    edges { node {
      id
      handle
      variants(first: 100) {
        edges { node { id } }
      }
    } }
  }
}`;

async function fetchAllOffers(): Promise<Array<{ id: string; link: string }>> {
  const offers: Array<{ id: string; link: string }> = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const data = await storefrontQuery(QUERY, { first: 250, after: cursor });
    for (const edge of data.products.edges) {
      const productNumericId = edge.node.id.split("/").pop();
      const handle = edge.node.handle;
      const link = `${SITE_URL}/product/${handle}`;

      for (const variantEdge of edge.node.variants.edges) {
        const variantNumericId = variantEdge.node.id.split("/").pop();
        offers.push({
          id: `shopify_US_${productNumericId}_${variantNumericId}`,
          link,
        });
      }
    }
    hasNext = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return offers;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const offers = await fetchAllOffers();

    const lines = ["id,link"];
    for (const o of offers) {
      lines.push(`${o.id},${o.link}`);
    }
    const csv = lines.join("\n");

    console.log(`Merchant feed generated: ${offers.length} offers`);

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="merchant-feed.csv"',
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Merchant feed error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
