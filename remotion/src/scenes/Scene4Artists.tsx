import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const AMBER = "#D4930D";

const artists = [
  "Nikko Hurtado",
  "David Garcia",
  "Megan Jean Morris",
  "Kat Von D",
  "Ryan Smith",
  "Bob Tyrrell",
];

export const Scene4Artists = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #120e06 50%, #0d0d0d 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: "Oswald, sans-serif",
          fontSize: 48,
          fontWeight: 700,
          color: "#fff",
          textTransform: "uppercase",
          letterSpacing: 4,
          opacity: titleOpacity,
          marginTop: 50,
          textAlign: "center",
        }}
      >
        World-Class <span style={{ color: AMBER }}>Artist</span> Collabs
      </div>

      <div
        style={{
          width: interpolate(frame, [10, 35], [0, 280], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2,
          background: `linear-gradient(90deg, transparent, ${AMBER}, transparent)`,
          marginTop: 15,
          marginBottom: 60,
        }}
      />

      {/* Artist names with staggered reveals */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, width: "100%" }}>
        {artists.map((name, i) => {
          const delay = 20 + i * 12;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 180 } });
          const opacity = interpolate(frame - delay, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(Math.max(0, s), [0, 1], [i % 2 === 0 ? -200 : 200, 0]);

          // Alternate sides for kinetic energy
          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateX(${x}px)`,
                fontFamily: "Oswald, sans-serif",
                fontSize: 38,
                fontWeight: 600,
                color: i === 2 ? AMBER : "rgba(255,255,255,0.85)",
                textTransform: "uppercase",
                letterSpacing: 5,
                padding: "8px 40px",
                borderLeft: `3px solid ${i === 2 ? AMBER : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {name}
            </div>
          );
        })}
      </div>

      {/* Bio page hint */}
      <div
        style={{
          fontFamily: "Barlow, sans-serif",
          fontSize: 18,
          color: "#666",
          marginTop: 45,
          opacity: interpolate(frame, [95, 110], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Full Artist Profiles · Interviews · Stories
      </div>
    </AbsoluteFill>
  );
};
