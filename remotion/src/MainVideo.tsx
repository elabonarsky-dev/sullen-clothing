import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Scene1Logo } from "./scenes/Scene1Logo";
import { Scene2Features } from "./scenes/Scene2Features";
import { Scene3Vault } from "./scenes/Scene3Vault";
import { Scene4Artists } from "./scenes/Scene4Artists";
import { Scene5CTA } from "./scenes/Scene5CTA";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadBarlow } from "@remotion/google-fonts/Barlow";

loadOswald();
loadBarlow();

const AMBER = "#D4930D";
const DARK = "#0D0D0D";

export const MainVideo = () => {
  const frame = useCurrentFrame();

  // Persistent subtle animated gradient background
  const gradAngle = interpolate(frame, [0, 600], [135, 225]);
  const bg = `linear-gradient(${gradAngle}deg, #0a0a0a 0%, #141008 40%, #0d0d0d 70%, #0a0806 100%)`;

  return (
    <AbsoluteFill style={{ background: bg, fontFamily: "Oswald, sans-serif" }}>
      {/* Subtle floating accent particles */}
      <FloatingAccents frame={frame} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene1Logo />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene2Features />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene3Vault />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene4Artists />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
        />

        <TransitionSeries.Sequence durationInFrames={140}>
          <Scene5CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

const FloatingAccents = ({ frame }: { frame: number }) => {
  const dots = [
    { x: 120, y: 200, size: 4, speed: 0.3, phase: 0 },
    { x: 800, y: 600, size: 3, speed: 0.5, phase: 1.2 },
    { x: 500, y: 900, size: 5, speed: 0.2, phase: 2.4 },
    { x: 900, y: 150, size: 3, speed: 0.4, phase: 0.8 },
    { x: 200, y: 700, size: 4, speed: 0.35, phase: 1.8 },
  ];

  return (
    <AbsoluteFill style={{ opacity: 0.15 }}>
      {dots.map((dot, i) => {
        const y = dot.y + Math.sin(frame * 0.02 * dot.speed + dot.phase) * 30;
        const opacity = 0.3 + Math.sin(frame * 0.03 + dot.phase) * 0.3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: dot.x,
              top: y,
              width: dot.size,
              height: dot.size,
              borderRadius: "50%",
              backgroundColor: AMBER,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
