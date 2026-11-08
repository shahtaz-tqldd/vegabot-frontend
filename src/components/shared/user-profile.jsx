import { getInitials } from "@/lib/utils";

const UserIdentity = ({ name, email }) => {
  return (
    <div className="flex min-w-52 items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {getInitials(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>
      </div>
    </div>
  );
};

export { UserIdentity };
