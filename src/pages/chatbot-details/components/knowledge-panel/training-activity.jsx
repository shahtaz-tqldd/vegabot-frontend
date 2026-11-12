import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileStack,
  Loader2,
  RefreshCw,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTrainingLogsQuery } from "@/features/knowledge/knowledgeApiSlice";
import { duration, formatDateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";

const SPACE_LABELS = {
  document: "Documents",
  product: "Products",
  service: "Services",
};

const STAGE_STYLES = {
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  trained: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  skipped: "bg-muted text-muted-foreground",
  processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const StagePill = ({ stage }) => (
  <span
    className={cn(
      "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
      STAGE_STYLES[stage] ?? "bg-muted text-muted-foreground",
    )}
  >
    {String(stage || "unknown").replaceAll("_", " ")}
  </span>
);

const runSeconds = (log) => {
  if (!log.startedAt || !log.completedAt) return null;
  const ms = new Date(log.completedAt) - new Date(log.startedAt);
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 1000) : null;
};

const formatSeconds = (seconds) => {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
};

const Stat = ({ icon, label, value }) => {
  const Icon = icon;
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="flx gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <Icon size={11} />
        {label}
      </p>
      <p className="truncate text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
};

const TrainingLogCard = ({ log }) => {
  const [expanded, setExpanded] = useState(false);

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      toast.success("Error copied to clipboard");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const seconds = runSeconds(log);
  const inProgress = log.stage !== "completed" && log.stage !== "skipped" && log.stage !== "failed";
  const progress = log.progress || (log.totalChunks
    ? Math.round((log.processedChunks / log.totalChunks) * 100)
    : 0);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flbx gap-2">
        <div className="flx min-w-0 gap-2">
          {log.status === "failed" ? (
            <AlertTriangle size={15} className="shrink-0 text-red-500" />
          ) : log.status === "trained" ? (
            <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
          ) : (
            <Loader2 size={15} className="shrink-0 animate-spin text-amber-500" />
          )}
          <p className="truncate text-sm font-bold text-foreground">
            {SPACE_LABELS[log.space] ?? log.sourceTitle}
          </p>
          <StagePill stage={log.stage} />
          {log.forceRetrain && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              Forced
            </span>
          )}
        </div>
        <p
          className="shrink-0 text-[11px] text-muted-foreground"
          title={formatDateTime(log.createdAt)}
        >
          {duration(log.createdAt)}
        </p>
      </div>

      {log.message && (
        <p
          className={cn(
            "text-xs leading-5",
            log.status === "failed" ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
          )}
        >
          {log.message}
        </p>
      )}
      {log.errorMessage && (
        <div className="space-y-1.5 rounded-xl bg-red-500/5 px-3 py-2.5">
          <div className="flbx gap-1">
            <p className="flx min-w-0 gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              Failed Reason
            </p>
            <button
              type="button"
              aria-label="Copy error details"
              onClick={() => copyText(log.errorMessage)}
              className="center size-6 shrink-0 rounded-full text-red-500/70 transition hover:bg-red-500/10 hover:text-red-500"
            >
              <Copy size={12} />
            </button>
          </div>
          <p
            className={cn(
              "wrap-break-word text-xs leading-5 text-red-600 dark:text-red-400",
              expanded ? "" : "line-clamp-1",
            )}
          >
            {log.errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-[11px] font-bold text-red-600 underline-offset-2 hover:underline dark:text-red-400"
          >
            {expanded ? "Show less" : "See details"}
          </button>
        </div>
      )}

      {inProgress && (
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-right text-[10px] font-semibold text-muted-foreground">
            {progress}%
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
        <Stat
          icon={FileStack}
          label="Chunks"
          value={
            log.totalChunks
              ? `${log.processedChunks}/${log.totalChunks}`
              : String(log.processedChunks || "—")
          }
        />
        <Stat
          icon={RefreshCw}
          label="Content"
          value={
            log.contentChanged ? "Changed" : log.stage === "skipped" ? "Up to date" : "Unchanged"
          }
        />
        <Stat icon={Timer} label="Runtime" value={formatSeconds(seconds)} />
      </div>

      <p className="text-[10px] text-muted-foreground">
        {log.startedAt && <>Started {formatDateTime(log.startedAt)}</>}
        {log.completedAt && <> · Completed {formatDateTime(log.completedAt)}</>}
      </p>
    </div>
  );
};

// Mounted only when its tab is active, so logs are fetched on first open.
const TrainingLogs = ({ chatbot }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useTrainingLogsQuery({
    chatbot,
    page,
    page_size: 5,
  });

  const logs = data?.logs ?? [];
  const meta = data?.meta ?? {};
  const numPages = meta.num_pages ?? 1;

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((key) => (
            <div key={key} className="h-40 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="flbx rounded-2xl border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Couldn't load training logs.</p>
          <Button size="sm" variant="outline" onClick={refetch}>
            Retry
          </Button>
        </div>
      ) : !logs.length ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">
          Training runs for this chatbot will be logged here.
        </p>
      ) : (
        <>
          {logs.map((log) => (
            <TrainingLogCard key={log.id} log={log} />
          ))}
          {numPages > 1 && (
            <div className="flbx pt-1">
              <p className="text-[11px] text-muted-foreground">
                Page {meta.page ?? page} of {numPages} · {meta.count ?? logs.length} runs
              </p>
              <div className="flx gap-1.5">
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={!meta.previous || isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  size="icon-sm"
                  variant="outline"
                  disabled={!meta.next || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainingLogs;
