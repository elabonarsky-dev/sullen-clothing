import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Strip HTML tags and decode entities */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface ArticleEntry {
  handle: string;
  title: string;
  contentHtml: string;
}

/** Parse Atom XML feed entries (simple regex-based parser) */
function parseAtomEntries(xml: string): ArticleEntry[] {
  const entries: ArticleEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    // Extract handle from <id> or <link> URL
    const idMatch = entryXml.match(/<id>([^<]+)<\/id>/);
    const linkMatch = entryXml.match(/<link[^>]+href="([^"]+)"/);
    const url = idMatch?.[1] || linkMatch?.[1] || "";
    const handle = url.split("/").pop() || "";

    // Extract title
    const titleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch?.[1] || "";

    // Extract content from CDATA
    const contentMatch = entryXml.match(
      /<content[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/content>/
    );
    const contentHtml = contentMatch?.[1] || "";

    if (handle && title) {
      entries.push({ handle, title, contentHtml });
    }
  }

  return entries;
}

/** Fetch all articles from the public Atom feed with pagination */
async function fetchAllArticles(): Promise<ArticleEntry[]> {
  const allArticles: ArticleEntry[] = [];
  let page = 1;
  const seenHandles = new Set<string>();

  while (true) {
    const url = `https://www.sullenclothing.com/blogs/artists.atom?page=${page}`;
    console.log(`Fetching Atom feed page ${page}...`);

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Feed page ${page} returned ${res.status}`);
      break;
    }

    const xml = await res.text();
    const entries = parseAtomEntries(xml);

    if (entries.length === 0) break;

    let newCount = 0;
    for (const entry of entries) {
      if (!seenHandles.has(entry.handle)) {
        seenHandles.add(entry.handle);
        allArticles.push(entry);
        newCount++;
      }
    }

    // If no new entries, we've exhausted the feed
    if (newCount === 0) break;

    page++;

    // Safety limit
    if (page > 30) break;
  }

  return allArticles;
}

/** Extract Instagram handle from HTML content */
function extractInstagram(html: string): string | null {
  const igMatch = html.match(
    /instagram\.com\/([a-zA-Z0-9_.]+)/i
  );
  if (igMatch) return `@${igMatch[1]}`;

  const atMatch = html.match(/@([a-zA-Z0-9_.]{3,30})/);
  return atMatch ? `@${atMatch[1]}` : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all articles from Atom feed
    const allArticles = await fetchAllArticles();
    console.log(`Fetched ${allArticles.length} total articles from Atom feed`);

    let profilesUpdated = 0;
    let profilesCreated = 0;
    let storiesUpdated = 0;
    let skipped = 0;

    for (const article of allArticles) {
      const slug = article.handle;
      const cleanText = stripHtml(article.contentHtml);

      if (!cleanText || cleanText.length < 50) {
        skipped++;
        continue;
      }

      // Split into paragraphs for sections
      const paragraphs = cleanText
        .split("\n\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 20);

      // Bio: first ~4 paragraphs, max 2000 chars
      const bio = paragraphs.slice(0, 4).join("\n\n").substring(0, 2000);

      // Derive name from title
      const name =
        article.title
          .replace(/[:–—|].+$/, "")
          .replace(/\s+/g, " ")
          .trim() ||
        slug
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());

      // Try to extract Instagram
      const instagram = extractInstagram(article.contentHtml);

      // Check existing profile
      const { data: existing } = await supabase
        .from("artist_profiles")
        .select("slug, bio, instagram")
        .eq("slug", slug)
        .maybeSingle();

      if (existing) {
        const currentBio = existing.bio || "";
        const needsBioUpdate =
          !currentBio ||
          currentBio.length < 50 ||
          currentBio.includes("ERR_BLOCKED") ||
          currentBio.includes("blocked by an extension") ||
          currentBio.includes("Please note: This website") ||
          currentBio.includes("Your cart is empty") ||
          (currentBio.includes("www.sullenclothing.com") &&
            currentBio.includes("blocked"));

        const updates: Record<string, any> = {};
        if (needsBioUpdate) {
          updates.bio = bio;
          updates.name = name;
        }
        if (!existing.instagram && instagram) {
          updates.instagram = instagram;
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("artist_profiles")
            .update(updates)
            .eq("slug", slug);
          if (!error) profilesUpdated++;
          else console.error(`Update error ${slug}:`, error);
        }
      } else {
        const { error } = await supabase.from("artist_profiles").insert({
          slug,
          name,
          bio,
          instagram,
        });
        if (!error) profilesCreated++;
        else console.error(`Insert error ${slug}:`, error);
      }

      // Upsert stories
      const sections = paragraphs.map((text) => ({ text }));
      const { error: storyErr } = await supabase
        .from("artist_stories")
        .upsert(
          {
            slug,
            name,
            title: article.title,
            sections: JSON.stringify(sections),
            source_url: `https://www.sullenclothing.com/blogs/artists/${slug}`,
            scraped_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        );
      if (!storyErr) storiesUpdated++;
    }

    const result = {
      success: true,
      totalArticles: allArticles.length,
      skipped,
      profilesUpdated,
      profilesCreated,
      storiesUpdated,
      message: `Synced ${allArticles.length} articles. Updated ${profilesUpdated} profiles, created ${profilesCreated} new, updated ${storiesUpdated} stories. Skipped ${skipped} short articles.`,
    };

    console.log(result.message);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
