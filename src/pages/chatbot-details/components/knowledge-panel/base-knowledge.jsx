import { useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Copy,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  RotateCcw,
  TextQuote,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import ConfirmDialog from "@/components/dialog/confirm-dialog";
import { Button } from "@/components/ui/button";
import { EmBadge } from "@/components/ui/badge";
import {
  useDeleteKnowledgeMutation,
  useListKnowledgeQuery,
  useRetrainKnowledgeMutation,
} from "@/features/knowledge/knowledgeApiSlice";
import { sourceMeta } from "@/features/knowledge/knowledge.helpers";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { formatDate } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import UploadKnowledgeDialog from "./upload-knowledge-dialog";

const SOURCE_ICONS = {
  website: { Icon: Globe, className: "bg-sky-500/10 text-sky-600" },
  file: { Icon: FileText, className: "bg-violet-500/10 text-violet-600" },
  text: { Icon: TextQuote, className: "bg-amber-500/10 text-amber-600" },
};

const BaseKnowledge = ({ chatbot }) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedErrors, setExpandedErrors] = useState(() => new Set());

  const {
    data: listData,
    isLoading,
    isError,
    refetch,
  } = useListKnowledgeQuery({ chatbot: chatbot.slug });

  const [retrainSource, { isLoading: isRetraining }] =
    useRetrainKnowledgeMutation();
  const [deleteSource, { isLoading: isDeleting }] = useDeleteKnowledgeMutation();

  const sources = listData?.sources ?? [];

  const toggleError = (id) =>
    setExpandedErrors((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const copyError = async (source) => {
    try {
      await navigator.clipboard.writeText(source.errorMessage || "");
      toast.success("Error copied to clipboard");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  // Retrain/retry share the same endpoint — files and text are immutable.
  const handleRetry = async (source) => {
    try {
      await retrainSource({
        chatbot: chatbot.slug,
        document: source.id,
      }).unwrap();

      toast.success(
        source.status === "failed"
          ? `Retrying “${source.title}”`
          : `Retraining “${source.title}”`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, `Failed to retrain “${source.title}”`),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteSource({
        chatbot: chatbot.slug,
        document: deleteTarget.id,
      }).unwrap();
      toast.success(`Removed “${deleteTarget.title}”`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, `Failed to remove “${deleteTarget.title}”`),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">Loading knowledge…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
        <p className="text-sm font-semibold text-foreground">
          Couldn't load knowledge
        </p>
        <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
          Something went wrong while fetching the knowledge base.
        </p>
        <Button variant="outline" className="mt-4" onClick={refetch}>
          <RotateCcw size={15} />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button className="w-full rounded-xl" onClick={() => setUploadOpen(true)}>
        <Upload size={16} />
        Upload Knowledge
      </Button>

      {sources.length > 0 ? (
        <div className="space-y-2.5">
          {sources.map((source) => {
            const { Icon, className: iconClassName } =
              SOURCE_ICONS[source.type] ?? SOURCE_ICONS.text;

            return (
              <div
                key={source.id}
                className="group space-y-2.5 rounded-2xl border border-border bg-card p-3.5 transition hover:border-primary/40"
              >
                <div className="flx gap-2">
                  <span
                    className={cn(
                      "center size-10 shrink-0 rounded-xl",
                      iconClassName,
                    )}
                  >
                    <Icon size={17} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      {source.type === "website" && source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {source.title}
                        </a>
                      ) : (
                        <p className="truncate text-sm font-semibold text-foreground">
                          {source.title}
                        </p>
                      )}
                      {source.status === "trained" && (
                        <EmBadge variant="success-accent" size="xs">
                          Trained
                        </EmBadge>
                      )}
                      {source.status === "processing" && (
                        <EmBadge variant="primary-accent" size="xs">
                          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                          Training
                        </EmBadge>
                      )}
                      {source.status === "failed" && (
                        <EmBadge
                          variant="transparent"
                          size="xs"
                          className="bg-red-500/10 text-red-500"
                        >
                          Failed
                        </EmBadge>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${source.title}`}
                        onClick={() => setDeleteTarget(source)}
                        className="center ml-1 size-7 shrink-0 rounded-full text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {sourceMeta(source)}
                      {source.processedAt &&
                        source.status === "trained" &&
                        ` · Trained ${formatDate(source.processedAt)}`}
                    </p>
                  </div>
                </div>

                {source.status === "failed" &&
                  source.errorMessage && (
                    <div className="space-y-1.5 rounded-xl bg-red-500/5 px-3 py-2.5">
                      <div className="flbx gap-1">
                        <p className="flx min-w-0 gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
                          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                          Training failed
                        </p>
                        <button
                          type="button"
                          aria-label="Copy error details"
                          onClick={() => copyError(source)}
                          className="center size-6 shrink-0 rounded-full text-red-500/70 transition hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <p
                        className={cn(
                          "text-xs leading-5 text-red-600 dark:text-red-400",
                          expandedErrors.has(source.id)
                            ? ""
                            : "line-clamp-2",
                        )}
                      >
                        {source.errorMessage}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleError(source.id)}
                        className="text-[11px] font-bold text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                      >
                        {expandedErrors.has(source.id)
                          ? "Show less"
                          : "See details"}
                      </button>
                    </div>
                  )}

                {(source.retrainable || source.status === "failed") && (
                  <div className="flbx border-t border-border pt-2.5">
                    {source.status === "failed" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5 rounded-full px-2.5 text-xs"
                        disabled={isRetraining}
                        onClick={() => handleRetry(source)}
                      >
                        <RotateCcw size={13} />
                        Retry training
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        disabled={isRetraining}
                        onClick={() => handleRetry(source)}
                      >
                        {isRetraining ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <RefreshCw size={13} />
                        )}
                        Retrain
                      </Button>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {source.retrainable
                        ? "URL content is re-crawled on retrain"
                        : "Pick up where it left off"}
                    </span>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <span className="center mx-auto size-11 rounded-2xl bg-primary/10 text-primary">
            <BookOpen size={20} />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">
            No base knowledge yet
          </p>
          <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
            Add URLs, text or documents — the bot answers from these first.
          </p>
        </div>
      )}

      <UploadKnowledgeDialog
        open={uploadOpen}
        setOpen={setUploadOpen}
        chatbotSlug={chatbot.slug}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        setOpen={(open) => !open && setDeleteTarget(null)}
        title="Remove this source?"
        description={`“${deleteTarget?.title}” and its trained vectors will no longer be used to answer questions. This cannot be undone.`}
        confirmText="Remove"
        confirmVariant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default BaseKnowledge;
