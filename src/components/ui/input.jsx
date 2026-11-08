import * as React from "react";

import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-primary/30 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

function FloatingInput({
  label,
  type = "text",
  error,
  autoComplete = "off",
  className,
  inputClassName,
  placeholder = " ",
  prefix,
  value,
  onChange,
  onBlur,
  name,
  ...props
}) {
  const [showPassword, setShowPassword] = React.useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={cn(
            `peer w-full rounded-xl border bg-card px-4 pb-3 pt-5 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-transparent focus:placeholder:text-muted-foreground
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                : "border-input focus:border-primary focus:ring-4 focus:ring-primary/10"
            }
            ${isPassword ? "pr-12" : ""}
            ${prefix ? "pl-8" : ""}`,
            inputClassName,
          )}
          {...props}
        />

        <label
          htmlFor={name}
          className={cn(
            `
    pointer-events-none absolute left-4 top-0 z-10 origin-[0] bg-card px-1 py-1 text-sm text-muted-foreground
    transform transition-all duration-200

    scale-90 -translate-y-1/2

    peer-placeholder-shown:top-1/2
    peer-placeholder-shown:-translate-y-1/2
    peer-placeholder-shown:scale-100

    peer-focus:top-0
    peer-focus:-translate-y-1/2
    peer-focus:scale-90
    peer-focus:text-primary
  `,
            prefix && "left-8",
          )}
        >
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-primary transition hover:text-green-950"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Field({ label, placeholder, register }) {
  return (
    <FloatingInput label={label} placeholder={placeholder} {...register} />
  );
}

function PriceField({ label, placeholder, register }) {
  return (
    <FloatingInput
      label={label}
      type="number"
      step="0.01"
      prefix="$"
      placeholder={placeholder}
      {...register}
    />
  );
}

export { Input, FloatingInput, Field, PriceField };
