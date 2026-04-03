import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BackInStockFormProps {
  variantId: string;
  productHandle: string;
  productTitle: string;
  variantTitle?: string;
}

export function BackInStockForm({
  variantId,
  productHandle,
  productTitle,
  variantTitle,
}: BackInStockFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("back-in-stock", {
        body: {
          email,
          variant_id: variantId,
          product_handle: productHandle,
          product_title: productTitle,
          variant_title: variantTitle,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSubmitted(true);
      toast.success("We'll notify you when this is back in stock!", { position: "top-center" });
    } catch (err) {
      console.error("Back in stock request failed:", err);
      toast.error("Something went wrong. Please try again.", { position: "top-center" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-lg bg-primary/5 border border-primary/20">
        <Bell className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-xs font-body text-foreground">
          You'll be notified at <span className="font-semibold">{email}</span> when this is back in stock.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-xs font-body text-muted-foreground">
        Get notified when this size is back in stock
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-10 text-sm font-body bg-secondary/50 border-border/30"
        />
        <Button
          type="submit"
          variant="outline"
          className="h-10 px-4 text-xs font-display uppercase tracking-wider flex-shrink-0 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
          disabled={loading}
        >
          <Bell className="w-3.5 h-3.5 mr-1.5" />
          Notify Me
        </Button>
      </div>
    </form>
  );
}
