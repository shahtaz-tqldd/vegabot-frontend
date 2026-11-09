import { AudioLines, Mic, PhoneOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  connecting: "Connecting & requesting mic…",
  live: null, // derived from speaking below
  stopping: "Ending call…",
};

// Sits where the composer lives during a call: the spoken conversation itself
// renders in the message list above as live caption bubbles.
const VoiceCall = ({ status, speaking, onInterrupt, onEnd }) => {
  const statusLabel =
    STATUS_LABELS[status] ?? (speaking ? "Assistant speaking…" : "Listening…");

  return (
    <div className="shrink-0 px-5 pb-5">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flx min-w-0 gap-2.5">
          <span
            className={cn(
              "flx shrink-0 gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
              status === "stopping"
                ? "bg-muted text-muted-foreground"
                : "bg-red-500/10 text-red-500",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                status === "stopping" ? "bg-muted-foreground" : "animate-pulse bg-red-500",
              )}
            />
            {status === "stopping" ? "Ending" : "Live"}
          </span>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {statusLabel}
          </p>
        </div>

        <div className="flx shrink-0 gap-2">
          {speaking && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={onInterrupt}
            >
              <Mic size={14} />
              Interrupt
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full"
            onClick={onEnd}
            disabled={status === "stopping"}
          >
            <PhoneOff size={14} />
            End call
          </Button>
        </div>
      </div>

      <p className="mt-2 flx justify-center gap-1.5 text-[11px] text-muted-foreground/70">
        <AudioLines size={12} />
        Speak naturally — the conversation is transcribed live above
      </p>
    </div>
  );
};

export default VoiceCall;
