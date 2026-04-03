import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://www.sullenclothing.com";
const SHOPIFY_API_VERSION = "2025-07";
const SHOPIFY_STORE = "sullenclothing.myshopify.com";
const STOREFRONT_URL = `https://${SHOPIFY_STORE}/api/${SHOPIFY_API_VERSION}/graphql.json`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Static pages with priorities ──────────────────────────────────────
const STATIC_PAGES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/collections", priority: "0.9", changefreq: "weekly" },
  { path: "/collections/men", priority: "0.9", changefreq: "daily" },
  { path: "/collections/women", priority: "0.9", changefreq: "daily" },
  { path: "/collections/lifestyle", priority: "0.9", changefreq: "daily" },
  { path: "/collections/artists", priority: "0.8", changefreq: "weekly" },
  { path: "/pages/about-us", priority: "0.6", changefreq: "monthly" },
  { path: "/pages/faq", priority: "0.5", changefreq: "monthly" },
  { path: "/pages/reviews", priority: "0.6", changefreq: "weekly" },
  { path: "/pages/shipping-rates", priority: "0.4", changefreq: "monthly" },
  { path: "/pages/rewards", priority: "0.5", changefreq: "monthly" },
  { path: "/pages/warranty-returns", priority: "0.5", changefreq: "monthly" },
  { path: "/pages/military-discount", priority: "0.4", changefreq: "monthly" },
  { path: "/pages/sullen-angels", priority: "0.5", changefreq: "monthly" },
  { path: "/pages/tattoo-stencils", priority: "0.5", changefreq: "monthly" },
  { path: "/pages/privacy-policy", priority: "0.3", changefreq: "yearly" },
  { path: "/pages/terms-of-service", priority: "0.3", changefreq: "yearly" },
  { path: "/pages/ccpa-opt-out", priority: "0.3", changefreq: "yearly" },
  { path: "/support", priority: "0.4", changefreq: "monthly" },
  { path: "/vault", priority: "0.5", changefreq: "monthly" },
  { path: "/5-random-tees", priority: "0.6", changefreq: "weekly" },
  { path: "/wishlist", priority: "0.3", changefreq: "monthly" },
  { path: "/returns", priority: "0.4", changefreq: "monthly" },
  { path: "/track", priority: "0.3", changefreq: "monthly" },
];

// ── Shopify Storefront API helper ─────────────────────────────────────
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Storefront API ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (data.errors) {
    throw new Error(`Storefront GQL errors: ${JSON.stringify(data.errors)}`);
  }
  return data.data;
}

// ── Fetch all products with cursor pagination ─────────────────────────
async function fetchAllProducts(): Promise<Array<{ handle: string; updatedAt: string }>> {
  const products: Array<{ handle: string; updatedAt: string }> = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const data = await storefrontQuery(
      `query ($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              handle
              updatedAt
            }
          }
        }
      }`,
      { first: 250, after: cursor }
    );

    for (const edge of data.products.edges) {
      products.push({
        handle: edge.node.handle,
        updatedAt: edge.node.updatedAt,
      });
    }

    hasNext = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  return products;
}

// ── Fetch all collections with cursor pagination ──────────────────────
async function fetchAllCollections(): Promise<Array<{ handle: string; updatedAt: string }>> {
  const collections: Array<{ handle: string; updatedAt: string }> = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const data = await storefrontQuery(
      `query ($first: Int!, $after: String) {
        collections(first: $first, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              handle
              updatedAt
            }
          }
        }
      }`,
      { first: 250, after: cursor }
    );

    for (const edge of data.collections.edges) {
      collections.push({
        handle: edge.node.handle,
        updatedAt: edge.node.updatedAt,
      });
    }

    hasNext = data.collections.pageInfo.hasNextPage;
    cursor = data.collections.pageInfo.endCursor;
  }

  return collections;
}

// ── Fetch artist profiles from Supabase ───────────────────────────────
async function fetchArtistProfiles(): Promise<Array<{ slug: string; updatedAt: string }>> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) return [];

  const sb = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await sb
    .from("artist_profiles")
    .select("slug, updated_at")
    .order("name");

  if (error) {
    console.error("Error fetching artist profiles:", error.message);
    return [];
  }

  return (data || []).map((a: { slug: string; updated_at: string }) => ({
    slug: a.slug,
    updatedAt: a.updated_at,
  }));
}

// ── XML helpers ───────────────────────────────────────────────────────
function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc: string, lastmod: string | null, changefreq: string, priority: string): string {
  let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n`;
  if (lastmod) entry += `    <lastmod>${lastmod.split("T")[0]}</lastmod>\n`;
  entry += `    <changefreq>${changefreq}</changefreq>\n`;
  entry += `    <priority>${priority}</priority>\n`;
  entry += `  </url>`;
  return entry;
}

// ── Main handler ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const [products, collections, artists] = await Promise.all([
      fetchAllProducts(),
      fetchAllCollections(),
      fetchArtistProfiles(),
    ]);

    const entries: string[] = [];

    // Static pages
    for (const page of STATIC_PAGES) {
      entries.push(urlEntry(`${SITE_URL}${page.path}`, null, page.changefreq, page.priority));
    }

    // Dynamic collections (skip ones already in static list)
    const staticPaths = new Set(STATIC_PAGES.map((p) => p.path));
    for (const col of collections) {
      const path = `/collections/${col.handle}`;
      if (!staticPaths.has(path)) {
        entries.push(urlEntry(`${SITE_URL}${path}`, col.updatedAt, "weekly", "0.7"));
      }
    }

    // Dynamic products
    for (const product of products) {
      entries.push(
        urlEntry(`${SITE_URL}/product/${product.handle}`, product.updatedAt, "weekly", "0.6")
      );
    }

    // Artist profiles (route is /artist/:slug, not /artists/)
    for (const artist of artists) {
      entries.push(
        urlEntry(`${SITE_URL}/artist/${artist.slug}`, artist.updatedAt, "monthly", "0.6")
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    console.log(
      `Sitemap generated: ${STATIC_PAGES.length} static, ${collections.length} collections, ${products.length} products, ${artists.length} artists = ${entries.length} total URLs`
    );

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(`<!-- Sitemap error: ${msg} -->`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});
