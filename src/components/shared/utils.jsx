const DetailRow = ({ icon, label, value }) => {
  const DetailIcon = icon;
  return (
    <div className="flex gap-3">
      <DetailIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs font-semibold capitalize text-muted-foreground opacity-80">
          {label}
        </p>
        <p className="mt-1 truncate text-[13px]">{value}</p>
      </div>
    </div>
  );
};

export { DetailRow };
