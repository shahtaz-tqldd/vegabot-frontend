import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  MessageSquareText,
  Pencil,
  Settings2,
  ShieldAlert,
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
import { FloatingTextarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select";
import { useUpdateChatbotMutation } from "@/features/chatbot/chatbotApiSlice";
import { TONE_OPTIONS } from "@/features/chatbot/chatbot.helpers";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { cn } from "@/lib/utils";

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

const languageLabel = (code) =>
  LANGUAGE_OPTIONS.find((option) => option.value === code)?.label ??
  String(code || "").toUpperCase();

const prettyTone = (tone) =>
  String(tone || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const SectionLabel = ({ children }) => (
  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
    {children}
  </p>
);

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
// latest saved values without reset effects.
const EditConfigForm = ({ chatbot, onClose }) => {
  const [updateChatbot, { isLoading }] = useUpdateChatbotMutation();

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      tone: chatbot.tone,
      language: chatbot.language || "en",
      timezone: chatbot.timezone || "UTC",
      welcomeMessage: chatbot.welcomeMessage,
      fallbackMessage: chatbot.fallbackMessage,
      instructions: chatbot.instructions,
      escalationRule: chatbot.escalationRule,
      neverAnswer: chatbot.neverAnswer,
    },
  });

  const onSubmit = async (values) => {
    try {
      await updateChatbot({
        chatbot: chatbot.slug,
        tone: values.tone,
        language: values.language,
        timezone: values.timezone,
        welcomeMessage: values.welcomeMessage?.trim() || "",
        fallbackMessage: values.fallbackMessage?.trim() || "",
        instructions: values.instructions?.trim() || "",
        escalationRule: values.escalationRule?.trim() || "",
        neverAnswer: values.neverAnswer?.trim() || "",
      }).unwrap();

      toast.success("Configuration updated");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update configuration"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-3">
        <SectionLabel>Behavior</SectionLabel>
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
      </div>

      <div className="space-y-3">
        <SectionLabel>Conversation</SectionLabel>
        <FloatingTextarea
          label="Welcome message"
          name="welcomeMessage"
          rows={3}
          className="min-h-20"
          {...register("welcomeMessage")}
        />
        <FloatingTextarea
          label="Fallback message"
          name="fallbackMessage"
          rows={3}
          className="min-h-20"
          {...register("fallbackMessage")}
        />
      </div>

      <div className="space-y-3">
        <SectionLabel>Guardrails</SectionLabel>
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

      <DialogFooter className="mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoading}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const EditConfigDialog = ({ open, setOpen, chatbot }) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="grid max-h-[min(85vh,40rem)] grid-rows-[auto_minmax(0,1fr)] rounded-3xl sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit configuration</DialogTitle>
        <DialogDescription>
          Tune how the bot speaks, greets and escalates. Identity fields live
          in the header above.
        </DialogDescription>
      </DialogHeader>

      <div className="custom-scrollbar min-h-0 overflow-y-auto pr-1">
        {open && (
          <EditConfigForm
            key={chatbot.updatedAt ?? chatbot.slug}
            chatbot={chatbot}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
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
          className="h-7 rounded-full px-2.5 text-xs"
          onClick={() => setEditOpen(true)}
        >
          <Pencil size={13} />
          Edit
        </Button>
      </div>

      <ConfigSection icon={Settings2} title="Behavior">
        <ConfigRow label="Tone of voice" value={prettyTone(chatbot.tone)} />
        <ConfigRow
          label="Language"
          value={chatbot.language && languageLabel(chatbot.language)}
        />
        <ConfigRow label="Timezone" value={chatbot.timezone} />
      </ConfigSection>

      <ConfigSection icon={MessageSquareText} title="Conversation">
        <ConfigRow label="Welcome message" value={chatbot.welcomeMessage} />
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
