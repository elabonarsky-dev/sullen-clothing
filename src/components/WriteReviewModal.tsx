import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";

const reviewSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(10, "Review must be at least 10 characters").max(2000),
  rating: z.number().min(1, "Please select a rating").max(5),
});

interface WriteReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productTitle: string;
}

export function WriteReviewModal({ open, onOpenChange, productTitle }: WriteReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = reviewSchema.safeParse({ name, email, title, body, rating });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    // Simulate submission (Okendo doesn't have a public write API — this is a placeholder)
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);

    toast.success("Thank you! Your review has been submitted for approval.");
    setRating(0);
    setName("");
    setEmail("");
    setTitle("");
    setBody("");
    onOpenChange(false);
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl uppercase tracking-wider text-foreground">
            Write a Review
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{productTitle}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Star rating */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-2 block">
              Rating <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={
                      star <= displayRating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/30"
                    }
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground self-center">
                  {["", "Poor", "Fair", "Good", "Great", "Excellent"][displayRating]}
                </span>
              )}
            </div>
            {errors.rating && (
              <p className="text-xs text-destructive mt-1">{errors.rating}</p>
            )}
          </div>

          {/* Name & Email row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="review-name" className="text-sm font-semibold text-foreground">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="review-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
                className="mt-1"
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="review-email" className="text-sm font-semibold text-foreground">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="review-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                maxLength={255}
                className="mt-1"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="review-title" className="text-sm font-semibold text-foreground">
              Review Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={200}
              className="mt-1"
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-1">{errors.title}</p>
            )}
          </div>

          {/* Body */}
          <div>
            <Label htmlFor="review-body" className="text-sm font-semibold text-foreground">
              Review <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell us about your experience with this product…"
              maxLength={2000}
              rows={4}
              className="mt-1 resize-none"
            />
            <div className="flex justify-between mt-1">
              {errors.body ? (
                <p className="text-xs text-destructive">{errors.body}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">{body.length}/2000</span>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full font-display uppercase tracking-wider"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
