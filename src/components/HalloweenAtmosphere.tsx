import { useEffect, useState } from "react";

/**
 * Halloween atmosphere overlay — graveyard silhouette + flying bats + drifting fog.
 * Only renders visuals when `.halloween` class is on documentElement.
 */
export function HalloweenAtmosphere() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const check = () =>
      setActive(document.documentElement.classList.contains("halloween"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (!active) return null;

  return (
    <>
      {/* Drifting fog layers across the full page — rendered ABOVE content for visibility */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }} aria-hidden="true">
        {FOG_LAYERS.map((fog) => (
          <div
            key={fog.id}
            className="absolute"
            style={{
              top: fog.top,
              left: fog.left,
              width: fog.width,
              height: fog.height,
              background: fog.gradient,
              filter: `blur(${fog.blur})`,
              animationName: fog.animation,
              animationDuration: fog.duration,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDelay: fog.delay || "0s",
              opacity: fog.opacity,
            }}
          />
        ))}
      </div>

      {/* Fixed graveyard silhouette at page bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-0 pointer-events-none"
        aria-hidden="true"
      >
        {/* Ground fog glow — sits just above the graveyard */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: "220px" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, hsl(275 30% 12% / 0.95), hsl(275 40% 20% / 0.4), transparent)",
              animation: "fog-rise 12s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 30% 100%, hsl(275 60% 30% / 0.3), transparent 60%)",
              animation: "fog-drift-left 18s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at 70% 100%, hsl(120 80% 40% / 0.1), transparent 50%)",
              animation: "fog-drift-right 22s ease-in-out infinite 4s",
            }}
          />
        </div>

        {/* Graveyard SVG silhouette */}
        <svg
          viewBox="0 0 1440 200"
          className="w-full block relative"
          style={{ height: "180px", minHeight: "140px" }}
          preserveAspectRatio="xMidYMax slice"
          fill="hsl(270 10% 4%)"
        >
          {/* Ground */}
          <rect x="0" y="160" width="1440" height="40" />
          <ellipse cx="720" cy="160" rx="800" ry="20" />

          {/* Gravestones */}
          <rect x="80" y="110" width="30" height="50" rx="3" />
          <rect x="75" y="105" width="40" height="12" rx="6" />

          <rect x="220" y="120" width="25" height="40" rx="2" />
          <path d="M217 120 L232 95 L247 120 Z" />

          <rect x="380" y="100" width="35" height="60" rx="4" />
          <rect x="373" y="95" width="50" height="12" rx="6" />
          {/* Cross */}
          <rect x="394" y="70" width="6" height="30" />
          <rect x="385" y="80" width="24" height="6" />

          <rect x="560" y="125" width="22" height="35" rx="2" />
          <rect x="555" y="120" width="32" height="10" rx="5" />

          <rect x="750" y="105" width="30" height="55" rx="3" />
          <rect x="745" y="100" width="40" height="12" rx="6" />

          <rect x="920" y="115" width="28" height="45" rx="3" />
          <path d="M917 115 L934 88 L951 115 Z" />

          <rect x="1100" y="100" width="35" height="60" rx="4" />
          <rect x="1093" y="95" width="50" height="12" rx="6" />
          <rect x="1114" y="68" width="6" height="32" />
          <rect x="1105" y="78" width="24" height="6" />

          <rect x="1280" y="120" width="25" height="40" rx="2" />
          <rect x="1275" y="115" width="35" height="10" rx="5" />

          {/* Dead tree left */}
          <rect x="150" y="60" width="8" height="100" />
          <path d="M154 60 L130 20 M154 80 L120 55 M154 70 L180 35 M154 90 L185 70" stroke="hsl(270 10% 4%)" strokeWidth="4" fill="none" />

          {/* Dead tree right */}
          <rect x="1200" y="50" width="10" height="110" />
          <path d="M1205 50 L1180 10 M1205 70 L1170 40 M1205 65 L1235 25 M1205 85 L1240 60" stroke="hsl(270 10% 4%)" strokeWidth="4" fill="none" />

          {/* Fence */}
          {[440, 460, 480, 500, 520, 640, 660, 680, 700].map((x) => (
            <g key={x}>
              <rect x={x} y="130" width="4" height="30" />
              <polygon points={`${x},130 ${x + 2},122 ${x + 4},130`} />
            </g>
          ))}
          <rect x="438" y="140" width="86" height="3" />
          <rect x="438" y="150" width="86" height="3" />
          <rect x="638" y="140" width="66" height="3" />
          <rect x="638" y="150" width="66" height="3" />
        </svg>
      </div>

      {/* Flying bats */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {BATS.map((bat) => (
          <div
            key={bat.id}
            className="absolute"
            style={{
              top: bat.top,
              animationName: "bat-fly",
              animationDuration: bat.duration,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              animationDelay: bat.delay,
              opacity: bat.opacity,
              transform: `scale(${bat.scale})`,
            }}
          >
            <svg
              width="40"
              height="20"
              viewBox="0 0 40 20"
              fill="hsl(275 40% 25%)"
              className="bat-wings"
              style={{ animationDuration: bat.flapSpeed }}
            >
              {/* Left wing */}
              <path d="M20 10 Q10 0 0 5 Q5 8 8 6 Q6 12 2 10 Q8 14 12 10 Q10 16 6 15 Q12 16 16 12 Q14 14 20 10Z" />
              {/* Right wing */}
              <path d="M20 10 Q30 0 40 5 Q35 8 32 6 Q34 12 38 10 Q32 14 28 10 Q30 16 34 15 Q28 16 24 12 Q26 14 20 10Z" />
              {/* Body */}
              <ellipse cx="20" cy="11" rx="3" ry="4" />
              {/* Ears */}
              <polygon points="18,7 19,4 20,8" />
              <polygon points="22,7 21,4 20,8" />
              {/* Eyes */}
              <circle cx="19" cy="9" r="0.8" fill="hsl(120 100% 50%)" />
              <circle cx="21" cy="9" r="0.8" fill="hsl(120 100% 50%)" />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}

const FOG_LAYERS = [
  {
    id: "fog-1",
    top: "15%",
    left: "-20%",
    width: "140%",
    height: "180px",
    gradient: "linear-gradient(90deg, transparent 5%, hsl(275 30% 15% / 0.5), hsl(275 20% 20% / 0.7), hsl(275 25% 15% / 0.5), transparent 95%)",
    blur: "40px",
    animation: "fog-drift-left",
    duration: "30s",
    delay: "0s",
    opacity: 0.6,
  },
  {
    id: "fog-2",
    top: "35%",
    left: "-15%",
    width: "130%",
    height: "140px",
    gradient: "linear-gradient(90deg, transparent 8%, hsl(270 20% 18% / 0.4), hsl(275 35% 22% / 0.6), hsl(270 15% 15% / 0.4), transparent 92%)",
    blur: "50px",
    animation: "fog-drift-right",
    duration: "35s",
    delay: "5s",
    opacity: 0.5,
  },
  {
    id: "fog-3",
    top: "55%",
    left: "-25%",
    width: "150%",
    height: "200px",
    gradient: "linear-gradient(90deg, transparent 3%, hsl(275 35% 12% / 0.6), hsl(275 40% 18% / 0.8), hsl(275 30% 14% / 0.6), transparent 97%)",
    blur: "35px",
    animation: "fog-drift-left",
    duration: "22s",
    delay: "3s",
    opacity: 0.7,
  },
  {
    id: "fog-4",
    top: "75%",
    left: "-18%",
    width: "136%",
    height: "160px",
    gradient: "linear-gradient(90deg, transparent 10%, hsl(120 20% 15% / 0.15), hsl(275 30% 16% / 0.5), hsl(120 15% 12% / 0.1), transparent 90%)",
    blur: "45px",
    animation: "fog-drift-right",
    duration: "28s",
    delay: "8s",
    opacity: 0.55,
  },
  {
    id: "fog-5",
    top: "5%",
    left: "-22%",
    width: "144%",
    height: "120px",
    gradient: "linear-gradient(90deg, transparent 6%, hsl(275 25% 20% / 0.35), hsl(270 20% 18% / 0.5), hsl(275 25% 20% / 0.35), transparent 94%)",
    blur: "55px",
    animation: "fog-drift-left",
    duration: "40s",
    delay: "12s",
    opacity: 0.4,
  },
  {
    id: "fog-6",
    top: "88%",
    left: "-15%",
    width: "130%",
    height: "250px",
    gradient: "linear-gradient(90deg, transparent 5%, hsl(275 40% 10% / 0.7), hsl(275 35% 14% / 0.9), hsl(275 40% 10% / 0.7), transparent 95%)",
    blur: "30px",
    animation: "fog-drift-right",
    duration: "18s",
    delay: "2s",
    opacity: 0.8,
  },
];

const BATS = [
  { id: 1, top: "8%", duration: "18s", delay: "0s", opacity: 0.7, scale: 1, flapSpeed: "0.4s" },
  { id: 2, top: "15%", duration: "22s", delay: "3s", opacity: 0.5, scale: 0.7, flapSpeed: "0.35s" },
  { id: 3, top: "25%", duration: "15s", delay: "7s", opacity: 0.6, scale: 0.85, flapSpeed: "0.45s" },
  { id: 4, top: "12%", duration: "25s", delay: "10s", opacity: 0.4, scale: 0.6, flapSpeed: "0.3s" },
  { id: 5, top: "35%", duration: "20s", delay: "5s", opacity: 0.55, scale: 0.75, flapSpeed: "0.38s" },
  { id: 6, top: "5%", duration: "28s", delay: "12s", opacity: 0.35, scale: 0.55, flapSpeed: "0.32s" },
  { id: 7, top: "20%", duration: "16s", delay: "2s", opacity: 0.65, scale: 0.9, flapSpeed: "0.42s" },
  { id: 8, top: "40%", duration: "24s", delay: "8s", opacity: 0.3, scale: 0.5, flapSpeed: "0.36s" },
];
