import { useEffect, useState } from "react";
import stoneBg from "@/assets/blaq-friday-stone-bg.jpg";

/**
 * Blaq Friday atmosphere — dark marble texture background.
 * Only renders when `.blaq-friday` class is on documentElement.
 */
export function BlaqFridayAtmosphere() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const check = () =>
      setActive(document.documentElement.classList.contains("blaq-friday"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${stoneBg})`,
          backgroundSize: "512px 512px",
          backgroundRepeat: "repeat",
          opacity: 0.6,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "hsl(0 0% 3% / 0.5)" }}
      />
    </div>
  );
}
