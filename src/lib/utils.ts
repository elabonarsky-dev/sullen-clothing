import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize Sullen CDN URLs.
 * www.sullenclothing.com now points to Lovable (headless storefront), not Shopify,
 * so CDN image URLs must use sullenclothing.myshopify.com instead.
 */
export function shopifyImg(url: string): string {
  return url
    .replace("https://www.sullenclothing.com/cdn/shop/", "https://sullenclothing.myshopify.com/cdn/shop/")
    .replace("https://sullenclothing.com/cdn/shop/", "https://sullenclothing.myshopify.com/cdn/shop/");
}

/**
 * Generate fallback URL variants for a portrait image.
 */
export function getPortraitFallbacks(url: string): string[] {
  const fallbacks: string[] = [];
  const myshopifyPrefix = "https://sullenclothing.myshopify.com/cdn/shop/";
  const sullenPrefix = "https://www.sullenclothing.com/cdn/shop/";

  // Always try the myshopify.com variant
  if (url.includes(sullenPrefix)) {
    fallbacks.push(url.replace(sullenPrefix, myshopifyPrefix));
  } else if (url.includes(myshopifyPrefix)) {
    fallbacks.push(url.replace(myshopifyPrefix, sullenPrefix));
  }

  // Also try with common Shopify file path variants (files/ vs articles/)
  if (url.includes("/articles/")) {
    fallbacks.push(url.replace("/articles/", "/files/"));
  } else if (url.includes("/files/")) {
    fallbacks.push(url.replace("/files/", "/articles/"));
  }

  return fallbacks;
}
