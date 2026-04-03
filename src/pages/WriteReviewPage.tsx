import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Send, CheckCircle2, Package, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { ReviewAttributeFields, ReviewAttributes, DEFAULT_ATTRIBUTES } from "@/components/ReviewAttributeFields";

interface LineItem {
  title: string;
  variant_title?: string;
  quantity: number;
  price: string;
  image?: string;
  product_handle?: string;
}

interface ReviewRequest {
  id: string;
  order_name: string;
  email: string;
  customer_name: string;
  line_items: LineItem[];
  status: string;
}

export default function WriteReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const [request, setRequest] = useState<ReviewRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pre-select rating from email star link
  const initialRating = Math.min(5, Math.max(0, parseInt(searchParams.get("rating") || "0", 10) || 0));

  // Per-product review state
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedProducts, setSubmittedProducts] = useState<Set<number>>(new Set());
  const [attributes, setAttributes] = useState<ReviewAttributes>(DEFAULT_ATTRIBUTES);

  useEffect(() => {
    async function loadRequest() {
      if (!token) {
        setError("Invalid review link");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("review_request_tokens")
        .select("id, order_name, email, customer_name, line_items, status")
        .eq("token", token)
        .single();

      if (fetchError || !data) {
        setError("This review link is invalid or has expired.");
        setLoading(false);
        return;
      }

      if (data.status === "expired") {
        setError("This review link has expired.");
        setLoading(false);
        return;
      }

      setRequest(data as unknown as ReviewRequest);
      setName(data.customer_name || "");
      setLoading(false);
    }

    loadRequest();
  }, [token]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct === null || !request) return;
    if (rating === 0) { toast.error("Please select a rating"); return; }
    if (!body.trim()) { toast.error("Please write a review"); return; }
    if (!name.trim()) { toast.error("Please enter your name"); return; }

    const item = request.line_items[selectedProduct];
    setSubmitting(true);

    // Insert review without user_id (guest review via token)
    // We use the service role via edge function for this
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/submit-token-review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          token,
          product_handle: item.product_handle || item.title.toLowerCase().replace(/\s+/g, "-"),
          product_title: item.title,
          product_image: item.image || null,
          rating,
          title: title.trim() || null,
          body: body.trim(),
          reviewer_name: name.trim(),
          reviewer_email: request.email,
          metadata: {
            sizing: attributes.sizing,
            design: attributes.design,
            quality: attributes.quality,
            recommends: attributes.recommends,
            clothing_size: attributes.clothingSize || null,
            body_type: attributes.bodyType || null,
            height: attributes.height || null,
          },
        }),
      }
    );

    if (res.ok) {
      setSubmittedProducts(new Set([...submittedProducts, selectedProduct]));
      setSelectedProduct(null);
      setRating(0);
      setTitle("");
      setBody("");
      setAttributes(DEFAULT_ATTRIBUTES);
      toast.success("Review submitted! Thank you.");
    } else {
      toast.error("Failed to submit review. Please try again.");
    }
    setSubmitting(false);
  };

  const allReviewed = request
    ? request.line_items.length > 0 && submittedProducts.size === request.line_items.length
    : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-body">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container max-w-lg py-20 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-xl uppercase tracking-wider text-foreground mb-2">
            Link Unavailable
          </h1>
          <p className="text-sm text-muted-foreground font-body mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-body"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        path={`/write-review/${token}`}
        title="Write a Review | Sullen Clothing"
        description="Share your experience with Sullen Clothing products"
      />
      <SiteHeader />

      <div className="container max-w-2xl py-12 md:py-16 px-4">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider text-foreground mb-2">
            How Was Your Order?
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            {request?.order_name} — Tell us what you think about your purchase
          </p>
        </div>

        {allReviewed ? (
          <div className="text-center py-12 border border-border/30 rounded-lg">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground mb-2">
              All Reviews Submitted!
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-6">
              Thank you for taking the time to share your feedback.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-xs font-display uppercase tracking-wider hover:bg-primary/90 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Product list */}
            {request?.line_items.map((item, index) => {
              const isSubmitted = submittedProducts.has(index);
              const isSelected = selectedProduct === index;

              return (
                <div key={index}>
                  <button
                    onClick={() => {
                      if (!isSubmitted) {
                        setSelectedProduct(isSelected ? null : index);
                        setRating(0);
                        setHoverRating(0);
                        setTitle("");
                        setBody("");
                      }
                    }}
                    disabled={isSubmitted}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                      isSubmitted
                        ? "border-primary/30 bg-primary/5 opacity-70"
                        : isSelected
                        ? "border-primary bg-card"
                        : "border-border/30 bg-card hover:border-border/60"
                    }`}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-foreground truncate">{item.title}</p>
                      {item.variant_title && (
                        <p className="text-xs text-muted-foreground font-body">{item.variant_title}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-body">Qty: {item.quantity}</p>
                    </div>
                    {isSubmitted ? (
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <span className="text-xs font-display uppercase tracking-wider text-primary flex-shrink-0">
                        {isSelected ? "Writing..." : "Review"}
                      </span>
                    )}
                  </button>

                  {/* Inline review form */}
                  {isSelected && !isSubmitted && (
                    <form
                      onSubmit={handleSubmitReview}
                      className="mt-2 border border-border/30 rounded-lg p-5 space-y-4 bg-background"
                    >
                      {/* Star rating */}
                      <div>
                        <label className="text-xs text-muted-foreground font-body block mb-1.5">
                          Rating *
                        </label>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onMouseEnter={() => setHoverRating(i + 1)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setRating(i + 1)}
                              className="p-0.5"
                            >
                              <Star
                                className={`h-6 w-6 transition-colors ${
                                  i < (hoverRating || rating)
                                    ? "fill-primary text-primary"
                                    : "fill-muted text-muted"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="text-xs text-muted-foreground font-body block mb-1.5">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John D."
                          maxLength={100}
                          className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Title */}
                      <div>
                        <label className="text-xs text-muted-foreground font-body block mb-1.5">
                          Review Title
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Love this product!"
                          maxLength={200}
                          className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Body */}
                      <div>
                        <label className="text-xs text-muted-foreground font-body block mb-1.5">
                          Your Review *
                        </label>
                        <textarea
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder="Tell us what you think..."
                          rows={4}
                          maxLength={2000}
                          className="w-full bg-background border border-border/50 rounded-md px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                      </div>

                      {/* Product & Profile Attributes */}
                      <ReviewAttributeFields attributes={attributes} onChange={setAttributes} />

                      <button
                        type="submit"
                        disabled={submitting || rating === 0 || !body.trim() || !name.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-display uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {submitting ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
