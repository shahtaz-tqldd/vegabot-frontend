import { useState } from "react";
import { AudioLines, Loader2, Mic, MicOff, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import VoiceWave from "./voice-wave";

const voiceLabel = ({ status, muted, speaking, hearingUser }) => {
  if (status === "starting") return "Starting voice…";
  if (speaking) return "Speaking…";
  if (muted) return "Mic muted — type, or unmute to talk";
  if (hearingUser) return "Hearing you…";
  return "Listening — talk or type";
};

// The agent's voice: steady pulse while it speaks.
const SpeakingBars = () => (
  <span className="flex h-3.5 items-center gap-[3px]" aria-hidden>
    {[0, 120, 240, 360].map((delay) => (
      <span
        key={delay}
        className="h-3.5 w-[3px] animate-pulse rounded-full bg-primary"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </span>
);

const VoiceStatus = ({ voice }) => {
  const starting = voice.status === "starting";

  return (
    <div className="flx gap-2 px-2.5 pb-1 pt-1.5">
      {starting ? (
        <Loader2 size={13} className="animate-spin text-primary" />
      ) : voice.speaking ? (
        <SpeakingBars />
      ) : (
        // The user's own voice, live from the mic (flat while muted).
        <VoiceWave
          getLevel={voice.getMicLevel}
          size="sm"
          barClassName={voice.muted ? "bg-muted-foreground/40" : "bg-primary"}
        />
      )}
      <p className="truncate text-xs font-medium text-muted-foreground">
        {voiceLabel(voice)}
      </p>
    </div>
  );
};

/**
 * Text input with optional voice. Voice is a mode, not a call: while it is on
 * the user can talk or type (replies are spoken and transcribed), mute the mic
 * to just type, or switch voice off to go back to text-only replies.
 */
const Composer = ({
  onSend,
  voice,
  disabled = false,
  sendDisabled = false,
  className = "px-5 pb-5",
  placeholder,
}) => {
  const [value, setValue] = useState("");

  const voiceOn = voice && voice.status !== "off";
  const canSend = Boolean(value.trim()) && !disabled && !sendDisabled;

  const send = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className={cn("shrink-0", className)}>
      <div className="mx-auto max-w-2xl">
        <div
          className={cn(
            "rounded-2xl border bg-card p-2 shadow-sm transition focus-within:shadow-primary/5",
            voiceOn
              ? "border-primary/40"
              : "border-border focus-within:border-primary/50",
          )}
        >
          {voiceOn && <VoiceStatus voice={voice} />}

          <div className="flex items-end gap-1.5">
            <Textarea
              rows={1}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                placeholder ??
                (voiceOn ? "Type while you talk…" : "Message the bot…")
              }
              disabled={disabled}
              className="max-h-36 min-h-0 flex-1 resize-none rounded-xl border-0 bg-transparent px-2.5 py-2.5 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
            />

            {voiceOn && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={voice.muted ? "Unmute microphone" : "Mute microphone"}
                aria-pressed={voice.muted}
                title={voice.muted ? "Unmute microphone" : "Mute microphone"}
                onClick={voice.toggleMute}
                disabled={voice.status !== "on"}
                className={cn(
                  "rounded-full",
                  voice.muted
                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/15 hover:text-red-500"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                {voice.muted ? <MicOff size={17} /> : <Mic size={17} />}
              </Button>
            )}

            {voice && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={voiceOn ? "Turn off voice" : "Turn on voice"}
                aria-pressed={voiceOn}
                title={voiceOn ? "Turn off voice" : "Turn on voice"}
                onClick={voice.toggle}
                disabled={disabled}
                className={cn(
                  "rounded-full",
                  voiceOn
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                <AudioLines size={17} />
              </Button>
            )}

            <Button
              type="button"
              size="icon"
              aria-label="Send message"
              onClick={send}
              disabled={!canSend}
              className="rounded-full"
            >
              <SendHorizontal size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Composer;
