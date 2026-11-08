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
import { normalizeChatbot } from "@/features/chatbot/chatbot.helpers";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

const CreateChatbotDialog = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const [createChatbot] = useCreateChatbotMutation();
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
  };

  const onSubmit = async ({ name, businessType, description }) => {
    try {
      const response = await createChatbot({
        name: name.trim(),
        businessType: businessType.trim(),
        description: description.trim(),
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
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Create a chatbot</DialogTitle>
          <DialogDescription>
            Name your agent, tell us the type of business it serves, and add a
            short description. You can refine everything else on the next
            screen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create chatbot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChatbotDialog;
