import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Camera } from "lucide-react";
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
import { useUpdateChatbotMutation } from "@/features/chatbot/chatbotApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { useFilePreviews } from "@/lib/file-handle";
import ChatbotTile from "./chatbot-tile";

// Mounted only while the dialog is open, so form state always starts from the
// latest chatbot values without reset effects.
const UpdateChatbotForm = ({ chatbot, onClose }) => {
  const logoInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [clearLogo, setClearLogo] = useState(false);
  const [updateChatbot] = useUpdateChatbotMutation();
  const logoPreviews = useFilePreviews(logoFile ? [logoFile] : []);
  const currentLogo = logoFile
    ? logoPreviews[0]?.url
    : clearLogo
      ? null
      : chatbot.logo;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: chatbot.name,
      businessType: chatbot.businessType || "",
      description: chatbot.description || "",
    },
  });

  const onSubmit = async ({ name, businessType, description }) => {
    const changes = {
      name: name.trim(),
      businessType: businessType.trim(),
      description: description?.trim() || "",
    };

    if (logoFile) changes.logo = logoFile;
    else if (clearLogo) changes.clear_logo = true;

    try {
      await updateChatbot({ chatbot: chatbot.slug, ...changes }).unwrap();

      toast.success("Chatbot updated");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update chatbot"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <p className="text-sm font-semibold text-foreground">Chatbot photo</p>
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
        {...register("description", {
          maxLength: { value: 220, message: "Keep it under 220 characters" },
        })}
      />
      {errors.description && (
        <p className="text-xs text-red-500">{errors.description.message}</p>
      )}

      <DialogFooter className="mt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
};

const UpdateChatbotDialog = ({ chatbot, open, setOpen }) => (
  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="rounded-3xl">
      <DialogHeader>
        <DialogTitle>Update chatbot</DialogTitle>
        <DialogDescription>
          Change the name, logo, business type, and description visitors see.
        </DialogDescription>
      </DialogHeader>

      {open && (
        <UpdateChatbotForm
          key={chatbot.slug}
          chatbot={chatbot}
          onClose={() => setOpen(false)}
        />
      )}
    </DialogContent>
  </Dialog>
);

export default UpdateChatbotDialog;
