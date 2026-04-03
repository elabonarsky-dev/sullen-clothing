import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO } from "@/components/SEO";
import { motion, useScroll, useTransform } from "framer-motion";
import { Skull, Gift, Star, Users, ShoppingBag, Instagram, Cake, CreditCard, ArrowRight, Lock, ChevronRight } from "lucide-react";
import vaultLock3d from "@/assets/vault-lock-3d.png";
import skullBadge3d from "@/assets/skull-badge-3d.png";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRef, useState } from "react";
import { useRewards } from "@/hooks/useRewards";
import { RedeemModal } from "@/components/RedeemModal";
import vaultDoorImage from "@/assets/vault-door.png";

const earnRules = [
  { title: "Place an Order", points: "1–3 Skulls per $1", icon: ShoppingBag, highlight: true },
  { title: "Join the Family", points: "500 Skulls", icon: Users, highlight: false },
  { title: "Birthday Bonus", points: "300 Skulls", icon: Cake, highlight: false },
  { title: "Write a Review", points: "200 Skulls", icon: Star, highlight: false },
  { title: "Refer a Friend", points: "500 Skulls", icon: Users, highlight: true },
  { title: "Follow on Instagram", points: "150 Skulls", icon: Instagram, highlight: false },
  { title: "Drop Day Multiplier", points: "2–3× Points", icon: Gift, highlight: true },
];

const redeemRewards = [
  { title: "$5", cost: 500, description: "off your next purchase" },
  { title: "$10", cost: 1000, description: "off your next purchase" },
  { title: "$25", cost: 2500, description: "off your next purchase" },
];

