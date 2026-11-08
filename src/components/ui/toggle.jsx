import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const Toggle = ({ checked, onChange, disabled = false, label }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        checked ? "bg-primary" : "bg-muted-foreground/25",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition",
          checked ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
};

const FeatureToggle = ({
  enabled,
  setEnabled,
  disabled = false,
  activeTitle,
  inActiveTitle,
  activeText,
  inActiveText,
}) => {
  return (
    <div
      className={cn(
        "flbx rounded-2xl border p-4",
        enabled ? "border-emerald-500/15 bg-emerald-500/[0.05]" : "bg-muted/30",
      )}
    >
      <div className="flx gap-4 flex-1">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            enabled
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-muted text-muted-foreground",
          )}
        >
          {enabled ? <Check className="size-5" /> : <X className="size-5" />}
        </span>
        <div>
          <p className="text-sm font-semibold">
            {enabled ? activeTitle : inActiveTitle}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {enabled ? activeText : inActiveText}
          </p>
        </div>
      </div>
      <Toggle checked={enabled} onChange={setEnabled} disabled={disabled} />
    </div>
  );
};

export { Toggle, FeatureToggle };
