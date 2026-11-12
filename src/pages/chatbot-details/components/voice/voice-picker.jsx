import { useState } from "react";
import { Check, Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useVoiceOptionsQuery } from "@/features/chatbot/chatbotApiSlice";
import {
  capitalize,
  DEFAULT_SPEAKING_PACES,
} from "@/features/chatbot/voice.helpers";
import { cn } from "@/lib/utils";
import useVoicePreview from "./use-voice-preview";

const GENDER_FILTERS = [
  { value: "all", label: "All" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
];

export const VoicePlayButton = ({ preview, voice, className }) => {
  const playing = preview.isPlaying(voice.name);
  const loading = preview.isLoading(voice.name);

  return (
    <Button
      size="icon-sm"
      variant="outline"
      className={cn("shrink-0", className)}
      disabled={loading}
      onClick={(event) => {
        event.stopPropagation();
        preview.toggle(voice);
      }}
      aria-label={playing ? `Stop ${voice.name}` : `Play ${voice.name} preview`}
    >
      {loading ? (
        <span className="spinner size-3.5" />
      ) : playing ? (
        <Pause />
      ) : (
        <Play />
      )}
    </Button>
  );
};

const VoiceRowSkeleton = () => (
  <div className="flex items-center gap-3 px-3 py-2.5">
    <span className="size-8 animate-pulse rounded-full bg-muted" />
    <div className="flex-1 space-y-1.5">
      <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
      <span className="block h-2.5 w-40 animate-pulse rounded bg-muted" />
    </div>
  </div>
);

// Controlled picker: prebuilt voice (by name) + speaking pace.
// `currentVoice` is what the bot speaks with now, used to explain a custom or
// platform-default voice that isn't an explicit prebuilt choice.
const VoicePicker = ({
  voiceName,
  onVoiceChange,
  pace,
  onPaceChange,
  currentVoice,
}) => {
  const { data: options, isLoading, isError, refetch } = useVoiceOptionsQuery();
  const preview = useVoicePreview();
  const [genderFilter, setGenderFilter] = useState("all");

  const voices = (options?.prebuiltVoices ?? []).filter(
    (voice) => genderFilter === "all" || voice.gender === genderFilter,
  );
  const paces = options?.speakingPaces ?? DEFAULT_SPEAKING_PACES;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          Speaking pace
        </p>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {paces.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPaceChange(option.value)}
              aria-pressed={pace === option.value}
              className={cn(
                "rounded-lg px-2 py-1.5 text-xs font-semibold transition",
                pace === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flbx">
          <p className="text-xs font-semibold text-muted-foreground">Voice</p>
        </div>

        {currentVoice?.type === "custom" && !voiceName && (
          <p className="mb-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Currently using the custom voice “{currentVoice.name}”. Pick a
            prebuilt voice below to switch.
          </p>
        )}

        <div
          role="radiogroup"
          aria-label="Voice"
          className="overflow-hidden rounded-2xl border border-border divide-y divide-border/70"
        >
          {isLoading ? (
            <>
              <VoiceRowSkeleton />
              <VoiceRowSkeleton />
              <VoiceRowSkeleton />
            </>
          ) : isError ? (
            <div className="flbx px-3 py-3">
              <p className="text-xs text-red-600">Couldn't load voices.</p>
              <Button size="sm" variant="outline" onClick={refetch}>
                Retry
              </Button>
            </div>
          ) : (
            voices.map((voice) => {
              const selected = voice.name === voiceName;
              return (
                <div
                  key={voice.name}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => onVoiceChange(voice.name)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onVoiceChange(voice.name);
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-3 py-2.5 outline-none transition hover:bg-muted/40 focus-visible:bg-muted/40",
                    selected && "bg-primary/5 hover:bg-primary/5",
                  )}
                >
                  <VoicePlayButton preview={preview} voice={voice} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {voice.name}
                      <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                        {[voice.style, capitalize(voice.gender)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </p>
                    {voice.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {voice.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "center size-5 shrink-0 rounded-full border transition",
                      selected
                        ? "border-primary bg-primary text-white"
                        : "border-border",
                    )}
                  >
                    {selected && <Check size={12} strokeWidth={3} />}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default VoicePicker;