const vipTiers = [
  { name: "Apprentice", requirement: "Sign Up", earn: "1×", spend: "$0", annual: "$0/yr", icon: "🩻", perks: ["1 Skull per $1", "Birthday bonus"] },
  { name: "Collector", requirement: "Spend $200", earn: "1.5×", spend: "$200", annual: "$150/yr", icon: "💀", perks: ["1.5 Skulls per $1", "Vault access", "24hr early access on select capsules", "Free shipping over $75"] },
  { name: "Mentor", requirement: "Spend $750", earn: "2×", spend: "$750", annual: "$400/yr", icon: "☠️", perks: ["2 Skulls per $1", "Vault access", "24hr early access on select capsules", "Free shipping always"] },
  { name: "Master", requirement: "Spend $2,000", earn: "3×", spend: "$2,000", annual: "$800/yr", icon: "👑", perks: ["3 Skulls per $1", "Vault access", "24hr early access on select capsules", "Free shipping always", "VIP events"] },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function RewardsPage() {
  const { user } = useAuth();
  const { balance } = useRewards();
  const [redeemOpen, setRedeemOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Sullen Loyalty | Earn Skull Points"
        description="Join the Sullen Family loyalty program. Earn Skull Points on every purchase and redeem for exclusive discounts."
        path="/pages/rewards"
      />
      <SiteHeader />

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[50vh] sm:min-h-[55vh] flex items-center justify-center">
        {/* Animated background */}
        <motion.div style={{ scale: heroScale }} className="absolute inset-0 bg-gradient-to-b from-background via-card to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12)_0%,transparent_60%)]" />
        
        {/* Dark gritty smoke layers */}
        <div className="absolute inset-0 opacity-[0.18]" style={{
          background: `
            radial-gradient(ellipse 90% 60% at 15% 85%, hsl(var(--primary) / 0.5), transparent),
            radial-gradient(ellipse 70% 50% at 85% 15%, hsl(var(--primary) / 0.25), transparent),
            radial-gradient(ellipse 120% 70% at 50% 110%, hsl(0 0% 0% / 0.8), transparent)
          `,
        }} />
        <motion.div
          className="absolute inset-0 opacity-[0.1]"
          animate={{ x: [0, 20, 0], y: [0, -12, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 25% 65%, hsl(0 0% 0% / 0.6), transparent),
              radial-gradient(ellipse 60% 50% at 75% 35%, hsl(var(--primary) / 0.3), transparent)
            `,
            filter: 'blur(50px)',
          }}
        />
        {/* Noise/grain texture */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }} />
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(0_0%_0%/0.3)_100%)]" />

        {/* Gold particle grid */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />

        <motion.div style={{ opacity: heroOpacity }} className="container max-w-4xl relative z-10 text-center px-4">
          {/* Skull emblem */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-2"
          >
            <div className="w-[174px] h-[174px] sm:w-[225px] sm:h-[225px] mx-auto">
              <img src={skullBadge3d} alt="Skull Points" className="w-full h-full object-contain drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-display text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary mb-4"
          >
            Loyalty Program
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="font-hudson text-4xl sm:text-6xl lg:text-7xl uppercase tracking-[0.06em] text-foreground mb-6 leading-[0.9]"
          >
            Earn Skulls.<br />
            <span className="text-primary">Get Rewarded.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-sm sm:text-base font-body text-muted-foreground max-w-md mx-auto leading-relaxed mb-6"
          >
            Collect Skull Points on every purchase and unlock exclusive rewards, discounts, and VIP perks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            {user ? (
              <Link
                to="/account"
                className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.2em] rounded hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                <Skull className="w-4 h-4" />
                View My Points
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  to="/account/login"
                  className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.2em] rounded hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  <Skull className="w-4 h-4" />
                  Join Now — It's Free
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/account/login"
                  className="inline-flex items-center justify-center px-10 py-4 border border-border/40 text-foreground font-display text-xs uppercase tracking-[0.2em] rounded hover:border-primary/60 hover:text-primary transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ═══ HOW IT WORKS — 3 Steps ═══ */}
      <section className="py-12 sm:py-16 relative">
        <div className="container max-w-5xl">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-8"
          >
            <motion.p variants={fadeUp} className="font-display text-[10px] uppercase tracking-[0.3em] text-primary mb-3">How It Works</motion.p>
            <motion.h2 variants={fadeUp} className="font-hudson text-3xl sm:text-4xl uppercase tracking-[0.06em] text-foreground">
              Three Steps. Infinite Rewards.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid sm:grid-cols-3 gap-6 sm:gap-8"
          >
            {[
              { step: "01", title: "Join the Family", desc: "Create a free account and earn 50 Skull Points instantly.", icon: Users },
              { step: "02", title: "Collect Skulls", desc: "Earn points on every purchase, review, referral, and more.", icon: Skull },
              { step: "03", title: "Reap Rewards", desc: "Redeem your Skulls for discounts on your next order.", icon: Gift },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="group relative text-center p-6 sm:p-8 bg-card/50 border border-border/10 rounded-xl hover:border-primary/20 transition-all duration-500"
              >
                {/* Step number watermark */}
                <span className="absolute top-4 right-5 font-hudson text-5xl text-primary/[0.06] select-none">{item.step}</span>

                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/15 transition-colors">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xs uppercase tracking-[0.18em] text-foreground mb-3">{item.title}</h3>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ WAYS TO EARN ═══ */}
      <section className="py-12 sm:py-16 relative bg-card/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.04)_0%,transparent_60%)]" />
        <div className="container max-w-5xl relative z-10">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-8"
          >
            <motion.p variants={fadeUp} className="font-display text-[10px] uppercase tracking-[0.3em] text-primary mb-3">Ways to Earn</motion.p>
            <motion.h2 variants={fadeUp} className="font-hudson text-3xl sm:text-4xl uppercase tracking-[0.06em] text-foreground">
              Stack Your Skulls
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 gap-3 sm:gap-4"
          >
            {earnRules.map((rule) => (
              <motion.div
                key={rule.title}
                variants={fadeUp}
                className={`group flex items-center gap-4 p-5 rounded-xl border transition-all duration-300 ${
                  rule.highlight
                    ? "bg-primary/[0.06] border-primary/20 hover:border-primary/40"
                    : "bg-card/50 border-border/10 hover:border-primary/20"
                }`}
              >
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  rule.highlight ? "bg-primary/15" : "bg-primary/10 group-hover:bg-primary/15"
                }`}>
                  <rule.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-display text-xs uppercase tracking-[0.14em] text-foreground">{rule.title}</p>
                  <p className="text-sm font-body text-muted-foreground mt-0.5">{rule.points}</p>
                </div>
                {rule.highlight && (
                  <span className="text-[9px] font-display uppercase tracking-[0.15em] text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
                    Popular
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ REDEEM REWARDS ═══ */}
      <section className="py-12 sm:py-16 relative">
        <div className="container max-w-5xl">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-8"
          >
            <motion.p variants={fadeUp} className="font-display text-[10px] uppercase tracking-[0.3em] text-primary mb-3">Redeem</motion.p>
            <motion.h2 variants={fadeUp} className="font-hudson text-3xl sm:text-4xl uppercase tracking-[0.06em] text-foreground">
              Use Your Skulls
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid sm:grid-cols-3 gap-5 sm:gap-6"
          >
            {redeemRewards.map((reward, i) => (
              <motion.div
                key={reward.cost}
                variants={fadeUp}
                className="group relative text-center p-8 bg-card/50 border border-border/10 rounded-xl hover:border-primary/30 transition-all duration-500 overflow-hidden"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-hudson text-3xl sm:text-4xl text-primary mb-1">{reward.title}</h3>
                  <p className="text-xs font-body text-muted-foreground mb-4">{reward.description}</p>
                  <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <p className="text-xs font-display uppercase tracking-[0.15em] text-primary">
                      {reward.cost.toLocaleString()} Skulls
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Redeem CTA */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-8"
            >
              <button
                onClick={() => setRedeemOpen(true)}
                className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.2em] rounded hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                Redeem My Skulls
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="text-[10px] font-body text-muted-foreground/50 mt-2">
                You have {balance.toLocaleString()} Skulls available
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══ VIP TIERS ═══ */}
      <section className="py-12 sm:py-16 relative bg-card/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.05)_0%,transparent_60%)]" />
        <div className="container max-w-6xl relative z-10">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-8"
          >
            <motion.p variants={fadeUp} className="font-display text-[10px] uppercase tracking-[0.3em] text-primary mb-3">VIP Program</motion.p>
            <motion.h2 variants={fadeUp} className="font-hudson text-3xl sm:text-4xl uppercase tracking-[0.06em] text-foreground">
              Unlock Your Tier
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            {vipTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                variants={fadeUp}
                className={`group relative text-center p-6 sm:p-7 rounded-xl border transition-all duration-500 overflow-hidden ${
                  i === 3
                    ? "bg-primary/[0.06] border-primary/25 hover:border-primary/50"
                    : "bg-card/50 border-border/10 hover:border-primary/20"
                }`}
              >
                {/* Master tier glow */}
                {i === 3 && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)]" />
                )}

                <div className="relative z-10">
                  <span className="text-4xl sm:text-5xl block mb-4 group-hover:scale-110 transition-transform duration-300">{tier.icon}</span>
                  <h3 className="font-display text-xs sm:text-sm uppercase tracking-[0.18em] text-foreground mb-1">{tier.name}</h3>
                  <p className="text-xs font-body text-primary font-semibold">{tier.requirement}</p>
                  {tier.annual !== "$0/yr" && (
                    <p className="text-[10px] font-body text-muted-foreground mb-4">or {tier.annual} to maintain</p>
                  )}
                  {tier.annual === "$0/yr" && <div className="mb-4" />}

                  {/* Earn rate badge */}
                  <div className="inline-block px-3 py-1.5 rounded-full bg-primary/10 mb-4">
                    <p className="text-[10px] font-display uppercase tracking-[0.15em] text-primary">
                      {tier.earn} Earn Rate
                    </p>
                  </div>

                  {/* Perks */}
                  <ul className="space-y-1.5 text-left">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-1.5 text-[10px] sm:text-[11px] font-body text-muted-foreground">
                        <span className="text-primary mt-0.5 shrink-0">•</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-[9px] font-body text-muted-foreground/40 text-center mt-8 uppercase tracking-[0.15em]"
          >
            *To retain status, spend requirement must be met every 365 days · Free shipping valid for continental US only
          </motion.p>
        </div>
      </section>

      {/* ═══ THE VAULT TEASER ═══ */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        {/* Ghosted vault door background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)' }}
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <img
              src={vaultDoorImage}
              alt=""
              className="w-[500px] sm:w-[600px] lg:w-[700px] max-w-none select-none opacity-50"
              draggable={false}
            />
          </motion.div>
        </div>
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_75%)]" />

        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="container max-w-2xl relative z-10 text-center"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <div className="w-28 h-28 sm:w-36 sm:h-36 mx-auto">
              <img src={vaultLock3d} alt="Vault Lock" className="w-full h-full object-contain drop-shadow-[0_0_25px_hsl(var(--primary)/0.4)]" />
            </div>
          </motion.div>

          <motion.p variants={fadeUp} className="font-display text-[10px] uppercase tracking-[0.35em] text-primary/80 mb-3">
            Members Only
          </motion.p>

          <motion.h2 variants={fadeUp} className="font-hudson text-3xl sm:text-5xl uppercase tracking-[0.06em] text-foreground mb-5 leading-[0.95]">
            Earn the Right<br />
            <span className="text-primary">to Enter the Vault</span>
          </motion.h2>

          <motion.p variants={fadeUp} className="text-sm sm:text-base font-body text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
            The Vault holds exclusive drops, early access collections, and flash deals reserved for loyal members. Collect Skulls, climb the tiers, and unlock what's behind the door.
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link
              to={user ? "/vault" : "/account/login"}
              className="group relative w-full max-w-xl mx-auto block rounded-xl overflow-hidden h-[120px] sm:h-[140px]"
            >
              {/* Vault door background */}
              <img
                src={vaultDoorImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700"
              />
              {/* Border overlay */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  border: "1px solid hsl(38 60% 55% / 0.4)",
                  boxShadow: "inset 0 1px 0 hsl(38 60% 55% / 0.15), 0 0 15px hsl(38 60% 55% / 0.08)",
                }}
              />
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: "inset 0 0 40px hsl(38 60% 55% / 0.08), 0 0 30px hsl(38 60% 55% / 0.06)" }}
              />
              {/* Content */}
              <div className="relative z-10 flex items-center justify-between h-full px-6 sm:px-8">
                <div className="flex items-center gap-4 sm:gap-5">
                  {/* Lock icon with spinning conic ring */}
                  <span className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0">
                    <span
                      className="absolute inset-0 rounded-full animate-[spin_8s_linear_infinite]"
                      style={{ background: "conic-gradient(from 0deg, hsl(38 60% 55% / 0.4), transparent 40%, hsl(38 60% 55% / 0.2), transparent 80%, hsl(38 60% 55% / 0.4))" }}
                    />
                    <span className="absolute inset-[2px] rounded-full bg-background/90" />
                    <Lock className="relative z-10 w-5 h-5 sm:w-6 sm:h-6" style={{ color: "hsl(38 60% 55%)" }} />
                  </span>
                  <div className="text-left">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="h-px w-6" style={{ background: "linear-gradient(90deg, transparent, hsl(38 60% 55% / 0.4))" }} />
                      <span className="text-[8px] sm:text-[9px] font-display uppercase tracking-[0.45em]" style={{ color: "hsl(38 60% 55% / 0.5)" }}>
                        Members Only
                      </span>
                      <div className="h-px w-6" style={{ background: "linear-gradient(90deg, hsl(38 60% 55% / 0.4), transparent)" }} />
                    </div>
                    <p className="text-base sm:text-lg font-display uppercase tracking-[0.2em] text-white group-hover:text-[hsl(38_60%_55%)] transition-colors duration-300">
                      {user ? "The Vault" : "Unlock the Vault"}
                    </p>
                    <p className="text-[10px] font-body mt-0.5" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                      Exclusive drops & early access
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform duration-300" style={{ color: "hsl(38 60% 55% / 0.5)" }}>
                  <span className="hidden sm:block text-[9px] font-display uppercase tracking-[0.25em]" style={{ color: "hsl(38 60% 55% / 0.4)" }}>
                    {user ? "Enter" : "Join"}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-12 sm:py-16 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06)_0%,transparent_60%)]" />
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }}
          variants={stagger}
          className="container max-w-2xl relative z-10 text-center"
        >
          <motion.div variants={fadeUp} className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Skull className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-hudson text-3xl sm:text-4xl uppercase tracking-[0.06em] text-foreground mb-4">
            Ready to Collect?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-sm font-body text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            Start earning Skull Points today and join the Sullen Family.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              to={user ? "/account" : "/account/login"}
              className="group inline-flex items-center justify-center gap-2 px-12 py-4 bg-primary text-primary-foreground font-display text-xs uppercase tracking-[0.2em] rounded hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              {user ? "View My Skulls" : "Join Now — It's Free"}
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <SiteFooter />

      {/* Redemption Modal */}
      <RedeemModal open={redeemOpen} onOpenChange={setRedeemOpen} balance={balance} />
    </div>
  );
}
