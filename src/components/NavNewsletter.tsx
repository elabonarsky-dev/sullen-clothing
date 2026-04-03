import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const SUCCESS_LINES = [
  "Welcome to the Family",
  "Together We Rise",
  "S.A.C",
];

function NavSuccessSequence() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (lineIndex < SUCCESS_LINES.length - 1) {
      const timer = setTimeout(() => setLineIndex((i) => i + 1), 1600);
      return () => clearTimeout(timer);
    }
  }, [lineIndex]);

  return (
    <div className="h-10 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={lineIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`font-display uppercase tracking-[0.2em] text-foreground ${
            lineIndex === 2 ? "text-xl" : "text-xs"
          }`}
        >
          {SUCCESS_LINES[lineIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

/** Compact newsletter form for nav panels with cinematic success animation */
export function NavNewsletter({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("attentive-subscribe", {
        body: { email },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus("success");
        setEmail("");
      } else {
        throw new Error(data?.error || "Failed");
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-1"
          >
            <NavSuccessSequence />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-[10px] font-body text-muted-foreground/60 mb-1.5 text-center tracking-wide">
              Save 15% on your first order
            </p>
            <form onSubmit={handleSubmit} className={`flex gap-0 ${compact ? "" : "rounded-lg overflow-hidden border-2 border-border/50"}`}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`flex-1 min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors font-body ${
                  compact
                    ? "px-3 py-2 border border-border/30 border-r-0 text-[11px]"
                    : "px-3 py-2 text-xs"
                }`}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className={`bg-foreground text-background font-display uppercase tracking-[0.15em] hover:bg-foreground/90 transition-colors whitespace-nowrap disabled:opacity-50 ${
                  compact
                    ? "px-3 py-2 text-[9px]"
                    : "px-4 py-2 text-xs tracking-[0.2em]"
                }`}
              >
                {status === "loading" ? "..." : "Join"}
              </button>
            </form>
            {status === "error" && (
              <p className="text-[10px] text-destructive font-body mt-1 text-center">
                Something went wrong. Try again.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
