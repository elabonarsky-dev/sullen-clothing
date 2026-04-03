import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://www.sullenclothing.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

interface ProductJsonLd {
  name: string;
  description: string;
  image: string[];
  url: string;
  brand: string;
  sku?: string;
  price: string;
  currency: string;
  availability: "InStock" | "OutOfStock";
  ratingValue?: number;
  reviewCount?: number;
  compareAtPrice?: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
  /** Controls the meta robots directive. Defaults to "index, follow". */
  robots?: string;
  product?: ProductJsonLd;
  breadcrumbs?: BreadcrumbItem[];
}

/** Strip query parameters from a path to produce a clean canonical URL. */
function stripQueryParams(path: string): string {
  const qIdx = path.indexOf("?");
  return qIdx === -1 ? path : path.slice(0, qIdx);
}

export function SEO({
  title,
  description = "Shop Sullen Clothing — tattoo-inspired streetwear featuring artist collaborations, premium tees, hats, and accessories.",
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  robots = "index, follow",
  product,
  breadcrumbs,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | Sullen Clothing`
    : "Sullen Clothing | Tattoo-Inspired Streetwear & Artist Collaborations";
  const canonicalPath = stripQueryParams(path);
  const url = `${SITE_URL}${canonicalPath}`;

  const productJsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.image,
        url: product.url,
        brand: {
          "@type": "Brand",
          name: product.brand,
        },
        ...(product.sku && { sku: product.sku }),
        offers: {
          "@type": "Offer",
          url: product.url,
          priceCurrency: product.currency,
          price: product.price,
          availability: `https://schema.org/${product.availability}`,
          seller: {
            "@type": "Organization",
            name: "Sullen Clothing",
          },
          ...(product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) && {
            priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          }),
        },
        ...(product.reviewCount && product.reviewCount > 0 && product.ratingValue && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingValue,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }),
      }
    : null;

  const breadcrumbJsonLd = breadcrumbs && breadcrumbs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${SITE_URL}${item.url}`,
        })),
      }
    : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={robots} />

      <meta property="og:site_name" content="Sullen Clothing" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={type === "product" ? "og:product" : type} />
      {product && <meta property="product:price:amount" content={product.price} />}
      {product && <meta property="product:price:currency" content={product.currency} />}
      {product && (
        <meta
          property="product:availability"
          content={product.availability === "InStock" ? "in stock" : "out of stock"}
        />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@SullenClothing" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {productJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(productJsonLd)}
        </script>
      )}
      {breadcrumbJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbJsonLd)}
        </script>
      )}
    </Helmet>
  );
}
