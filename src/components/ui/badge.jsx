import { cn, formatStatus } from "@/lib/utils";

const Badge = ({ children }) => {
  const normalized = children.toLowerCase();

  const styles = {
    completed: "bg-primary text-white ring-primary/20",
    approved: "bg-primary text-white ring-primary/20",
    published: "bg-primary text-white ring-primary/20",
    in_progress: "bg-primary/10 text-primary ring-primary/20",
    draft: "bg-gray-50 text-gray-600 ring-gray-500/20",
    cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",

    complete: "bg-primary/10 text-primary ring-primary/20",

    verified: "bg-blue-600/10 text-blue-600 ring-blue-600/10",
    unverified: "bg-gray-50 text-gray-600 ring-gray-500/20",
    incomplete: "bg-red-100 text-red-500 ring-red-500/10",

    active: "bg-primary/10 text-primary ring-primary/20",
    premium: "bg-purple-700 text-white ring-purple-700/20",
    suspended: "bg-amber-50 text-amber-700 ring-amber-600/20",
    deactivated: "bg-slate-100 text-slate-600 ring-slate-500/20",
    reject: "bg-red-100 text-red-600 ring-red-500/20",
    rejected: "bg-red-100 text-red-600 ring-red-500/20",
    deleted: "bg-red-100 text-red-600 ring-red-500/20",

    ai_enabled: "bg-emerald-500/10 text-emerald-500 ring-transparent",
    ai_disabled: "bg-red-500/10 text-red-500 ring-transparent",
    growth: "bg-orange-500/10 text-orange-500 ring-transparent",
    starter: "bg-blue-500/10 text-blue-500 ring-transparent",
    free: "bg-slate-400/10 text-slate-600 ring-transparent",
  };

  const appliedStyle =
    styles[normalized] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";

  const displayStatus = children
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset",
        appliedStyle,
      )}
    >
      {displayStatus}
    </span>
  );
};

const StatusBadge = ({ children }) => {
  const styles = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    connected: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    draft: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    disabled: "bg-muted text-muted-foreground",
  };
  const normalizedStatus = String(children || "draft").toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold",
        styles[normalizedStatus] || styles.draft,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {formatStatus(normalizedStatus)}
    </span>
  );
};

const EmBadge = ({
  children,
  variant = "primary",
  size = "sm",
  className = "",
}) => {
  const styles = {
    primary: "bg-primary/10 text-slate-700",
    transparent: "bg-transparent text-slate-700",
    "primary-accent": "bg-primary/10 text-primary",
    secondary: "bg-primary/10 text-primary",
    accent: "bg-gray-50 text-gray-600",
    destructive: "bg-slate-100 text-slate-600",
    success: "bg-emerald-600 text-white",
    "success-accent": "bg-emerald-600/10 text-emerald-600",
  };

  const sizes = {
    xs: "py-1 px-2 text-[11px]",
    sm: "px-2.5 py-1.5 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        styles[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
};

export { Badge, StatusBadge, EmBadge };
