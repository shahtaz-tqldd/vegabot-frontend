const ListSkeleton = ({ rows = 5 }) => (
  <div className="space-y-2" aria-hidden="true">
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={index}
        className="flx rounded-2xl border border-border bg-background px-3.5 py-3"
      >
        <div className="size-9 shrink-0 animate-pulse rounded-xl bg-muted" />
        <div className="min-w-0 flex-1 space-y-1.5 px-3">
          <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-muted" />
          <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-3.5 w-14 shrink-0 animate-pulse rounded-full bg-muted" />
      </div>
    ))}
  </div>
);

export default ListSkeleton;
