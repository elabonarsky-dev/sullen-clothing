import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get artists with portrait_url but no stored_portrait_url
    const { data: artists, error: fetchErr } = await supabase
      .from("artist_profiles")
      .select("slug, portrait_url, stored_portrait_url")
      .not("portrait_url", "is", null)
      .is("stored_portrait_url", null);

    if (fetchErr) throw fetchErr;

    let uploaded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const artist of artists || []) {
      if (!artist.portrait_url) continue;

      try {
        // Download the image
        const imgRes = await fetch(artist.portrait_url);
        if (!imgRes.ok) {
          // Try sullen proxy fallback
          const altUrl = artist.portrait_url
            .replace("https://cdn.shopify.com/s/files/1/1096/0120/", "https://www.sullenclothing.com/cdn/shop/")
            .replace("https://www.sullenclothing.com/cdn/shop/", "https://cdn.shopify.com/s/files/1/1096/0120/");
          const altRes = await fetch(altUrl);
          if (!altRes.ok) {
            errors.push(`${artist.slug}: HTTP ${imgRes.status}`);
            failed++;
            continue;
          }
          // Use alt response
          const blob = await altRes.blob();
          await uploadBlob(supabase, artist.slug, blob);
          uploaded++;
          continue;
        }

        const blob = await imgRes.blob();
        await uploadBlob(supabase, artist.slug, blob);
        uploaded++;

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 300));
      } catch (err: any) {
        errors.push(`${artist.slug}: ${err.message}`);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, uploaded, failed, total: artists?.length || 0, errors: errors.slice(0, 20) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("upload-artist-portraits error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function uploadBlob(supabase: any, slug: string, blob: Blob) {
  const contentType = blob.type || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const path = `${slug}.${ext}`;

  // Upload to storage
  const { error: upErr } = await supabase.storage
    .from("artist-portraits")
    .upload(path, blob, { upsert: true, contentType });
  if (upErr) throw upErr;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("artist-portraits")
    .getPublicUrl(path);

  // Update DB
  const { error: dbErr } = await supabase
    .from("artist_profiles")
    .update({ stored_portrait_url: urlData.publicUrl })
    .eq("slug", slug);
  if (dbErr) throw dbErr;
}
