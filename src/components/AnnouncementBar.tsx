import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAnnouncements } from "@/hooks/useAnnouncements";

const fallbackMessages = [
  { message: "Free U.S. DOM Shipping on Orders $99+", link_href: null },
  { message: "New Drops Weekly", link_href: "/collections/new-releases" },
];

export function AnnouncementBar() {
  const { data: announcements } = useAnnouncements();
  const messages = announcements && announcements.length > 0 ? announcements : fallbackMessages;
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % messages.length);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, messages.length]);

  const item = messages[current];

  const content = (
    <motion.p
      key={current}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="text-xs sm:text-sm font-display uppercase tracking-[0.12em] relative z-10"
    >
      {item.message}
    </motion.p>
  );

  return (
    <div className="bg-foreground text-background text-center py-1.5 px-4 relative overflow-hidden cursor-pointer z-[40]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
      <AnimatePresence mode="wait">
        {item.link_href ? (
          <Link key={current} to={item.link_href} className="block">
            {content}
          </Link>
        ) : (
          content
        )}
      </AnimatePresence>
    </div>
  );
}
