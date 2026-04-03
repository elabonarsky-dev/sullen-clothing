import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";

const AMBER = "#D4930D";

const features = [
  { icon: "🛒", label: "Smart Cart", desc: "Progress rewards & recommendations" },
  { icon: "⭐", label: "Native Reviews", desc: "Verified purchase reviews with media" },
  { icon: "🔍", label: "AI Concierge", desc: "Find your perfect Sullen style" },
  { icon: "📦", label: "Order Tracking", desc: "Real-time shipment updates" },
];

export const Scene2Features = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance
  const titleScale = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0d0d0d 0%, #0f0c08 100%)",
        padding: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Section title */}
      <div
        style={{
          fontFamily: "Oswald, sans-serif",
          fontSize: 52,
          fontWeight: 700,
          color: "#fff",
          textTransform: "uppercase",
          letterSpacing: 4,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          marginTop: 60,
          textAlign: "center",
        }}
      >
        Packed With <span style={{ color: AMBER }}>Features</span>
      </div>

      {/* Amber underline */}
      <div
        style={{
          width: interpolate(frame, [10, 35], [0, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 3,
          background: AMBER,
          marginTop: 15,
          marginBottom: 50,
        }}
      />

      {/* Feature cards staggered */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 30,
          width: "100%",
          maxWidth: 900,
        }}
      >
        {features.map((feat, i) => {
          const delay = 20 + i * 18;
          const cardSpring = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 150 } });
          const cardOpacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(212,147,13,0.2)",
                borderRadius: 8,
                padding: "35px 30px",
                opacity: cardOpacity,
                transform: `translateY(${interpolate(Math.max(0, cardSpring), [0, 1], [40, 0])}px) scale(${interpolate(Math.max(0, cardSpring), [0, 1], [0.9, 1])})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>{feat.icon}</div>
              <div
                style={{
                  fontFamily: "Oswald, sans-serif",
                  fontSize: 28,
                  fontWeight: 600,
                  color: AMBER,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  marginBottom: 8,
                }}
              >
                {feat.label}
              </div>
              <div
                style={{
                  fontFamily: "Barlow, sans-serif",
                  fontSize: 18,
                  color: "#999",
                  lineHeight: 1.4,
                }}
              >
                {feat.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
