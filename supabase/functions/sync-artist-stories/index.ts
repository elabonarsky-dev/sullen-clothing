import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Extract slug from a Sullen blog artist URL */
function slugFromUrl(url: string): string | null {
  const m = url.match(/\/blogs\/artists\/([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : null;
}

/** Parse scraped markdown into structured sections */
function parseSections(md: string): { heading?: string; text: string }[] {
  const sections: { heading?: string; text: string }[] = [];
  // Split on ## headings
  const parts = md.split(/^## /m);

  for (let i = 0; i < parts.length; i++) {
    let part = parts[i].trim();
    if (!part) continue;

    // Skip navigation/boilerplate sections
    if (/^(Read more|Featured collection|NEW RELEASES|Contact|Book with|art gallery)/i.test(part)) continue;
    if (part.includes("Choose options") || part.includes("Sale price")) continue;

    if (i === 0) {
      // Intro text before first ## — strip the # title lines
      const lines = part.split("\n").filter(
        (l) => !l.startsWith("# ") && !l.startsWith("### ") && !l.startsWith("[") && !l.startsWith("![") && !l.startsWith("Share") && !l.startsWith("Article:") && !l.startsWith("Cart") && !l.startsWith("Your cart") && !l.startsWith("Skip") && !l.startsWith("My Wishlist") && l.trim() !== "" && !/^\w{3} \d{1,2}, \d{4}$/.test(l.trim())
      );
      const text = lines.join("\n\n").trim();
      if (text.length > 40) sections.push({ text });
    } else {
      const newlineIdx = part.indexOf("\n");
      if (newlineIdx === -1) continue;
      const heading = part.slice(0, newlineIdx).trim();
      // Skip boilerplate headings
      if (/^(Read more|Featured collection|NEW RELEASES|Contact|Book with|art gallery)/i.test(heading)) continue;
      const body = part
        .slice(newlineIdx)
        .split("\n")
        .filter((l) => !l.startsWith("[![") && !l.startsWith("![") && !l.includes("Choose options") && !l.includes("Sale price") && !l.startsWith("[(") && !l.startsWith("* * *") && !l.startsWith("Written by") && l.trim() !== "")
        .join("\n\n")
        .trim();
      if (body.length > 20) sections.push({ heading, text: body });
    }
  }
  return sections;
}

/** Extract display title from markdown (first # heading that looks like a title) */
function extractTitle(md: string, fallbackName: string): string {
  const match = md.match(/^# (.+)/m);
  if (match) {
    // Skip if it's just the name repeated, look for subtitle pattern
    const lines = md.match(/^# .+/gm) || [];
    // Prefer the longer/more descriptive one
    for (const l of lines) {
      const t = l.replace(/^# /, "").trim();
      if (t.includes(":") || t.length > fallbackName.length + 5) return t;
    }
    return lines[0]?.replace(/^# /, "").trim() || fallbackName;
  }
  return fallbackName;
}

/** Extract artist name from markdown */
function extractName(md: string): string {
  const match = md.match(/^### (.+)/m) || md.match(/^# ([^:]+)/m);
  return match ? match[1].trim() : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Map the blog to discover all artist URLs
    console.log("Mapping sullenclothing.com/blogs/artists...");
    const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://www.sullenclothing.com/blogs/artists",
        limit: 5000,
        includeSubdomains: false,
      }),
    });

    const mapData = await mapRes.json();
    if (!mapRes.ok) {
      console.error("Map failed:", mapData);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to map blog", details: mapData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allLinks: string[] = (mapData.links || []).filter(
      (url: string) =>
        url.match(/\/blogs\/artists\/[a-z0-9-]+$/i) &&
        !url.endsWith("/blogs/artists") &&
        !url.includes("tagged")
    );

    console.log(`Found ${allLinks.length} artist blog URLs`);

    // Step 2: Check which slugs we already have
    const { data: existing } = await supabase
      .from("artist_stories")
      .select("slug");
    const existingSlugs = new Set((existing || []).map((r: { slug: string }) => r.slug));

    const newLinks = allLinks.filter((url) => {
      const slug = slugFromUrl(url);
      return slug && !existingSlugs.has(slug);
    });

    console.log(`${newLinks.length} new artists to scrape`);

    if (newLinks.length === 0) {
      return new Response(
        JSON.stringify({ success: true, scraped: 0, total: allLinks.length, message: "All artists already synced" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Scrape new artist pages (batch up to 20 at a time to avoid timeouts)
    const toScrape = newLinks.slice(0, 20);
    let scraped = 0;

    for (const url of toScrape) {
      const slug = slugFromUrl(url);
      if (!slug) continue;

      try {
        console.log(`Scraping: ${slug}`);
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        const scrapeData = await scrapeRes.json();
        if (!scrapeRes.ok) {
          console.error(`Failed to scrape ${slug}:`, scrapeData);
          continue;
        }

        const md = scrapeData.data?.markdown || scrapeData.markdown || "";
        if (!md || md.length < 100) {
          console.log(`Skipping ${slug}: content too short`);
          continue;
        }

        const name = extractName(md) || slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const title = extractTitle(md, name);
        const sections = parseSections(md);

        if (sections.length === 0) {
          console.log(`Skipping ${slug}: no valid sections parsed`);
          continue;
        }

        const { error: upsertErr } = await supabase.from("artist_stories").upsert(
          {
            slug,
            name,
            title,
            sections: JSON.stringify(sections),
            source_url: url,
            scraped_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        );

        if (upsertErr) {
          console.error(`DB error for ${slug}:`, upsertErr);
        } else {
          scraped++;
        }
      } catch (e) {
        console.error(`Error scraping ${slug}:`, e);
      }
    }

    const remaining = newLinks.length - toScrape.length;
    return new Response(
      JSON.stringify({
        success: true,
        scraped,
        total: allLinks.length,
        remaining,
        message: remaining > 0
          ? `Scraped ${scraped} new artists. ${remaining} more remaining — run sync again to continue.`
          : `Scraped ${scraped} new artists. All caught up!`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
