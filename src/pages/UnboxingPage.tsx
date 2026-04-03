import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skull, Gift, Sparkles, PartyPopper, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { SEO } from "@/components/SEO";

export default function UnboxingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [reward, setReward] = useState<{ type: string; value: string; already_claimed: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["unboxing-campaign", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unboxing_campaigns")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Check existing claim
  const { data: existingClaim } = useQuery({
    queryKey: ["unboxing-claim", campaign?.id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("unboxing_claims")
        .select("*")
        .eq("campaign_id", campaign!.id)
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!campaign?.id && !!user?.id,
  });

  // Init scratch canvas
  useEffect(() => {
    if (!canvasRef.current || revealed || existingClaim) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = 320 * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = "320px";
    canvas.style.height = "200px";
    ctx.scale(dpr, dpr);

    // Scratch-off cover: dark metallic gradient
    const gradient = ctx.createLinearGradient(0, 0, 320, 200);
    gradient.addColorStop(0, "#1a1a1a");
    gradient.addColorStop(0.3, "#2a2a2a");
    gradient.addColorStop(0.5, "#3a3a3a");
    gradient.addColorStop(0.7, "#2a2a2a");
    gradient.addColorStop(1, "#1a1a1a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 320, 200);

    // Texture pattern
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 320;
      const y = Math.random() * 200;
      const r = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = Math.random() > 0.5 ? "#c8a44e" : "#666";
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Text
    ctx.font = "bold 22px 'Oswald', sans-serif";
    ctx.fillStyle = "#c8a44e";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCRATCH TO REVEAL", 160, 90);
    ctx.font = "14px 'Barlow', sans-serif";
    ctx.fillStyle = "#888";
    ctx.fillText("Your surprise awaits ☠️", 160, 120);
  }, [campaign, revealed, existingClaim]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const scratch = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const { x, y } = getPos(e);

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x * dpr, y * dpr, 20 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    let cleared = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) cleared++;
    }
    const pct = (cleared / (imageData.data.length / 4)) * 100;
    setScratchPercent(pct);

    if (pct > 55 && !revealed) {
      setRevealed(true);
      claimReward();
    }
  }, [isScratching, revealed]);

  const claimReward = async () => {
    if (!user || !slug || claiming) return;
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-unboxing-reward", {
        body: { campaign_slug: slug },
      });
      if (error) throw error;
      setReward(data);
      if (!data.already_claimed) {
        toast.success("🎉 Reward unlocked!");
      }
    } catch (err) {
      console.error("Claim error:", err);
      toast.error("Something went wrong claiming your reward");
    } finally {
      setClaiming(false);
    }
  };

  const copyCode = () => {
    if (reward?.value) {
      navigator.clipboard.writeText(reward.value);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <Skull className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-2xl font-heading text-foreground">Sign in to Unlock</h1>
          <p className="text-muted-foreground">You need to be logged in to reveal your reward.</p>
          <Button onClick={() => navigate("/account/login")} className="bg-primary text-primary-foreground">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Gift className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-heading text-foreground">No Active Drop</h1>
          <p className="text-muted-foreground">Check back during our next special drop!</p>
          <Button variant="outline" onClick={() => navigate("/")}>Back to Shop</Button>
        </div>
      </div>
    );
  }

  const alreadyClaimed = !!existingClaim;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <SEO title={`${campaign.title} | Unboxing`} description="Scratch to reveal your surprise reward" />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md w-full text-center space-y-8"
      >
        {/* Header */}
        <div className="space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <Skull className="h-12 w-12 text-primary mx-auto" />
          </motion.div>
          <h1 className="text-3xl font-heading text-foreground tracking-wider uppercase">
            {campaign.title}
          </h1>
          {campaign.description && (
            <p className="text-muted-foreground text-sm">{campaign.description}</p>
          )}
        </div>

        {/* Scratch card or result */}
        <div className="relative mx-auto" style={{ width: 320, height: 200 }}>
          {/* Reward underneath */}
          <div className="absolute inset-0 bg-card border border-border rounded-lg flex flex-col items-center justify-center">
            <AnimatePresence>
              {(revealed || alreadyClaimed) && (reward || existingClaim) ? (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="text-center space-y-3"
                >
                  <PartyPopper className="h-10 w-10 text-primary mx-auto" />
                  {(reward?.type || existingClaim?.reward_type) === "points" ? (
                    <>
                      <p className="text-4xl font-heading text-primary font-bold">
                        {reward?.value || existingClaim?.reward_value}
                      </p>
                      <p className="text-foreground font-medium text-sm">SKULL POINTS</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">Your discount code:</p>
                      <div className="flex items-center gap-2 bg-secondary/50 rounded px-3 py-2">
                        <code className="text-primary font-mono text-lg font-bold tracking-wider">
                          {reward?.value || existingClaim?.reward_value}
                        </code>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyCode}>
                          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </>
                  )}
                  {(reward?.already_claimed || alreadyClaimed) && (
                    <p className="text-xs text-muted-foreground">Already claimed ✓</p>
                  )}
                </motion.div>
              ) : (
                <div className="text-muted-foreground/30 flex flex-col items-center gap-2">
                  <Sparkles className="h-8 w-8" />
                  <span className="text-xs">?</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Scratch canvas on top */}
          {!alreadyClaimed && !revealed && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 rounded-lg cursor-crosshair touch-none"
              onMouseDown={() => setIsScratching(true)}
              onMouseUp={() => setIsScratching(false)}
              onMouseLeave={() => setIsScratching(false)}
              onMouseMove={scratch}
              onTouchStart={() => setIsScratching(true)}
              onTouchEnd={() => setIsScratching(false)}
              onTouchMove={scratch}
            />
          )}
        </div>

        {/* Progress hint */}
        {!revealed && !alreadyClaimed && scratchPercent > 0 && scratchPercent < 55 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground"
          >
            Keep scratching... {Math.round(scratchPercent)}%
          </motion.p>
        )}

        {/* CTA */}
        {(revealed || alreadyClaimed) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground w-full">
              Continue Shopping
            </Button>
            <Button variant="outline" onClick={() => navigate("/account")} className="w-full">
              View My Rewards
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
