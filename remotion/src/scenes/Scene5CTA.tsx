import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Img } from "remotion";

const AMBER = "#D4930D";

export const Scene5CTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 80, mass: 1.5 } });
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const urlOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const urlY = interpolate(frame, [30, 50], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ctaScale = spring({ frame: frame - 55, fps, config: { damping: 10, stiffness: 150 } });
  const ctaOpacity = interpolate(frame, [55, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pulsing glow on CTA
  const glowIntensity = 0.3 + Math.sin(frame * 0.1) * 0.15;

  // Ambient radial accent
  const radialPulse = 0.8 + Math.sin(frame * 0.05) * 0.2;

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 45%, #1a1408 0%, #0a0a0a 65%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Big radial glow */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${AMBER}12 0%, transparent 70%)`,
          transform: `scale(${radialPulse})`,
        }}
      />

      {/* Logo */}
      <Img
        src={staticFile("images/sullen-logo.png")}
        style={{
          width: 320,
          height: "auto",
          opacity: logoOpacity,
          transform: `scale(${Math.max(0, logoScale)})`,
          filter: "brightness(1.15)",
          marginBottom: 35,
        }}
      />

      {/* URL */}
      <div
        style={{
          fontFamily: "Oswald, sans-serif",
          fontSize: 42,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: 3,
          opacity: urlOpacity,
          transform: `translateY(${urlY}px)`,
        }}
      >
        SULLENCLOTHING.COM
      </div>

      {/* Amber line */}
      <div
        style={{
          width: interpolate(frame, [40, 60], [0, 350], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2,
          background: `linear-gradient(90deg, transparent, ${AMBER}, transparent)`,
          marginTop: 15,
          marginBottom: 30,
        }}
      />

      {/* CTA Button */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${Math.max(0, ctaScale)})`,
          padding: "18px 60px",
          background: AMBER,
          borderRadius: 4,
          fontFamily: "Oswald, sans-serif",
          fontSize: 30,
          fontWeight: 700,
          color: "#0a0a0a",
          textTransform: "uppercase",
          letterSpacing: 4,
          boxShadow: `0 0 ${40 * glowIntensity}px ${AMBER}60`,
        }}
      >
        Shop Now
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: "Barlow, sans-serif",
          fontSize: 18,
          color: "#666",
          marginTop: 30,
          opacity: interpolate(frame, [75, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        Where Art Meets Streetwear
      </div>
    </AbsoluteFill>
  );
};
