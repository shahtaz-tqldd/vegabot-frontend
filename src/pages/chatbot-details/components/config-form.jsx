import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Camera, Pencil, Settings2, ShieldAlert } from "lucide-react";
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
import { useUpdateChatbotMutation } from "@/features/chatbot/chatbotApiSlice";
import { TONE_OPTIONS } from "@/features/chatbot/chatbot.helpers";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { useFilePreviews } from "@/lib/file-handle";
import { cn } from "@/lib/utils";
import ChatbotTile from "./chatbot-tile";

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
  { value: "guardrails", label: "Guardrails" },
  { value: "details", label: "Basic Details" },
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

const ConfigSection = ({ icon, title, children }) => {
  const Icon = icon;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flx gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
        <Icon size={14} className="shrink-0 text-primary" />
        <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
          {title}
        </p>
      </div>
      <div className="divide-y divide-border/70">{children}</div>
    </div>
  );
};

const ConfigRow = ({ label, value }) => (
  <div className="px-4 py-3">
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
    };

    if (logoFile) changes.logo = logoFile;
    else if (clearLogo) changes.clear_logo = true;

    try {
      await updateChatbot(changes).unwrap();

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

  return (
    <>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {CONFIG_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold transition",
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="truncate">{tab.label}</span>
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
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

const EditConfigDialog = ({ open, setOpen, chatbot }) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="grid max-h-[min(85vh,40rem)] grid-rows-[auto_auto_minmax(0,1fr)] rounded-3xl sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit configuration</DialogTitle>
        <DialogDescription>
          Tune how the bot behaves and escalates, or update its basic details.
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

const ConfigForm = ({ chatbot }) => {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flbx">
        <p className="text-sm font-bold text-foreground">Configuration</p>
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

      <ConfigSection icon={Settings2} title="Behavior">
        <ConfigRow label="Tone of voice" value={prettyTone(chatbot.tone)} />
        <ConfigRow
          label="Language"
          value={chatbot.language && languageLabel(chatbot.language)}
        />
        <ConfigRow label="Timezone" value={chatbot.timezone} />
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
