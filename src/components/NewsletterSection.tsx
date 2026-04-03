import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import newsletterBg from "@/assets/newsletter-bg.jpg";

const SUCCESS_LINES = [
  "Welcome to the Family",
  "Together We Rise",
  "S.A.C",
];

function SuccessSequence() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (lineIndex < SUCCESS_LINES.length - 1) {
      const timer = setTimeout(() => setLineIndex((i) => i + 1), 1800);
      return () => clearTimeout(timer);
    }
  }, [lineIndex]);

  return (
    <div className="h-12 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={lineIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`font-display uppercase tracking-[0.25em] text-foreground ${
            lineIndex === 2 ? "text-3xl md:text-4xl" : "text-lg md:text-xl"
          }`}
        >
          {SUCCESS_LINES[lineIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function formatPhoneDisplay(value: string) {
  // Strip everything except digits
  const digits = value.replace(/\D/g, "");
  // Format as (XXX) XXX-XXXX for US numbers
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function toE164(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const payload: Record<string, string> = { email };

      // Include phone if provided
      if (phone.trim()) {
        const e164 = toE164(phone);
        if (!e164) {
          setStatus("error");
          setMessage("Please enter a valid 10-digit US phone number.");
          return;
        }
        payload.phone = e164;
      }

      const { data, error } = await supabase.functions.invoke("attentive-subscribe", {
        body: payload,
      });

      if (error) throw error;
      if (data?.success) {
        setStatus("success");
        setMessage(data.message === "Already subscribed" ? "You're already on the list!" : "");
        setEmail("");
        setPhone("");
      } else {
        throw new Error(data?.error || "Failed to subscribe");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  const resetIfNeeded = () => {
    if (status !== "idle" && status !== "loading") setStatus("idle");
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={newsletterBg}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container max-w-7xl py-16 md:py-20 flex flex-col items-center gap-5 text-center">
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <SuccessSequence />
              {message && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm font-body text-muted-foreground mt-2"
                >
                  {message}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-5"
            >
              <motion.h3
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="font-display text-2xl md:text-3xl uppercase tracking-[0.2em] text-foreground"
              >
                Join the Collective
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-sm md:text-base text-muted-foreground font-body max-w-md"
              >
                Save 15% on your first order. Get exclusive drops, artist features & early access delivered to your inbox and phone.
              </motion.p>

              <motion.form
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col gap-3 w-full max-w-sm"
                onSubmit={handleSubmit}
              >
                {/* Email row */}
                <div className="flex gap-0">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      resetIfNeeded();
                    }}
                    placeholder="Enter your email"
                    required
                    className="flex-1 bg-background/60 backdrop-blur-sm border border-border/50 border-r-0 px-4 py-3.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="bg-foreground text-background font-display text-xs uppercase tracking-[0.2em] px-6 py-3.5 hover:bg-foreground/90 transition-colors disabled:opacity-50"
                  >
                    {status === "loading" ? "..." : "Subscribe"}
                  </button>
                </div>

                {/* Phone row */}
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatPhoneDisplay(e.target.value));
                    resetIfNeeded();
                  }}
                  placeholder="Phone number (optional — for texts)"
                  maxLength={14}
                  className="w-full bg-background/60 backdrop-blur-sm border border-border/50 px-4 py-3.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                />

                <p className="text-[11px] text-muted-foreground/70 font-body leading-snug">
                  By subscribing, you agree to receive marketing texts. Msg & data rates may apply. Reply STOP to opt out.
                </p>
              </motion.form>

              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-body text-destructive"
                >
                  {message}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
