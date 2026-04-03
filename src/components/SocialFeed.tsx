import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { storefrontApiRequest } from "@/lib/shopify";

interface FeedImage {
  id: string;
  url: string;
  alt: string;
}

export function SocialFeed() {
  const [images, setImages] = useState<FeedImage[]>([]);

  useEffect(() => {
    async function fetchImages() {
      try {
        // Pull from tees collection, grab secondary lifestyle images (skip first flat-lay)
        const data = await storefrontApiRequest(
          `query {
            collection(handle: "tees") {
              products(first: 20, sortKey: CREATED, reverse: true) {
                edges {
                  node {
                    id
                    title
                    images(first: 5) {
                      edges { node { url altText } }
                    }
                  }
                }
              }
            }
          }`
        );
        const products = data?.data?.collection?.products?.edges || [];
        const lifestyle: FeedImage[] = [];
        for (const p of products) {
          if (lifestyle.length >= 6) break;
          const imgs = p.node.images.edges;
          // Prefer 2nd+ images (lifestyle shots), fall back to 1st if only one
          const pick = imgs.length > 1 ? imgs[1] : imgs[0];
          if (pick) {
            lifestyle.push({
              id: p.node.id,
              url: pick.node.url,
              alt: pick.node.altText || p.node.title,
            });
          }
        }
        setImages(lifestyle);
      } catch (err) {
        console.error("Failed to load social feed:", err);
      }
    }
    fetchImages();
  }, []);

  if (images.length === 0) return null;

  return (
    <section className="py-16 md:py-20 overflow-hidden">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg md:text-xl font-display uppercase tracking-[0.2em] text-foreground">
              The Community
            </h2>
            <p className="mt-1 text-xs font-body text-muted-foreground tracking-wide">
              Tag <span className="text-primary">@sullenclothing</span> to be featured
            </p>
          </div>
          <a
            href="https://www.instagram.com/sullenclothing/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
          >
            <Instagram className="w-4 h-4" />
            Follow Us
          </a>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
          {images.map((img, i) => (
            <motion.a
              key={img.id}
              href="https://www.instagram.com/sullenclothing/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-lg overflow-hidden bg-secondary"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-2">
                <Instagram className="w-5 h-5 text-primary mb-1.5" />
                <p className="text-[10px] font-display uppercase tracking-wider text-foreground">
                  @sullenclothing
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
