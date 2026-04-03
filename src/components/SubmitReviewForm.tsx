import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ReviewAttributeFields, ReviewAttributes, DEFAULT_ATTRIBUTES } from "@/components/ReviewAttributeFields";

interface SubmitReviewFormProps {
  productHandle: string;
  productTitle: string;
  productImage?: string;
}

export function SubmitReviewForm({ productHandle, productTitle, productImage }: SubmitReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attributes, setAttributes] = useState<ReviewAttributes>(DEFAULT_ATTRIBUTES);

  if (!user) {
    return (
      <div className="border border-border/30 rounded-lg p-6 text-center">
        <p className="text-sm text-muted-foreground font-body mb-3">
          <Link to="/account/login" className="text-primary hover:underline">Sign in</Link> to leave a review
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="border border-border/30 rounded-lg p-6 text-center">
        <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-3" />
        <p className="text-sm font-body text-foreground">Thank you for your review!</p>
        <p className="text-xs text-muted-foreground font-body mt-1">
          {rating >= 4 ? "Your review is now live." : "Your review will be published after moderation."}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!body.trim()) {
      toast.error("Please write a review");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      product_handle: productHandle,
      product_title: productTitle,
      product_image: productImage || null,
      rating,
      title: title.trim() || null,
      body: body.trim(),
      reviewer_name: name.trim(),
      reviewer_email: user.email || "",
      verified_purchase: false,
      metadata: {
        sizing: attributes.sizing,
        design: attributes.design,
        quality: attributes.quality,
        recommends: attributes.recommends,
        clothing_size: attributes.clothingSize || null,
        body_type: attributes.bodyType || null,
        height: attributes.height || null,
      },
    });

    if (error) {
      toast.error("Failed to submit review");
    } else {
      setSubmitted(true);
      toast.success("Review submitted!");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border/30 rounded-lg p-5 space-y-4">
      <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
        Write a Review
      </h3>

      {/* Star rating */}
      <div>
        <label className="text-xs text-muted-foreground font-body block mb-1.5">Rating *</label>
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
        <label className="text-xs text-muted-foreground font-body block mb-1.5">Your Name *</label>
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
        <label className="text-xs text-muted-foreground font-body block mb-1.5">Review Title</label>
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
        <label className="text-xs text-muted-foreground font-body block mb-1.5">Your Review *</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell us what you think about this product..."
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
  );
}
