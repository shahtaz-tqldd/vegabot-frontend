import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useCloseOnBack } from "@/hooks/useCloseOnBack";

function Sheet({ open, defaultOpen = false, onOpenChange, ...props }) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const actualOpen = open ?? internalOpen;
  const handleOpenChange = React.useCallback(
    (nextOpen) => {
      if (open === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [open, onOpenChange],
  );

  useCloseOnBack(actualOpen, () => handleOpenChange(false));

  return (
    <SheetPrimitive.Root
      data-slot="sheet"
      open={actualOpen}
      onOpenChange={handleOpenChange}
      {...props}
    />
  );
}

function SheetTrigger({ ...props }) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200",
        className,
      )}
      {...props}
    />
  );
}

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-out will-change-transform data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-200 data-[state=open]:duration-[250ms]",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

function SheetContent({
  side = "right",
  className,
  children,
  showCloseButton = true,
  showDragHandle,
  ...props
}) {
  void showCloseButton;

  const closeButtonRef = React.useRef(null);
  const dragStartRef = React.useRef(null);
  const shouldShowDragHandle = showDragHandle ?? side === "bottom";

  const handleDragStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;

    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleDragEnd = (event) => {
    if (!dragStartRef.current) return;

    const touch = event.changedTouches?.[0];
    if (!touch) {
      dragStartRef.current = null;
      return;
    }

    const distanceY = touch.clientY - dragStartRef.current.y;
    const distanceX = Math.abs(touch.clientX - dragStartRef.current.x);
    dragStartRef.current = null;

    if (distanceY > 56 && distanceY > distanceX * 1.4) {
      closeButtonRef.current?.click();
    }
  };

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {shouldShowDragHandle && (
          <>
            <button
              type="button"
              aria-label="Swipe down to close"
              className="absolute left-1/2 top-0 z-10 flex h-9 w-24 -translate-x-1/2 touch-none items-start justify-center pt-3 md:hidden"
              onTouchStart={handleDragStart}
              onTouchEnd={handleDragEnd}
            >
              <span className="h-1.5 w-12 rounded-full bg-slate-300" />
            </button>
            <SheetPrimitive.Close
              ref={closeButtonRef}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          </>
        )}
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};