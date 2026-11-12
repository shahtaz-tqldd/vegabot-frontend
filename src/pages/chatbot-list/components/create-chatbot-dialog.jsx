import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
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
import { useCreateChatbotMutation } from "@/features/chatbot/chatbotApiSlice";
import FeaturePicker from "@/components/shared/feature-picker";
import {
  DEFAULT_FEATURES,
  featuresError,
  normalizeChatbot,
} from "@/features/chatbot/chatbot.helpers";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

const CreateChatbotDialog = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const [createChatbot] = useCreateChatbotMutation();
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: "", businessType: "", description: "" },
  });

  const closeDialog = () => {
    setOpen(false);
    reset();
    setFeatures(DEFAULT_FEATURES);
  };

  const onSubmit = async ({ name, businessType, description }) => {
    if (featuresError(features)) return;

    try {
      const response = await createChatbot({
        name: name.trim(),
        businessType: businessType.trim(),
        description: description.trim(),
        ...features,
      }).unwrap();

      const chatbot = normalizeChatbot(response.data);

      toast.success(`${chatbot.name} created`, {
        description: "Set it up with knowledge, then take it for a spin.",
      });

      closeDialog();
      navigate(`/chatbot/${chatbot.slug}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create chatbot"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="grid max-h-[min(90vh,46rem)] grid-rows-[auto_minmax(0,1fr)] rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a chatbot</DialogTitle>
          <DialogDescription>
            Name your agent, tell us the type of business it serves, and pick
            what it can do. You can change all of this later.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4"
        >
          <div className="custom-scrollbar min-h-0 space-y-4 overflow-y-auto pr-1 pt-2">
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

            <div>
              <p className="text-sm font-semibold text-foreground">
                What can it do?
              </p>
              <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                Turn on the capabilities this agent needs — you can add services
                or ordering later.
              </p>
              <FeaturePicker value={features} onChange={setFeatures} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || Boolean(featuresError(features))}
            >
              {isSubmitting ? "Creating…" : "Create chatbot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChatbotDialog;
