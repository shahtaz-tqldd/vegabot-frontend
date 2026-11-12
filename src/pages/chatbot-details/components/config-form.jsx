import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AudioLines,
  Camera,
  Gauge,
  Mic,
  Pencil,
  Settings2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FloatingInput } from "@/components/ui/input";
import { FloatingTextarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select";
import FeaturePicker, {
  FeatureSummary,
} from "@/components/shared/feature-picker";
import {
  useSelectVoiceMutation,
  useUpdateChatbotMutation,
  useVoiceOptionsQuery,
} from "@/features/chatbot/chatbotApiSlice";
import {
  featuresError,
  pickFeatures,
  TONE_OPTIONS,
} from "@/features/chatbot/chatbot.helpers";
import { capitalize, paceLabel } from "@/features/chatbot/voice.helpers";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { useFilePreviews } from "@/lib/file-handle";
import { cn } from "@/lib/utils";
import ChatbotTile from "./chatbot-tile";
import useVoicePreview from "./voice/use-voice-preview";
import VoicePicker, { VoicePlayButton } from "./voice/voice-picker";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bengali" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
];

const TIMEZONE_OPTIONS = [
  "UTC",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
].map((zone) => ({ value: zone, label: zone.replaceAll("_", " ") }));

// Priority order: how the bot behaves day to day matters most, guardrails
// come second, identity details last.
const CONFIG_TABS = [
  { value: "behaviour", label: "Behavior" },
  { value: "features", label: "Features" },
  { value: "voice", label: "Voice" },
  { value: "guardrails", label: "Guardrails" },
  { value: "details", label: "Details" },
];

const TAB_BY_FIELD = {
  name: "details",
  businessType: "details",
  description: "details",
};

const languageLabel = (code) =>
  LANGUAGE_OPTIONS.find((option) => option.value === code)?.label ??
  String(code || "").toUpperCase();

const prettyTone = (tone) =>
  String(tone || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const ConfigSection = ({ icon, title, hint, children, bodyClassName }) => {
  const Icon = icon;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flbx gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flx gap-2">
          <Icon size={14} className="shrink-0 text-primary" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
            {title}
          </p>
        </div>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      <div className={cn("divide-y divide-border/70", bodyClassName)}>
        {children}
      </div>
    </div>
  );
};

const ConfigRow = ({ label, value, className }) => (
  <div className={cn("px-4 py-3", className)}>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p
      className={cn(
        "mt-1 text-[13px] leading-6 text-foreground",
        !value && "italic text-muted-foreground/60",
      )}
    >
      {value || "Not set"}
    </p>
  </div>
);

