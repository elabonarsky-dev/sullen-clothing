import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { directoryArtists, type DirectoryArtist } from "@/data/artistDirectory";
import { shopifyImg } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, Save, Plus, Trash2, MapPin, Instagram, Palette,
  Image, X, Loader2, ChevronDown, ChevronUp, Mic, UserPlus, CheckCircle, Clock, Merge,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PendingArtistSubmission {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  location?: string | null;
  instagram?: string | null;
  specialty?: string | null;
  styles?: string[];
  portrait_url?: string | null;
  studio?: string | null;
  booking_info?: string | null;
  gallery_images?: string[];
  interview?: { question: string; answer: string }[];
}

interface InterviewQA {
  question: string;
  answer: string;
}

interface ArtistProfileRow {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  long_bio: string | null;
  location: string | null;
  instagram: string | null;
  specialty: string | null;
  styles: string[];
  gallery_images: string[];
  portrait_url: string | null;
  stored_portrait_url: string | null;
  studio: string | null;
  booking_info: string | null;
  interview: InterviewQA[] | null;
}

const COMMON_STYLES = [
  "Realism", "Black & Grey", "Neo-Trad", "Japanese", "Traditional",
  "Illustrative", "Chicano", "Lettering", "Color Realism", "Blackwork",
  "Geometric", "Watercolor", "Dotwork", "Surrealism", "Anime",
  "Minimalist", "Ornamental", "Biomechanical", "Trash Polka", "Fine Line",
];

