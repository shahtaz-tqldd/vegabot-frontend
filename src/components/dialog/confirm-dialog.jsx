import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ConfirmDialog = ({
  open,
  setOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "default",
  onConfirm,
  isLoading = false,
  confirmDisabled = false,
  children,
}) => {
  const handleOpenChange = (nextOpen) => {
    if (!nextOpen && isLoading) return;
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[468px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="mt-4">
            {description}
          </DialogDescription>
        </DialogHeader>

        {children}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              {cancelText}
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={onConfirm}
            variant={confirmVariant}
            disabled={isLoading || confirmDisabled}
          >
            {isLoading ? (
              <span className="spinner spinner-white" />
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
