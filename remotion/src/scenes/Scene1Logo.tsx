import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

const AMBER = "#D4930D";

export const Scene1Logo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo scales up from center
  const logoScale = spring({ frame, fps, config: { damping: 15, stiffness: 80, mass: 1.5 } });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Amber line draws across
  const lineWidth = interpolate(frame, [25, 55], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Tagline fades in
  const tagOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tagY = interpolate(frame, [50, 70], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // "NEW WEBSITE" text
  const newOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const newScale = spring({ frame: frame - 70, fps, config: { damping: 12, stiffness: 200 } });

  // Subtle pulse on logo
  const pulse = 1 + Math.sin(frame * 0.08) * 0.02;

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 50%, #1a1408 0%, #0a0a0a 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {/* Amber glow behind logo */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${AMBER}15 0%, transparent 70%)`,
          transform: `scale(${logoScale * pulse})`,
          opacity: logoOpacity,
        }}
      />

      {/* Logo */}
      <Img
        src={staticFile("images/sullen-logo.png")}
        style={{
          width: 420,
          height: "auto",
          transform: `scale(${logoScale * pulse})`,
          opacity: logoOpacity,
          filter: "brightness(1.1)",
        }}
      />

      {/* Amber divider line */}
      <div
        style={{
          width: `${lineWidth}%`,
          maxWidth: 400,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${AMBER}, transparent)`,
          marginTop: 20,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
          marginTop: 25,
          fontFamily: "Barlow, sans-serif",
          fontSize: 22,
          letterSpacing: 8,
          color: "#b0a090",
          textTransform: "uppercase",
        }}
      >
        Art Driven Clothing
      </div>

      {/* NEW WEBSITE badge */}
      <div
        style={{
          opacity: newOpacity,
          transform: `scale(${Math.max(0, newScale)})`,
          marginTop: 40,
          padding: "14px 50px",
          border: `2px solid ${AMBER}`,
          fontFamily: "Oswald, sans-serif",
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: 6,
          color: AMBER,
          textTransform: "uppercase",
        }}
      >
        New Website
      </div>
    </AbsoluteFill>
  );
};