// Mounted only while the dialog is open, so the form always starts from the
// latest saved values without reset effects. Tab panels stay mounted (hidden
// with CSS) so react-hook-form values and validation are stable across tab
// switches.
const EditConfigForm = ({ chatbot, onClose }) => {
  const [activeTab, setActiveTab] = useState(CONFIG_TABS[0].value);
  const [updateChatbot, { isLoading }] = useUpdateChatbotMutation();
  const [selectVoice, { isLoading: isSelectingVoice }] =
    useSelectVoiceMutation();

  // Features, voice and pace are custom controls, so they live outside RHF.
  const [features, setFeatures] = useState(() => pickFeatures(chatbot));
  const initialVoiceName =
    chatbot.voice?.type === "prebuilt" ? chatbot.voice.name : null;
  const [voiceName, setVoiceName] = useState(initialVoiceName);
  const [speakingPace, setSpeakingPace] = useState(
    chatbot.speakingPace || "normal",
  );

  const logoInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [clearLogo, setClearLogo] = useState(false);
  const logoPreviews = useFilePreviews(logoFile ? [logoFile] : []);
  const currentLogo = logoFile
    ? logoPreviews[0]?.url
    : clearLogo
      ? null
      : chatbot.logo;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: chatbot.name,
      businessType: chatbot.businessType || "",
      description: chatbot.description || "",
      tone: chatbot.tone,
      language: chatbot.language || "en",
      timezone: chatbot.timezone || "UTC",
      fallbackMessage: chatbot.fallbackMessage,
      instructions: chatbot.instructions,
      escalationRule: chatbot.escalationRule,
      neverAnswer: chatbot.neverAnswer,
    },
  });

  const onSubmit = async (values) => {
    if (featuresError(features)) {
      setActiveTab("features");
      return;
    }

    const changes = {
      chatbot: chatbot.slug,
      name: values.name.trim(),
      businessType: values.businessType.trim(),
      description: values.description?.trim() || "",
      tone: values.tone,
      language: values.language,
      timezone: values.timezone,
      fallbackMessage: values.fallbackMessage?.trim() || "",
      instructions: values.instructions?.trim() || "",
      escalationRule: values.escalationRule?.trim() || "",
      neverAnswer: values.neverAnswer?.trim() || "",
      speakingPace,
      ...features,
    };

    if (logoFile) changes.logo = logoFile;
    else if (clearLogo) changes.clear_logo = true;

    try {
      await updateChatbot(changes).unwrap();

      if (voiceName && voiceName !== initialVoiceName) {
        await selectVoice({
          chatbot: chatbot.slug,
          voiceType: "prebuilt",
          voiceName,
        }).unwrap();
      }

      toast.success("Configuration updated");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update configuration"));
    }
  };

  // Jump to the tab that owns the first invalid field so the error is never
  // hidden behind an inactive tab.
  const onInvalid = (formErrors) => {
    const ownerTab = TAB_BY_FIELD[Object.keys(formErrors)[0]];
    if (ownerTab) setActiveTab(ownerTab);
  };

  const featureProblem = featuresError(features);

  return (
    <>
      <div className="grid grid-cols-5 gap-1 rounded-xl bg-muted p-1">
        {CONFIG_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "relative flex items-center justify-center rounded-lg px-1 py-2 text-xs font-semibold transition",
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="truncate">{tab.label}</span>
            {tab.value === "features" && featureProblem && (
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-red-500" />
            )}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4"
      >
        <div className="custom-scrollbar min-h-0 overflow-y-auto pr-1 pt-2">
          <div
            className={cn(
              "space-y-3",
              activeTab !== "behaviour" && "hidden",
            )}
          >
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                control={control}
                name="tone"
                label="Tone of voice"
                options={TONE_OPTIONS}
              />
              <SelectField
                control={control}
                name="language"
                label="Language"
                options={LANGUAGE_OPTIONS}
              />
            </div>
            <SelectField
              control={control}
              name="timezone"
              label="Timezone"
              options={TIMEZONE_OPTIONS}
            />
            <FloatingTextarea
              label="Fallback message"
              name="fallbackMessage"
              rows={3}
              className="min-h-20"
              {...register("fallbackMessage")}
            />
          </div>

          <div className={cn(activeTab !== "features" && "hidden")}>
            <p className="mb-3 text-xs text-muted-foreground">
              Choose what the agent can do. A source is only used when it's
              enabled and has trained content.
            </p>
            <FeaturePicker value={features} onChange={setFeatures} />
          </div>

          <div className={cn(activeTab !== "voice" && "hidden")}>
            <p className="mb-3 text-xs text-muted-foreground">
              Used in voice mode. Changes apply from the next voice session.
            </p>
            <VoicePicker
              voiceName={voiceName}
              onVoiceChange={setVoiceName}
              pace={speakingPace}
              onPaceChange={setSpeakingPace}
              currentVoice={chatbot.voice}
            />
          </div>

          <div
            className={cn(
              "space-y-3",
              activeTab !== "guardrails" && "hidden",
            )}
          >
            <FloatingTextarea
              label="Escalation rule"
              name="escalationRule"
              rows={3}
              className="min-h-20"
              {...register("escalationRule")}
            />
            <FloatingTextarea
              label="Never answer"
              name="neverAnswer"
              rows={3}
              className="min-h-20"
              {...register("neverAnswer")}
            />
            <FloatingTextarea
              label="Custom instructions"
              name="instructions"
              rows={3}
              className="min-h-20"
              {...register("instructions")}
            />
          </div>

          <div className={cn("space-y-4", activeTab !== "details" && "hidden")}>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="group relative rounded-2xl outline-none"
                aria-label="Change chatbot photo"
              >
                {currentLogo ? (
                  <img
                    src={currentLogo}
                    alt="Chatbot logo preview"
                    className="size-16 rounded-2xl object-cover"
                  />
                ) : (
                  <ChatbotTile
                    chatbot={chatbot}
                    className="size-16 rounded-2xl text-lg"
                  />
                )}
                <span className="absolute -bottom-1.5 -right-1.5 center size-7 rounded-full border-2 border-card bg-primary text-white transition group-hover:bg-primary/90">
                  <Camera size={13} />
                </span>
              </button>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Chatbot photo
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  PNG or JPG, shown to visitors in the widget.
                </p>
                {clearLogo && !logoFile ? (
                  <button
                    type="button"
                    className="mt-1 text-xs font-semibold text-primary hover:underline"
                    onClick={() => setClearLogo(false)}
                  >
                    Undo remove
                  </button>
                ) : (
                  chatbot.logo && (
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-red-500 hover:underline"
                      onClick={() => {
                        setLogoFile(null);
                        setClearLogo(true);
                      }}
                    >
                      Remove photo
                    </button>
                  )
                )}
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  setLogoFile(event.target.files?.[0] || null);
                  setClearLogo(false);
                }}
              />
            </div>

            <FloatingInput
              label="Chatbot name"
              name="name"
              error={errors.name?.message}
              {...register("name", {
                required: "Give your chatbot a name",
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />
            <FloatingInput
              label="Business type"
              name="businessType"
              error={errors.businessType?.message}
              {...register("businessType", {
                required: "Business type is required",
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />
            <FloatingTextarea
              label="Description (optional)"
              name="description"
              rows={3}
              className="min-h-24"
              error={errors.description?.message}
              {...register("description", {
                maxLength: { value: 220, message: "Keep it under 220 characters" },
              })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading || isSelectingVoice}
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

const EditConfigDialog = ({ open, setOpen, chatbot }) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="grid max-h-[min(88vh,44rem)] grid-rows-[auto_auto_minmax(0,1fr)] rounded-3xl sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Edit configuration</DialogTitle>
        <DialogDescription>
          Tune how the bot behaves, what it can do, how it sounds, and its
          basic details.
        </DialogDescription>
      </DialogHeader>

      {open && (
        <EditConfigForm
          key={chatbot.updatedAt ?? chatbot.slug}
          chatbot={chatbot}
          onClose={() => setOpen(false)}
        />
      )}
    </DialogContent>
  </Dialog>
);

// Current voice + pace, with a play button for prebuilt voices.
const VoiceSummary = ({ chatbot }) => {
  const { data: options } = useVoiceOptionsQuery();
  const preview = useVoicePreview();
  const voice = chatbot.voice;
  // The details payload has no preview_url until one is generated; the
  // options list may already have it.
  const playable =
    voice?.type === "prebuilt"
      ? (options?.prebuiltVoices.find((item) => item.name === voice.name) ??
        voice)
      : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {playable ? (
        <VoicePlayButton
          preview={preview}
          voice={playable}
          className="size-10 rounded-full"
        />
      ) : (
        <span className="center size-10 shrink-0 rounded-full bg-primary/10 text-primary">
          {voice?.type === "custom" ? <Mic size={16} /> : <AudioLines size={16} />}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {voice?.name || "Platform default"}
          {voice?.isDefault && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Default
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[
            voice?.type === "custom" ? "Custom voice" : voice?.style,
            capitalize(voice?.gender),
          ]
            .filter(Boolean)
            .join(" · ") || "Used in voice mode"}
        </p>
      </div>
      <span className="flx shrink-0 gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
        <Gauge size={12} className="text-primary" />
        {paceLabel(chatbot.speakingPace)}
      </span>
    </div>
  );
};

const ConfigForm = ({ chatbot }) => {
  const [editOpen, setEditOpen] = useState(false);
  const features = pickFeatures(chatbot);
  const enabledCount = Object.values(features).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flbx">
        <div>
          <p className="text-sm font-bold text-foreground">Configuration</p>
          <p className="text-xs text-muted-foreground">
            How your agent behaves, sounds, and what it can do.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-full !pl-2.5 gap-1.5 text-xs"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-3" />
          Update
        </Button>
      </div>

      <ConfigSection
        icon={Sparkles}
        title="Features"
        hint={`${enabledCount} of 4 on`}
        bodyClassName="p-3"
      >
        <FeatureSummary value={features} />
      </ConfigSection>

      <ConfigSection icon={AudioLines} title="Voice">
        <VoiceSummary chatbot={chatbot} />
      </ConfigSection>

      <ConfigSection icon={Settings2} title="Behavior">
        <div className="grid grid-cols-2 divide-x divide-border/70">
          <ConfigRow label="Tone of voice" value={prettyTone(chatbot.tone)} />
          <ConfigRow
            label="Language"
            value={chatbot.language && languageLabel(chatbot.language)}
          />
        </div>
        <ConfigRow
          label="Timezone"
          value={chatbot.timezone?.replaceAll("_", " ")}
        />
        <ConfigRow label="Fallback message" value={chatbot.fallbackMessage} />
      </ConfigSection>

      <ConfigSection icon={ShieldAlert} title="Guardrails">
        <ConfigRow label="Escalation rule" value={chatbot.escalationRule} />
        <ConfigRow label="Never answer" value={chatbot.neverAnswer} />
        <ConfigRow label="Custom instructions" value={chatbot.instructions} />
      </ConfigSection>

      <EditConfigDialog
        open={editOpen}
        setOpen={setEditOpen}
        chatbot={chatbot}
      />
    </div>
  );
};

export default ConfigForm;