const toSeoSlug = (value?: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

interface ArtistProfileManagerProps {
  canDelete?: boolean;
}

export function ArtistProfileManager({ canDelete = true }: ArtistProfileManagerProps) {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<ArtistProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<ArtistProfileRow>>>({});
  const [newGalleryUrl, setNewGalleryUrl] = useState<Record<string, string>>({});
  const [uploadingPortrait, setUploadingPortrait] = useState<string | null>(null);
  const [newStyle, setNewStyle] = useState<Record<string, string>>({});
  const [showAddNew, setShowAddNew] = useState(false);
  const [newArtist, setNewArtist] = useState({ name: "", slug: "", instagram: "", specialty: "", location: "", portrait_url: "", bio: "" });
  const [newArtistFile, setNewArtistFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showMissingPhotos, setShowMissingPhotos] = useState(false);

  const [pendingSubmissions, setPendingSubmissions] = useState<PendingArtistSubmission[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles().then(() => fetchPendingSubmissions());
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("artist_profiles")
      .select("*")
      .order("name");
    if (error) toast.error("Failed to load profiles");
    else {
      setProfiles((data || []).map((d: any) => ({
        ...d,
        interview: Array.isArray(d.interview) ? d.interview : [],
      })) as ArtistProfileRow[]);
    }
    setLoading(false);
  };

  const fetchPendingSubmissions = async () => {
    setPendingLoading(true);
    try {
      // Fetch current profiles from DB to avoid stale state race condition
      const { data: currentProfiles } = await supabase
        .from("artist_profiles")
        .select("slug");
      const existingSlugs = new Set((currentProfiles || []).map((p: any) => toSeoSlug(p.slug)));
      const dirSlugs = new Set(directoryArtists.map((a) => toSeoSlug(a.slug)));

      const res = await fetch(`https://fotwsyencyyckbkfribu.supabase.co/functions/v1/get-approved-artists`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const incoming = Array.isArray(data) ? data : data?.artists || [];
      const pending = incoming
        .map((a: any) => ({ ...a, slug: toSeoSlug(a.name || a.slug) }))
        .filter((a: any) => a.slug && !existingSlugs.has(a.slug) && !dirSlugs.has(a.slug));
      setPendingSubmissions(pending);
    } catch (err) {
      console.error("Failed to fetch pending submissions:", err);
    }
    setPendingLoading(false);
  };

  const handleApproveSubmission = async (submission: PendingArtistSubmission) => {
    setApprovingId(submission.id);
    const slug = toSeoSlug(submission.name || submission.slug);

    // Translate interview if present
    let interviewData: any[] = submission.interview || [];
    if (interviewData.length > 0) {
      toast.info(`Translating ${submission.name}'s interview…`);
      try {
        const { data: txData, error: txError } = await supabase.functions.invoke("translate-interview", {
          body: { interview: interviewData, artist_name: submission.name },
        });
        if (txError) {
          console.error("Translation error:", txError);
          toast.warning("Translation failed — saving original interview text");
        } else if (txData?.translated && txData.translated.length > 0) {
          interviewData = txData.translated;
          const lang = txData.original_language || "unknown";
          if (lang.toLowerCase() !== "english") {
            toast.success(`Interview translated from ${lang} to English`);
          }
        }
      } catch (err) {
        console.error("Translation call failed:", err);
        toast.warning("Translation unavailable — saving original text");
      }
    }

    // Generate short + long bios via AI
    let shortBio = submission.bio || null;
    let longBio: string | null = null;
    toast.info(`Generating bios for ${submission.name}…`);
    try {
      const { data: bioData, error: bioError } = await supabase.functions.invoke("generate-artist-bio", {
        body: {
          name: submission.name,
          specialty: submission.specialty,
          styles: submission.styles,
          location: submission.location,
          studio: submission.studio,
          instagram: submission.instagram,
          interview: interviewData,
        },
      });
      if (bioError) {
        console.error("Bio generation error:", bioError);
        toast.warning("Bio generation failed — using submitted bio");
      } else if (bioData?.short_bio) {
        shortBio = bioData.short_bio;
        longBio = bioData.long_bio || null;
        toast.success("Bios generated successfully");
      }
    } catch (err) {
      console.error("Bio generation call failed:", err);
      toast.warning("Bio generation unavailable — using submitted bio");
    }

    const { error } = await supabase
      .from("artist_profiles")
      .insert({
        slug,
        name: submission.name,
        bio: shortBio,
        long_bio: longBio,
        location: submission.location || null,
        instagram: submission.instagram || null,
        specialty: submission.specialty || null,
        styles: submission.styles || [],
        gallery_images: submission.gallery_images || [],
        portrait_url: submission.portrait_url || null,
        studio: submission.studio || null,
        booking_info: submission.booking_info || null,
        interview: interviewData as any,
      });

    if (error) {
      if (error.code === "23505") toast.error("Artist with that slug already exists");
      else toast.error("Approval failed: " + error.message);
    } else {
      toast.success(`${submission.name} approved and added!`);
      setPendingSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      await fetchProfiles();
    }
    setApprovingId(null);
  };

  // Re-filter pending when profiles change
  useEffect(() => {
    if (profiles.length > 0 && pendingSubmissions.length > 0) {
      const existingSlugs = new Set(profiles.map((p) => p.slug));
      setPendingSubmissions((prev) => prev.filter((s) => !existingSlugs.has(s.slug)));
    }
  }, [profiles]);

  // Get DB-only artists not in the static directory
  const dbOnlyProfiles = useMemo(() => {
    const directorySlugs = new Set(directoryArtists.map((a) => a.slug));
    return profiles.filter((p) => !directorySlugs.has(p.slug));
  }, [profiles]);

  // Merge directory artists + db-only artists for the list
  const artistList = useMemo(() => {
    const profileMap = new Map(profiles.map((p) => [p.slug, p]));
    const normalizeText = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const q = normalizeText(search).trim();

    // Convert directory artists to a common shape
    const directoryItems = directoryArtists.map((a) => ({
      slug: a.slug,
      name: a.name,
      portrait: a.portrait,
      location: a.location,
      instagram: a.instagram,
      specialty: a.specialty,
      styles: a.styles,
      bio: a.bio,
      galleryImages: a.galleryImages,
      studio: a.studio,
      bookingInfo: a.bookingInfo,
      isDbOnly: false,
    }));

    // DB-only artists
    const dbItems = dbOnlyProfiles.map((p) => ({
      slug: p.slug,
      name: p.name,
      portrait: p.stored_portrait_url || (p.portrait_url ? shopifyImg(p.portrait_url) : ""),
      location: p.location || undefined,
      instagram: p.instagram || undefined,
      specialty: p.specialty || undefined,
      styles: p.styles || [],
      bio: p.bio || "",
      galleryImages: p.gallery_images || [],
      studio: p.studio || undefined,
      bookingInfo: p.booking_info || undefined,
      isDbOnly: true,
    }));

    const all = [...directoryItems, ...dbItems];

    return all
      .filter((a) => {
        if (!q) return true;
        const p = profileMap.get(a.slug);
        return (
          normalizeText(a.name).includes(q) ||
          normalizeText(a.slug).includes(q) ||
          normalizeText(a.instagram || "").includes(q) ||
          normalizeText(p?.location || a.location || "").includes(q)
        );
      })
      .slice(0, 50);
  }, [search, profiles, dbOnlyProfiles]);

  const getDraft = (slug: string): Partial<ArtistProfileRow> => drafts[slug] || {};

  const getEffective = (item: typeof artistList[0]): Partial<ArtistProfileRow> => {
    const dbRow = profiles.find((p) => p.slug === item.slug);
    const draft = getDraft(item.slug);
    return {
      slug: item.slug,
      name: item.name,
      bio: draft.bio ?? dbRow?.bio ?? item.bio ?? "",
      long_bio: draft.long_bio ?? dbRow?.long_bio ?? (item as any).fullBio ?? "",
      location: draft.location ?? dbRow?.location ?? item.location ?? "",
      instagram: draft.instagram ?? dbRow?.instagram ?? item.instagram ?? "",
      specialty: draft.specialty ?? dbRow?.specialty ?? item.specialty ?? "",
      styles: draft.styles ?? dbRow?.styles ?? item.styles ?? [],
      gallery_images: draft.gallery_images ?? dbRow?.gallery_images ?? item.galleryImages ?? [],
      portrait_url: draft.portrait_url ?? dbRow?.portrait_url ?? item.portrait ?? "",
      studio: draft.studio ?? dbRow?.studio ?? item.studio ?? "",
      booking_info: draft.booking_info ?? dbRow?.booking_info ?? item.bookingInfo ?? "",
      interview: draft.interview ?? dbRow?.interview ?? [],
    };
  };

  const updateDraft = (slug: string, updates: Partial<ArtistProfileRow>) => {
    setDrafts((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], ...updates },
    }));
  };

  const handleSave = async (item: typeof artistList[0]) => {
    const effective = getEffective(item);
    setSaving(item.slug);

    const payload = {
      slug: item.slug,
      name: item.name,
      bio: effective.bio || null,
      long_bio: effective.long_bio || null,
      location: effective.location || null,
      instagram: effective.instagram || null,
      specialty: effective.specialty || null,
      styles: effective.styles || [],
      gallery_images: effective.gallery_images || [],
      portrait_url: effective.portrait_url || null,
      studio: effective.studio || null,
      booking_info: effective.booking_info || null,
      interview: effective.interview || [],
    };

    const { error } = await supabase
      .from("artist_profiles")
      .upsert(payload as any, { onConflict: "slug" });

    if (error) {
      toast.error("Save failed: " + error.message);
    } else {
      toast.success(`${item.name} saved`);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[item.slug];
        return next;
      });
      await fetchProfiles();
    }
    setSaving(null);
  };

  const handleAddNewArtist = async () => {
    if (!newArtist.name.trim()) {
      toast.error("Artist name is required");
      return;
    }
    const slug = newArtist.slug.trim() || newArtist.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Generate bio via AI if no bio provided
    let shortBio = newArtist.bio.trim() || null;
    let longBio: string | null = null;
    if (!shortBio) {
      toast.info(`Generating bios for ${newArtist.name}…`);
      try {
        const { data: bioData, error: bioError } = await supabase.functions.invoke("generate-artist-bio", {
          body: {
            name: newArtist.name.trim(),
            instagram: newArtist.instagram.trim() || undefined,
            specialty: newArtist.specialty.trim() || undefined,
            location: newArtist.location.trim() || undefined,
          },
        });
        if (!bioError && bioData?.short_bio) {
          shortBio = bioData.short_bio;
          longBio = bioData.long_bio || null;
          toast.success("Bios generated successfully");
        }
      } catch {
        toast.warning("Bio generation unavailable");
      }
    }

    const { error } = await supabase
      .from("artist_profiles")
      .insert({
        slug,
        name: newArtist.name.trim(),
        instagram: newArtist.instagram.trim() || null,
        specialty: newArtist.specialty.trim() || null,
        location: newArtist.location.trim() || null,
        portrait_url: newArtist.portrait_url.trim() || null,
        bio: shortBio,
        long_bio: longBio,
        styles: [],
        gallery_images: [],
        interview: [],
      });

    if (error) {
      if (error.code === "23505") toast.error("An artist with that slug already exists");
      else toast.error("Failed to add: " + error.message);
    } else {
      // Upload portrait file if provided
      if (newArtistFile) {
        await handlePortraitUpload(slug, newArtistFile);
      }
      toast.success(`${newArtist.name} added!`);
      setNewArtist({ name: "", slug: "", instagram: "", specialty: "", location: "", portrait_url: "", bio: "" });
      setNewArtistFile(null);
      setShowAddNew(false);
      await fetchProfiles();
    }
  };

  const addGalleryImage = (slug: string) => {
    const url = newGalleryUrl[slug]?.trim();
    if (!url) return;
    const item = artistList.find((a) => a.slug === slug);
    if (!item) return;
    const current = getEffective(item);
    const updated = [...(current.gallery_images || []), url];
    updateDraft(slug, { gallery_images: updated });
    setNewGalleryUrl((prev) => ({ ...prev, [slug]: "" }));
  };

  const removeGalleryImage = (slug: string, index: number) => {
    const item = artistList.find((a) => a.slug === slug);
    if (!item) return;
    const current = getEffective(item);
    const updated = [...(current.gallery_images || [])];
    updated.splice(index, 1);
    updateDraft(slug, { gallery_images: updated });
  };

  const addStyle = (slug: string, style: string) => {
    if (!style.trim()) return;
    const item = artistList.find((a) => a.slug === slug);
    if (!item) return;
    const current = getEffective(item);
    const existing = current.styles || [];
    if (existing.includes(style)) return;
    updateDraft(slug, { styles: [...existing, style] });
    setNewStyle((prev) => ({ ...prev, [slug]: "" }));
  };

  const removeStyle = (slug: string, style: string) => {
    const item = artistList.find((a) => a.slug === slug);
    if (!item) return;
    const current = getEffective(item);
    updateDraft(slug, { styles: (current.styles || []).filter((s) => s !== style) });
  };

  // Interview Q&A helpers
  const getInterview = (slug: string): InterviewQA[] => {
    const item = artistList.find((a) => a.slug === slug);
    if (!item) return [];
    const effective = getEffective(item);
    return (effective.interview as InterviewQA[]) || [];
  };

  const updateInterviewQA = (slug: string, index: number, field: "question" | "answer", value: string) => {
    const interview = [...getInterview(slug)];
    interview[index] = { ...interview[index], [field]: value };
    updateDraft(slug, { interview });
  };

  const addInterviewQA = (slug: string) => {
    const interview = [...getInterview(slug), { question: "", answer: "" }];
    updateDraft(slug, { interview });
  };

  const removeInterviewQA = (slug: string, index: number) => {
    const interview = getInterview(slug).filter((_, i) => i !== index);
    updateDraft(slug, { interview });
  };


  const handleDeleteArtist = async (profile: ArtistProfileRow) => {
    if (!confirm(`Delete "${profile.name}" from the database? This cannot be undone.`)) return;
    setDeletingId(profile.id);
    const { error } = await supabase.from("artist_profiles").delete().eq("id", profile.id);
    if (error) {
      toast.error("Delete failed: " + error.message);
    } else {
      toast.success(`${profile.name} deleted`);
      await fetchProfiles();
    }
    setDeletingId(null);
  };

  const missingPhotoArtists = useMemo(() => {
    return profiles.filter((p) => !p.stored_portrait_url && !p.portrait_url);
  }, [profiles]);
  const hasDbProfile = (slug: string) => profiles.some((p) => p.slug === slug);
  const hasDraft = (slug: string) => !!drafts[slug];

  const handlePortraitUpload = async (slug: string, file: File) => {
    setUploadingPortrait(slug);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${slug}.${ext}`;
      // Remove old file if exists (ignore errors)
      await supabase.storage.from("artist-portraits").remove([path]);
      const { error: uploadError } = await supabase.storage
        .from("artist-portraits")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("artist-portraits")
        .getPublicUrl(path);
      const publicUrl = urlData.publicUrl + "?t=" + Date.now();
      // Save directly to DB
      const { error: dbError } = await supabase
        .from("artist_profiles")
        .upsert({ slug, name: artistList.find(a => a.slug === slug)?.name || slug, stored_portrait_url: publicUrl } as any, { onConflict: "slug" });
      if (dbError) throw dbError;
      toast.success("Portrait uploaded!");
      await fetchProfiles();
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || err));
    }
    setUploadingPortrait(null);
  };

  // --- Merge duplicates logic ---
  const [merging, setMerging] = useState(false);

  const duplicateGroups = useMemo(() => {
    const byName = new Map<string, ArtistProfileRow[]>();
    for (const p of profiles) {
      const key = toSeoSlug(p.name);
      if (!key) continue;
      const arr = byName.get(key) || [];
      arr.push(p);
      byName.set(key, arr);
    }
    const groups: { canonical: string; profiles: ArtistProfileRow[] }[] = [];
    for (const [key, arr] of byName) {
      if (arr.length <= 1) continue;
      groups.push({ canonical: key, profiles: arr });
    }
    return groups;
  }, [profiles]);

  const handleMergeDuplicates = async () => {
    if (duplicateGroups.length === 0) {
      toast.info("No duplicate artists found");
      return;
    }
    setMerging(true);
    let merged = 0;
    for (const group of duplicateGroups) {
      const canonical = group.profiles.find((p) => p.slug === group.canonical);
      const dupes = group.profiles.filter((p) => p.slug !== group.canonical);

      if (!canonical && dupes.length > 0) {
        const keeper = group.profiles[0];
        const rest = group.profiles.slice(1);
        for (const dupe of rest) {
          await supabase.from("artist_profiles").delete().eq("id", dupe.id);
          merged++;
        }
        await supabase
          .from("artist_profiles")
          .update({ slug: group.canonical } as any)
          .eq("id", keeper.id);
        merged++;
      } else if (canonical) {
        for (const dupe of dupes) {
          await supabase.from("artist_profiles").delete().eq("id", dupe.id);
          merged++;
        }
      }
    }
    toast.success(`Merged ${merged} duplicate record(s) across ${duplicateGroups.length} artist(s)`);
    await fetchProfiles();
    setMerging(false);
  };

  return (
    <div className="space-y-4">
      {/* Header with search + add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artists by name, location, or IG handle…"
            className="pl-10 bg-secondary/30 border-border/30 text-sm"
          />
        </div>
        <Button
          onClick={() => setShowAddNew(!showAddNew)}
          variant={showAddNew ? "secondary" : "outline"}
          size="sm"
          className="gap-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Artist
        </Button>
        {duplicateGroups.length > 0 && (
          <Button
            onClick={handleMergeDuplicates}
            variant="destructive"
            size="sm"
            className="gap-1.5 shrink-0"
            disabled={merging}
          >
            {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
            Merge {duplicateGroups.length} Duplicate{duplicateGroups.length > 1 ? "s" : ""}
          </Button>
        )}
        {missingPhotoArtists.length > 0 && (
          <Button
            onClick={() => setShowMissingPhotos(!showMissingPhotos)}
            variant={showMissingPhotos ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            <Image className="w-4 h-4" />
            {missingPhotoArtists.length} Missing Photo{missingPhotoArtists.length > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Add New Artist Form */}
      {showAddNew && (
        <div className="border border-primary/30 rounded-lg p-4 space-y-3 bg-primary/5">
          <h3 className="text-xs font-display uppercase tracking-[0.15em] text-primary font-semibold">New Artist</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Name *</label>
              <Input value={newArtist.name} onChange={(e) => setNewArtist((p) => ({ ...p, name: e.target.value }))} placeholder="Artist name" className="bg-secondary/20 border-border/30 text-sm h-9" />
            </div>
            <div>
              <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Slug (auto-generated if blank)</label>
              <Input value={newArtist.slug} onChange={(e) => setNewArtist((p) => ({ ...p, slug: e.target.value }))} placeholder="artist-slug" className="bg-secondary/20 border-border/30 text-sm h-9" />
            </div>
            <div>
              <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Instagram</label>
              <Input value={newArtist.instagram} onChange={(e) => setNewArtist((p) => ({ ...p, instagram: e.target.value }))} placeholder="@handle" className="bg-secondary/20 border-border/30 text-sm h-9" />
            </div>
            <div>
              <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Specialty</label>
              <Input value={newArtist.specialty} onChange={(e) => setNewArtist((p) => ({ ...p, specialty: e.target.value }))} placeholder="e.g. Black & Grey Realism" className="bg-secondary/20 border-border/30 text-sm h-9" />
            </div>
            <div>
              <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Location</label>
              <Input value={newArtist.location} onChange={(e) => setNewArtist((p) => ({ ...p, location: e.target.value }))} placeholder="City, State/Country" className="bg-secondary/20 border-border/30 text-sm h-9" />
            </div>
            <div>
              <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Portrait URL</label>
              <Input value={newArtist.portrait_url} onChange={(e) => setNewArtist((p) => ({ ...p, portrait_url: e.target.value }))} placeholder="https://..." className="bg-secondary/20 border-border/30 text-sm h-9" />
            </div>
            <div>
              <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Or Upload Portrait</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary/40 border border-border/30 text-xs font-display cursor-pointer hover:bg-secondary/60 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {newArtistFile ? newArtistFile.name : "Choose file"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewArtistFile(e.target.files?.[0] || null)} />
                </label>
                {newArtistFile && (
                  <button onClick={() => setNewArtistFile(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">Bio (auto-generated if blank)</label>
            <textarea
              value={newArtist.bio}
              onChange={(e) => setNewArtist((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Short artist bio... leave blank to auto-generate"
              className="w-full bg-secondary/20 border border-border/30 rounded-md text-sm p-2 min-h-[80px] resize-y text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowAddNew(false)}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={handleAddNewArtist}>
              <Plus className="w-3.5 h-3.5" /> Add Artist
            </Button>
          </div>
        </div>
      )}

      {/* Missing Photos Panel */}
      {showMissingPhotos && missingPhotoArtists.length > 0 && (
        <div className="border border-amber-500/30 rounded-lg p-4 space-y-2 bg-amber-500/5">
          <h3 className="text-xs font-display uppercase tracking-[0.15em] text-amber-500 font-semibold flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5" />
            Artists Missing Photos ({missingPhotoArtists.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {missingPhotoArtists.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSearch(p.name); setExpandedSlug(p.slug); setShowMissingPhotos(false); }}
                className="text-left p-2 rounded-md border border-border/20 bg-secondary/20 hover:bg-secondary/40 transition-colors"
              >
                <p className="text-xs font-display font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{p.slug}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pending Submissions */}
      {pendingLoading ? (
        <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading pending submissions…
        </div>
      ) : pendingSubmissions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-display uppercase tracking-[0.15em] text-primary font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Pending Approval ({pendingSubmissions.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="border border-primary/30 rounded-lg p-3 bg-primary/5 space-y-2"
              >
                <div className="flex items-start gap-3">
                  {sub.portrait_url ? (
                    <img
                      src={sub.portrait_url}
                      alt={sub.name}
                      className="w-10 h-10 rounded-full object-cover border border-border/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary/50 border border-border/20 flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs font-bold">
                      {sub.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold text-foreground truncate">{sub.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {sub.location || "No location"} · {sub.instagram || "No IG"} · {sub.specialty || "No specialty"}
                    </p>
                    {sub.styles && sub.styles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sub.styles.slice(0, 4).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[9px]">{s}</Badge>
                        ))}
                        {sub.styles.length > 4 && (
                          <Badge variant="outline" className="text-[9px]">+{sub.styles.length - 4}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {sub.bio && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{sub.bio}</p>
                )}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={approvingId === sub.id}
                    onClick={() => handleApproveSubmission(sub)}
                  >
                    {approvingId === sub.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    Approve & Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-1">
          {artistList.map((item) => {
            const isExpanded = expandedSlug === item.slug;
            const effective = getEffective(item);
            const dbRow = profiles.find((p) => p.slug === item.slug);
            const displayPortrait = dbRow?.stored_portrait_url || dbRow?.portrait_url || effective.portrait_url || item.portrait || "";
            const isSaving = saving === item.slug;
            const hasOverride = hasDbProfile(item.slug);
            const isDirty = hasDraft(item.slug);
            const interview = getInterview(item.slug);

            return (
              <div
                key={item.slug}
                className="border border-border/20 rounded-lg overflow-hidden bg-card/50"
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedSlug(isExpanded ? null : item.slug)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/30 transition-colors"
                >
                  {displayPortrait ? (
                    <img
                      src={displayPortrait}
                      alt={item.name}
                      className="w-9 h-9 rounded-full object-cover border border-border/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-secondary/50 border border-border/20 flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs font-bold">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-display font-semibold text-foreground truncate">
                        {item.name}
                      </span>
                      {item.isDbOnly && (
                        <Badge variant="outline" className="text-[9px] text-blue-500 border-blue-500/30">
                          Custom
                        </Badge>
                      )}
                      {hasOverride && !item.isDbOnly && (
                        <Badge variant="outline" className="text-[9px] text-green-500 border-green-500/30">
                          Customized
                        </Badge>
                      )}
                      {isDirty && (
                        <Badge variant="outline" className="text-[9px] text-amber-500 border-amber-500/30">
                          Unsaved
                        </Badge>
                      )}
                      {interview.length > 0 && (
                        <Badge variant="outline" className="text-[9px] text-purple-500 border-purple-500/30">
                          <Mic className="w-2.5 h-2.5 mr-0.5" />
                          Interview
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground font-body truncate block">
                      {effective.location || "No location"} · {effective.instagram || "No IG"}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {/* Expanded editor */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border/10">

                    {/* ── Section 1: Bios ── */}
                    <div className="border border-border/20 rounded-lg p-4 space-y-4 bg-secondary/5">
                      <h4 className="text-[10px] font-display uppercase tracking-[0.2em] text-primary font-semibold">
                        Artist Bios
                      </h4>

                      {/* Short Bio */}
                      <div>
                        <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">
                          Short Bio <span className="text-muted-foreground/50">(displayed on cards & directory)</span>
                        </label>
                        <textarea
                          value={effective.bio || ""}
                          onChange={(e) => updateDraft(item.slug, { bio: e.target.value })}
                          rows={3}
                          className="w-full rounded-md border border-border/30 bg-secondary/20 px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y"
                          placeholder="1-2 sentence punchy bio…"
                        />
                      </div>

                      {/* Long Bio */}
                      <div>
                        <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">
                          Long Bio <span className="text-muted-foreground/50">(SEO · "Read More" page · supports markdown)</span>
                        </label>
                        <textarea
                          value={effective.long_bio || ""}
                          onChange={(e) => updateDraft(item.slug, { long_bio: e.target.value })}
                          rows={8}
                          className="w-full rounded-md border border-border/30 bg-secondary/20 px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y"
                          placeholder="Multi-paragraph editorial bio with **markdown** formatting…"
                        />
                      </div>
                    </div>

                    {/* ── Section 2: Profile Details ── */}
                    <div className="border border-border/20 rounded-lg p-4 space-y-4 bg-secondary/5">
                      <h4 className="text-[10px] font-display uppercase tracking-[0.2em] text-primary font-semibold">
                        Profile Details
                      </h4>

                      {/* Location + Instagram + Specialty row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Location
                          </label>
                          <Input
                            value={effective.location || ""}
                            onChange={(e) => updateDraft(item.slug, { location: e.target.value })}
                            placeholder="City, State/Country"
                            className="bg-secondary/20 border-border/30 text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 flex items-center gap-1">
                            <Instagram className="w-3 h-3" /> Instagram
                          </label>
                          <Input
                            value={effective.instagram || ""}
                            onChange={(e) => updateDraft(item.slug, { instagram: e.target.value })}
                            placeholder="@handle"
                            className="bg-secondary/20 border-border/30 text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 flex items-center gap-1">
                            <Palette className="w-3 h-3" /> Specialty
                          </label>
                          <Input
                            value={effective.specialty || ""}
                            onChange={(e) => updateDraft(item.slug, { specialty: e.target.value })}
                            placeholder="e.g. Black & Grey Realism"
                            className="bg-secondary/20 border-border/30 text-sm h-9"
                          />
                        </div>
                      </div>

                      {/* Studio + Booking */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">
                            Studio
                          </label>
                          <Input
                            value={effective.studio || ""}
                            onChange={(e) => updateDraft(item.slug, { studio: e.target.value })}
                            placeholder="Studio name"
                            className="bg-secondary/20 border-border/30 text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-1 block">
                            Booking Info
                          </label>
                          <Input
                            value={effective.booking_info || ""}
                            onChange={(e) => updateDraft(item.slug, { booking_info: e.target.value })}
                            placeholder="Email or booking link"
                            className="bg-secondary/20 border-border/30 text-sm h-9"
                          />
                        </div>
                      </div>

                      {/* Style Tags */}
                      <div>
                        <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-2 block">
                          Style Tags
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(effective.styles || []).map((style) => (
                            <Badge
                              key={style}
                              variant="secondary"
                              className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                              onClick={() => removeStyle(item.slug, style)}
                            >
                              {style}
                              <X className="w-2.5 h-2.5" />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newStyle[item.slug] || ""}
                            onChange={(e) => setNewStyle((prev) => ({ ...prev, [item.slug]: e.target.value }))}
                            placeholder="Add style tag…"
                            className="bg-secondary/20 border-border/30 text-sm h-8 flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addStyle(item.slug, newStyle[item.slug] || "");
                              }
                            }}
                            list={`styles-${item.slug}`}
                          />
                          <datalist id={`styles-${item.slug}`}>
                            {COMMON_STYLES.filter((s) => !(effective.styles || []).includes(s)).map((s) => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => addStyle(item.slug, newStyle[item.slug] || "")}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Portrait Upload */}
                      <div>
                        <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-2 flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Portrait Image
                        </label>
                        <div className="flex items-start gap-3">
                          {/* Preview */}
                          {(profiles.find(p => p.slug === item.slug)?.stored_portrait_url || effective.portrait_url) && (
                            <img
                              src={profiles.find(p => p.slug === item.slug)?.stored_portrait_url || effective.portrait_url || ""}
                              alt={item.name}
                              className="w-16 h-16 rounded-lg object-cover border border-border/20 flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            {/* Upload button */}
                            <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border/40 bg-secondary/10 cursor-pointer hover:bg-secondary/20 transition-colors text-sm text-muted-foreground">
                              {uploadingPortrait === item.slug ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              {uploadingPortrait === item.slug ? "Uploading…" : "Upload portrait"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePortraitUpload(item.slug, file);
                                  e.target.value = "";
                                }}
                                disabled={uploadingPortrait === item.slug}
                              />
                            </label>
                            {profiles.find(p => p.slug === item.slug)?.stored_portrait_url && (
                              <p className="text-[10px] text-green-500">✓ Hosted portrait active</p>
                            )}
                            {/* Fallback URL input */}
                            <Input
                              value={effective.portrait_url || ""}
                              onChange={(e) => updateDraft(item.slug, { portrait_url: e.target.value })}
                              placeholder="Fallback URL (Shopify CDN)…"
                              className="bg-secondary/20 border-border/30 text-xs h-8"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Gallery Images */}
                      <div>
                        <label className="text-[10px] font-display uppercase tracking-[0.15em] text-muted-foreground mb-2 flex items-center gap-1">
                          <Image className="w-3 h-3" /> Gallery Images
                        </label>
                        {(effective.gallery_images || []).length > 0 && (
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-2">
                            {(effective.gallery_images || []).map((url, i) => (
                              <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-border/20">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                                <button
                                  onClick={() => removeGalleryImage(item.slug, i)}
                                  className="absolute top-0.5 right-0.5 p-0.5 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3 text-destructive" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            value={newGalleryUrl[item.slug] || ""}
                            onChange={(e) => setNewGalleryUrl((prev) => ({ ...prev, [item.slug]: e.target.value }))}
                            placeholder="Paste image URL…"
                            className="bg-secondary/20 border-border/30 text-sm h-8 flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addGalleryImage(item.slug);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => addGalleryImage(item.slug)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* ── Section 3: Artist Interview ── */}
                    <div className="border border-primary/20 rounded-lg p-4 space-y-3 bg-primary/5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-display uppercase tracking-[0.2em] text-primary font-semibold flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5" /> Artist Interview
                        </h4>
                        {interview.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">{interview.length} Q&A pairs</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground/70">
                        Q&A pairs from the artist interview. These display on the product detail page.
                      </p>

                      {interview.length > 0 && (
                        <div className="space-y-3">
                          {interview.map((qa, i) => (
                            <div key={i} className="border border-border/20 rounded-md p-3 space-y-2 bg-secondary/10 relative">
                              <button
                                onClick={() => removeInterviewQA(item.slug, i)}
                                className="absolute top-2 right-2 p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div>
                                <label className="text-[9px] font-display uppercase tracking-[0.15em] text-primary/70 mb-0.5 block">
                                  Question {i + 1}
                                </label>
                                <Input
                                  value={qa.question}
                                  onChange={(e) => updateInterviewQA(item.slug, i, "question", e.target.value)}
                                  placeholder="What inspired you…"
                                  className="bg-secondary/20 border-border/30 text-sm h-8"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-display uppercase tracking-[0.15em] text-primary/70 mb-0.5 block">
                                  Answer
                                </label>
                                <textarea
                                  value={qa.answer}
                                  onChange={(e) => updateInterviewQA(item.slug, i, "answer", e.target.value)}
                                  rows={3}
                                  className="w-full rounded-md border border-border/30 bg-secondary/20 px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y"
                                  placeholder="Artist's response…"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => addInterviewQA(item.slug)}
                      >
                        <Plus className="w-3 h-3" />
                        Add Q&A
                      </Button>
                    </div>

                    {/* Save & Delete buttons */}
                    <div className="flex justify-between pt-2">
                      <div>
                        {canDelete && (() => {
                          const dbRow = profiles.find((p) => p.slug === item.slug);
                          return dbRow ? (
                            <Button
                              onClick={() => handleDeleteArtist(dbRow)}
                              disabled={deletingId === dbRow.id}
                              variant="destructive"
                              size="sm"
                              className="gap-1.5"
                            >
                              {deletingId === dbRow.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Delete Artist
                            </Button>
                          ) : null;
                        })()}
                      </div>
                      <Button
                        onClick={() => handleSave(item)}
                        disabled={isSaving}
                        className="gap-2"
                        size="sm"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save Profile
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {artistList.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No artists match "{search}"
            </p>
          )}

          {artistList.length >= 50 && (
            <p className="text-center text-[11px] text-muted-foreground py-2">
              Showing first 50 results. Refine your search to see more.
            </p>
          )}
        </div>
      )}
    </div>
  );
}