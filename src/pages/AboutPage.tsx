import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Palette, Users, Heart, Award } from "lucide-react";

const values = [
  {
    icon: Palette,
    title: "Art Driven",
    description:
      "Every piece we create is rooted in tattoo culture and fine art. We collaborate with world-class tattoo artists to bring wearable art to the streets.",
  },
  {
    icon: Users,
    title: "The Collective",
    description:
      "We humble ourselves in bringing together like minded creatives and aiding in the exposure of talented artists located all over the globe.",
  },
  {
    icon: Heart,
    title: "True Art",
    description:
      "Tattoo inspired art is in Sullen's DNA; it always has and always will drive all of our creative direction. Our only hope is that you are just as inspired by what we call \"True Art\".",
  },
  {
    icon: Award,
    title: "Quality & Craft",
    description:
      "From lightweight, breathable material for our boxers and board shorts to comfortable, durable material for our premium graphic shirts — we do the art justice.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About Us | Sullen Clothing"
        description="Established in Huntington Beach, CA in 2001. Born from tattoo culture, driven by art. Learn about our story, our artist collaborations, and our commitment to wearable art."
      />
      <AnnouncementBar />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
          <div className="absolute inset-0 bg-gradient-dark" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <div className="container max-w-4xl relative z-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-hudson text-4xl sm:text-5xl lg:text-6xl uppercase tracking-[0.08em] text-foreground mb-4"
            >
              Our Story
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="w-16 h-[2px] bg-primary mx-auto mb-6"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-base sm:text-lg font-body text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Art Driven. Ink Approved.
            </motion.p>
          </div>
        </section>

        {/* Origin story */}
        <section className="container max-w-4xl py-16 sm:py-20">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden border border-border/20 glow-gold">
                <img
                  src="https://cdn.shopify.com/s/files/1/1096/0120/files/about-sullen-founders.jpg?v=1741135080"
                  alt="Sullen Clothing founders"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://cdn.shopify.com/s/files/1/1096/0120/files/SHOP-BANNERsp25email.jpg?v=1741135080";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="space-y-5"
            >
              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.12em] text-foreground">
                Born From <span className="text-gradient-gold">Tattoo Culture</span>
              </h2>
              <p className="text-sm sm:text-base font-body text-muted-foreground leading-relaxed">
                Established in Huntington Beach, CA early in 2001, Sullen got its start from being heavily influenced by Southern California beach culture and tattoo inspired art. With a strong focus on ideals and practices of modern tattooers, Sullen evolved from a small group of art driven tattooers and artists into a world renowned "Art Collective".
              </p>
              <p className="text-sm sm:text-base font-body text-muted-foreground leading-relaxed">
                As a whole, the "Collective" is drawn to the idea that art of all forms should be promoted, while related ideas should be shared for the world to learn from.
              </p>
              <p className="text-sm sm:text-base font-body text-muted-foreground leading-relaxed">
                Influenced greatly by lessons learned early in tattooing, Co-owner Ryan Smith (a professional tattooer since 1996) brought collaborative ideas from the tattoo culture he knew so well and blended them with progressive fashion trends to create Sullen. His inspirations from the tattoo culture allowed him and the "Collective" to build the foundation on which Sullen currently thrives.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission statement */}
        <section className="bg-card border-y border-border/20 py-16 sm:py-20">
          <div className="container max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-5"
            >
              <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.12em] text-foreground">
                The <span className="text-gradient-gold">Collective</span>
              </h2>
              <p className="text-sm sm:text-base font-body text-muted-foreground leading-relaxed">
                We humble ourselves in bringing together like minded creatives and aiding in the exposure of talented artists located all over the globe. We truly are fans of tattoo inspired art. It's in Sullen's DNA; it always has and always will drive all of our creative direction. Our only hope, is that you are just as inspired by what we like to call "True Art".
              </p>
            </motion.div>
          </div>
        </section>

        {/* Quality & Craftsmanship */}
        <section className="container max-w-4xl py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.12em] text-foreground text-center">
              Quality & <span className="text-gradient-gold">Craftsmanship</span>
            </h2>
            <p className="text-sm sm:text-base font-body text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
              Every one of our Sullen pieces is made using only the best material for the piece. From lightweight, breathable material for our boxers and board shorts to comfortable, durable material for our premium graphic shirts, we do the art justice by ensuring each of our pieces is made to last.
            </p>
            <p className="text-sm sm:text-base font-body text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
              Keeping true to the creative roots of tattooing, Sullen works with real tattoo artists to adapt and create one-of-a-kind designs to be used on our Sullen graphic shirts, hats, boxers, pants, and bags.
            </p>
            <p className="text-sm sm:text-base font-body text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
              Our popular Artist Series takes this one step further by allowing you to get your hands on brand-new designs every week so you can support up-and-coming and established artists that have become masters of their craft.
            </p>
            <p className="text-sm sm:text-base font-body text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
              Sullen takes a unique approach to creating tattoo apparel that goes beyond just printing tattoo-inspired designs on a piece of clothing and calling it an urban streetwear t-shirt design. Each step of our manufacturing process reflects our love of tattoos and all the work, talent, and creativity that goes into them.
            </p>
          </motion.div>
        </section>

        {/* Values */}
        <section className="bg-card border-y border-border/20 py-16 sm:py-20">
          <div className="container max-w-5xl">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-2xl sm:text-3xl uppercase tracking-[0.12em] text-foreground text-center mb-12"
            >
              What We <span className="text-gradient-gold">Stand For</span>
            </motion.h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-background border border-border/20 rounded-lg p-6 text-center hover:border-primary/30 hover:glow-gold transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <v.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display text-sm uppercase tracking-[0.15em] text-foreground mb-3">
                    {v.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-body text-muted-foreground leading-relaxed">
                    {v.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="container max-w-4xl py-16 sm:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: "2001", label: "Founded" },
              { number: "200+", label: "Artist Collabs" },
              { number: "50+", label: "Countries" },
              { number: "1M+", label: "Community" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl sm:text-4xl font-hudson text-gradient-gold mb-1">
                  {stat.number}
                </p>
                <p className="text-xs font-display uppercase tracking-[0.2em] text-muted-foreground">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
