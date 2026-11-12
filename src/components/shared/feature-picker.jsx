import { BookOpen, Briefcase, Check, Package, ShoppingCart } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import {
  CHATBOT_FEATURES,
  featuresError,
} from "@/features/chatbot/chatbot.helpers";
import { cn } from "@/lib/utils";

const FEATURE_ICONS = {
  knowledgeEnabled: BookOpen,
  productsEnabled: Package,
  productOrderingEnabled: ShoppingCart,
  servicesEnabled: Briefcase,
};

// Controlled toggle list for the chatbot's features. Turning products off also
// turns its ordering add-on off, matching the API's rules.
const FeaturePicker = ({ value, onChange, className }) => {
  const error = featuresError(value);

  const setFeature = (key, enabled) => {
    const next = { ...value, [key]: enabled };
    if (key === "productsEnabled" && !enabled) {
      next.productOrderingEnabled = false;
    }
    onChange(next);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-hidden rounded-2xl border border-border divide-y divide-border/70">
        {CHATBOT_FEATURES.map((feature) => {
          const Icon = FEATURE_ICONS[feature.key];
          const enabled = Boolean(value[feature.key]);
          const locked = feature.requires && !value[feature.requires];

          return (
            <label
              key={feature.key}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition",
                feature.requires && "pl-9 bg-muted/20",
                locked ? "opacity-60" : "cursor-pointer",
              )}
            >
              <span
                className={cn(
                  "center size-8 shrink-0 rounded-full transition",
                  enabled
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {feature.label}
                  {feature.requires && (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Add-on
                    </span>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {locked
                    ? "Turn on Products to enable ordering"
                    : feature.description}
                </span>
              </span>
              <Toggle
                label={feature.label}
                checked={enabled}
                disabled={Boolean(locked)}
                onChange={(checked) => setFeature(feature.key, checked)}
              />
            </label>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

// Read-only view of what the agent can do.
export const FeatureSummary = ({ value, className }) => (
  <div className={cn("grid grid-cols-2 gap-2", className)}>
    {CHATBOT_FEATURES.map((feature) => {
      const Icon = FEATURE_ICONS[feature.key];
      const enabled = Boolean(value[feature.key]);

      return (
        <div
          key={feature.key}
          title={feature.description}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border px-3 py-2.5",
            enabled
              ? "border-primary/20 bg-primary/5"
              : "border-dashed border-border bg-transparent",
          )}
        >
          <span
            className={cn(
              "center size-7 shrink-0 rounded-full",
              enabled
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground/60",
            )}
          >
            <Icon size={13} />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-xs font-semibold",
                enabled ? "text-foreground" : "text-muted-foreground/70",
              )}
            >
              {feature.label}
            </span>
            <span
              className={cn(
                "flx gap-1 text-[11px]",
                enabled ? "text-primary" : "text-muted-foreground/60",
              )}
            >
              {enabled && <Check size={10} strokeWidth={3} />}
              {enabled ? "Enabled" : "Off"}
            </span>
          </span>
        </div>
      );
    })}
  </div>
);

export default FeaturePicker;
