import { useEffect, useState, useCallback } from "react";

export interface RecentlyViewedItem {
  handle: string;
  title: string;
  image: string;
  price: string;
  currencyCode: string;
  viewedAt: number;
}

const STORAGE_KEY = "sullen-recently-viewed";
const MAX_ITEMS = 12;

function getStored(): RecentlyViewedItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>(getStored);

  const trackView = useCallback((item: Omit<RecentlyViewedItem, "viewedAt">) => {
    const stored = getStored().filter((i) => i.handle !== item.handle);
    const updated = [{ ...item, viewedAt: Date.now() }, ...stored].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setItems(updated);
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(getStored());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { items, trackView };
}
