import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn, toComparableOptionValue } from "@/lib/utils";
import { Controller } from "react-hook-form";

function Select({ ...props }) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ ...props }) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function FloatingSelect({
  label,
  placeholder,
  value,
  onValueChange,
  disabled,
  className,
  triggerClassName,
  contentClassName,
  displayValue,
  children,
  ...props
}) {
  const [open, setOpen] = React.useState(false);
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <Select
          value={value}
          onValueChange={onValueChange}
          open={open}
          onOpenChange={setOpen}
          disabled={disabled}
          {...props}
        >
          <SelectTrigger
            className={cn(
              "!h-auto min-h-[54px] w-full rounded-xl border border-input bg-card px-4 pb-3 pt-5 text-left text-sm text-foreground focus:border-primary focus:ring-4 focus:ring-primary/10",
              triggerClassName,
            )}
          >
            {hasValue ? (
              <span className="flex min-w-0 flex-1 items-center gap-2 truncate capitalize">
                {displayValue || value}
              </span>
            ) : (
              <SelectValue placeholder={open ? placeholder : " "} />
            )}
          </SelectTrigger>
          <SelectContent className={contentClassName}>{children}</SelectContent>
        </Select>

        <label
          className={cn(
            "pointer-events-none absolute left-4 z-10 origin-[0] bg-card px-1 py-1 text-sm text-muted-foreground transition-all duration-200",
            hasValue || open
              ? "top-0 -translate-y-1/2 scale-90 text-primary"
              : "top-1/2 -translate-y-1/2 scale-100",
          )}
        >
          {label}
        </label>
      </div>
    </div>
  );
}

function SelectTrigger({ className, size = "default", children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

function SelectField({
  control,
  name,
  label,
  options,
  error,
  rules,
  className,
  onValueChange,
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const optionItems = options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          return {
            value: String(value),
            label:
              typeof option === "string"
                ? option.replaceAll("_", " ")
                : option.label,
            icon: typeof option === "string" ? null : option.icon,
          };
        });
        const rawValue =
          field.value === "" ||
          field.value === null ||
          field.value === undefined
            ? ""
            : String(field.value);
        const comparableValue = toComparableOptionValue(rawValue);
        const selectedOption =
          optionItems.find((option) => option.value === rawValue) ||
          optionItems.find(
            (option) =>
              toComparableOptionValue(option.value) === comparableValue,
          ) ||
          optionItems.find(
            (option) =>
              toComparableOptionValue(option.label) === comparableValue,
          ) ||
          (rawValue
            ? {
                value: rawValue,
                label: rawValue.replaceAll("_", " "),
                icon: null,
              }
            : null);

        return (
          <div className={className}>
            <FloatingSelect
              key={`${name}-${selectedOption?.value || "empty"}`}
              label={label}
              placeholder={`Select ${label.toLowerCase()}`}
              value={selectedOption?.value || ""}
              displayValue={selectedOption?.label}
              onValueChange={(value) => {
                field.onChange(value);
                onValueChange?.(value);
              }}
            >
              {optionItems.map((option) => {
                return (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    textValue={option.label}
                    className="capitalize"
                  >
                    {option.icon && (
                      <span
                        className="text-base leading-none"
                        aria-hidden="true"
                      >
                        {option.icon}
                      </span>
                    )}
                    {option.label}
                  </SelectItem>
                );
              })}
            </FloatingSelect>
            {(fieldState.error?.message || error) && (
              <p className="mt-1 text-xs text-red-500">
                {fieldState.error?.message || error}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

export {
  FloatingSelect,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SelectField,
};
