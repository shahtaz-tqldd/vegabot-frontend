import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

// Bar shape: taller in the middle, so speech reads as a waveform.
const PROFILES = {
  sm: [0.55, 0.85, 1, 0.85, 0.55],
  md: [0.4, 0.65, 0.85, 1, 0.85, 0.65, 0.4],
};

const MIN_SCALE = 0.18;

/**
 * Live "receiving voice" bars driven by the microphone level. Reads
 * `getLevel()` (0..1) every animation frame and writes bar heights straight
 * to the DOM, so the chat never re-renders per frame. Each bar wobbles a
 * little out of phase so even steady speech looks alive.
 */
const VoiceWave = ({ getLevel, size = "md", className, barClassName }) => {
  const barsRef = useRef([]);
  const profile = PROFILES[size] ?? PROFILES.md;

  useEffect(() => {
    if (!getLevel) return undefined;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let frame;
    let smoothed = 0;

    const tick = (time) => {
      const level = getLevel() || 0;
      // Fast attack, slower release.
      smoothed += (level - smoothed) * (level > smoothed ? 0.5 : 0.15);

      barsRef.current.forEach((bar, index) => {
        if (!bar) return;
        const wobble = reduceMotion
          ? 1
          : 0.75 + 0.25 * Math.sin(time / 110 + index * 1.7);
        const scale = Math.max(
          MIN_SCALE,
          Math.min(1, smoothed * profile[index] * wobble * 1.6),
        );
        bar.style.transform = `scaleY(${scale})`;
      });

      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [getLevel, profile]);

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center gap-[3px]",
        size === "sm" ? "h-3.5" : "h-5",
        className,
      )}
    >
      {profile.map((_, index) => (
        <span
          key={index}
          ref={(node) => {
            barsRef.current[index] = node;
          }}
          className={cn(
            "h-full w-[3px] origin-center rounded-full transition-transform duration-75",
            barClassName ?? "bg-primary",
          )}
          style={{ transform: `scaleY(${MIN_SCALE})` }}
        />
      ))}
    </span>
  );
};

export default VoiceWave;
