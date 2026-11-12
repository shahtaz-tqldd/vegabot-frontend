import { Loader2, Mic } from "lucide-react";

import { cn } from "@/lib/utils";

// Idle waveform: taller in the middle, each bar on its own rhythm so it reads
// as speech rather than a metronome.
const BARS = [
  { height: 0.35, duration: 1.2, delay: 0 },
  { height: 0.55, duration: 0.9, delay: 0.15 },
  { height: 0.8, duration: 1.05, delay: 0.3 },
  { height: 1, duration: 0.85, delay: 0.05 },
  { height: 0.7, duration: 1.15, delay: 0.4 },
  { height: 1, duration: 0.95, delay: 0.2 },
  { height: 0.8, duration: 1.1, delay: 0.1 },
  { height: 0.55, duration: 0.88, delay: 0.35 },
  { height: 0.35, duration: 1.25, delay: 0.25 },
];

const RING_DELAYS = ["0s", "1.2s", "2.4s"];

/**
 * The welcome screen's call to talk: a breathing orb with rippling rings and
 * an idle waveform. Starting voice here opens a session, so the user lands
 * straight in a live conversation.
 */
const VoiceInvite = ({ chatbotName, voice, disabled = false }) => {
  const starting = voice.status === "starting";
  const busy = starting || disabled;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative center size-44">
        {/* Glow + ripples sit behind the orb and never take clicks. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-6 rounded-full bg-primary/25 blur-2xl",
            !starting && "voice-breathe",
          )}
        />
        {!busy &&
          RING_DELAYS.map((delay) => (
            <span
              key={delay}
              aria-hidden
              className="voice-ring absolute inset-[38px] rounded-full border-2 border-primary/50"
              style={{ animationDelay: delay }}
            />
          ))}

        <button
          type="button"
          onClick={voice.toggle}
          disabled={busy}
          aria-label={`Start a voice conversation with ${chatbotName}`}
          className={cn(
            "group relative center size-24 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 outline-none transition duration-300",
            "hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 active:scale-95",
            "focus-visible:ring-4 focus-visible:ring-primary/30",
            "disabled:cursor-wait disabled:hover:scale-100",
          )}
        >
          {/* Inner sheen for depth. */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent"
          />
          {starting ? (
            <Loader2 size={30} className="relative animate-spin" />
          ) : (
            <Mic
              size={32}
              strokeWidth={2.2}
              className="relative transition-transform duration-300 group-hover:scale-110"
            />
          )}
        </button>
      </div>

      <p className="mt-3 text-base font-bold text-foreground">
        {starting ? "Connecting…" : "Tap to talk"}
      </p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
        {starting
          ? "Allow microphone access if your browser asks."
          : `Just speak naturally — ${chatbotName} answers out loud. You can still type anytime.`}
      </p>
    </div>
  );
};

export default VoiceInvite;
