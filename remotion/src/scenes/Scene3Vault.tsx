import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const AMBER = "#D4930D";

const tiers = [
  { name: "Prospect", color: "#888", icon: "💀" },
  { name: "Enforcer", color: "#C0C0C0", icon: "⚔️" },
  { name: "Reaper", color: AMBER, icon: "👑" },
];

export const Scene3Vault = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #1a1206 0%, #0a0a0a 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 60,
      }}
    >
      {/* Vault title */}
      <div
        style={{
          fontFamily: "Oswald, sans-serif",
          fontSize: 56,
          fontWeight: 700,
          color: "#fff",
          textTransform: "uppercase",
          letterSpacing: 6,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginTop: 40,
        }}
      >
        The <span style={{ color: AMBER }}>Vault</span>
      </div>

      <div
        style={{
          fontFamily: "Barlow, sans-serif",
          fontSize: 22,
          color: "#888",
          marginTop: 12,
          opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        Skull Points Rewards Program
      </div>

      {/* Divider */}
      <div
        style={{
          width: interpolate(frame, [20, 45], [0, 250], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2,
          background: `linear-gradient(90deg, transparent, ${AMBER}, transparent)`,
          marginTop: 25,
          marginBottom: 50,
        }}
      />

      {/* Tier cards */}
      <div style={{ display: "flex", gap: 30, alignItems: "flex-end" }}>
        {tiers.map((tier, i) => {
          const delay = 30 + i * 20;
          const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 100, mass: 1.2 } });
          const opacity = interpolate(frame - delay, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const height = 200 + i * 50;

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateY(${interpolate(Math.max(0, s), [0, 1], [60, 0])}px)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 240,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height,
                  background: `linear-gradient(180deg, ${tier.color}18 0%, ${tier.color}08 100%)`,
                  border: `1px solid ${tier.color}40`,
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 15,
                }}
              >
                <div style={{ fontSize: 52 }}>{tier.icon}</div>
                <div
                  style={{
                    fontFamily: "Oswald, sans-serif",
                    fontSize: 26,
                    fontWeight: 700,
                    color: tier.color,
                    textTransform: "uppercase",
                    letterSpacing: 3,
                  }}
                >
                  {tier.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Points tagline */}
      <div
        style={{
          fontFamily: "Barlow, sans-serif",
          fontSize: 20,
          color: "#777",
          marginTop: 40,
          opacity: interpolate(frame, [85, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          textAlign: "center",
        }}
      >
        Earn Skull Points · Unlock Exclusive Drops · Level Up
      </div>
    </AbsoluteFill>
  );
};
