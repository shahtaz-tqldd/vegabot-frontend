import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, Ear, Mic, MicOff, PhoneOff, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildVoiceTranscript, VOICE_TRANSCRIPT_STEP_MS } from "@/mocks/chat";
import ChatbotTile from "../chatbot-tile";

const PHASES = {
  listening: { icon: Ear, label: "Listening…" },
  thinking: { icon: Sparkles, label: "Thinking…" },
  speaking: { icon: AudioLines, label: "Agent speaking" },
};

const formatDuration = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const VoiceCall = ({ chatbot, onEnd }) => {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [lines, setLines] = useState([]);
  const transcript = useMemo(() => buildVoiceTranscript(chatbot), [chatbot]);

  const stepRef = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const stepper = window.setInterval(() => {
      setLines((current) => {
        const nextIndex = stepRef.current;

        // Loop the scripted conversation after the greeting, keeping the
        // demo alive for as long as the call is open.
        if (nextIndex >= transcript.length) stepRef.current = 2;
        else stepRef.current = nextIndex + 1;

        return [...current, transcript[Math.min(nextIndex, transcript.length - 1)]].slice(-4);
      });
    }, VOICE_TRANSCRIPT_STEP_MS);

    return () => window.clearInterval(stepper);
  }, [transcript]);

  const lastLine = lines[lines.length - 1];
  const phase = !lastLine
    ? "listening"
    : lastLine.speaker === "user"
      ? "thinking"
      : "speaking";

  const PhaseIcon = PHASES[phase].icon;

  const handleEnd = () => onEnd(formatDuration(seconds));

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-between overflow-y-auto px-5 py-6">
      <div className="flx gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        Live voice session
        <span className="text-emerald-700/70 dark:text-emerald-400/70">
          {formatDuration(seconds)}
        </span>
      </div>

      <div className="flex flex-col items-center gap-6 py-8">
        <div className="relative center size-36">
          <span
            className={cn(
              "absolute -inset-3 rounded-full border-2 border-primary/25 animate-ping [animation-duration:2.4s]",
              muted && "border-muted-foreground/20",
            )}
          />
          <span
            className={cn(
              "absolute -inset-7 rounded-full border border-primary/15 animate-pulse [animation-duration:2.4s]",
              muted && "border-muted-foreground/10",
            )}
          />
          <div
            className={cn(
              "relative center size-32 rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-2xl shadow-primary/40 transition",
              muted && "from-muted-foreground to-muted-foreground/70 shadow-none",
            )}
          >
            <ChatbotTile
              chatbot={chatbot}
              className="size-16 rounded-full text-lg ring-4 ring-white/20"
            />
          </div>
        </div>

        <div
          className={cn(
            "flx gap-2 rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground transition",
            muted && "text-muted-foreground",
          )}
        >
          <PhaseIcon size={16} className="text-primary" />
          {muted ? "Muted" : PHASES[phase].label}
        </div>
      </div>

      <div className="w-full max-w-md space-y-2.5">
        {lines.map((line, index) => (
          <div
            key={`${line.speaker}-${index}`}
            className={cn(
              "flx gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-300",
              line.speaker === "user" && "flex-row-reverse",
            )}
          >
            {line.speaker === "agent" ? (
              <ChatbotTile
                chatbot={chatbot}
                className="size-7 shrink-0 rounded-lg text-[9px]"
              />
            ) : (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-[9px] font-bold text-white">
                You
              </span>
            )}
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-5",
                line.speaker === "user"
                  ? "rounded-tr-sm bg-primary/10 text-foreground"
                  : "rounded-tl-sm bg-muted text-foreground",
              )}
            >
              {line.text}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 pt-8">
        <div className="flx gap-4">
          <Button
            variant="outline"
            size="icon"
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            onClick={() => setMuted((current) => !current)}
            className="size-12 rounded-full"
          >
            {muted ? <MicOff size={18} className="text-red-500" /> : <Mic size={18} />}
          </Button>

          <button
            type="button"
            aria-label="End call"
            onClick={handleEnd}
            className="center size-14 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600"
          >
            <PhoneOff size={20} />
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground/70">
          Simulated live call — the realtime voice socket connects here.
        </p>
      </div>
    </div>
  );
};

export default VoiceCall;
