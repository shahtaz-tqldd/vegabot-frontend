import React, { useMemo } from "react";

import { Button } from "@/components/ui/button";

const Pagination = ({ page, setPage, total, pageSize }) => {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  const pages = useMemo(() => {
    const first = Math.max(1, page - 1);
    const last = Math.min(totalPages, first + 2);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }, [page, totalPages]);

  if (!total) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl border-slate-200"
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </Button>
      {pages.map((item) => (
        <Button
          key={item}
          type="button"
          variant={item === page ? "default" : "outline"}
          size="icon-sm"
          className="rounded-xl border-slate-200"
          onClick={() => setPage(item)}
        >
          {item}
        </Button>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl border-slate-200"
        onClick={() => setPage(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export default Pagination;
