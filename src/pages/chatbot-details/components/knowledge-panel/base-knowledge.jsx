import { useState } from "react";
import {
  BookOpen,
  FileText,
  Globe,
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
  useKnowledgeUsageQuery,
  useListKnowledgeQuery,
  useRetrainKnowledgeMutation,
} from "@/features/knowledge/knowledgeApiSlice";
import {
  prettyFileSize,
  sourceMeta,
} from "@/features/knowledge/knowledge.helpers";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { cn } from "@/lib/utils";
import TrainingActivity from "./training-activity";
import UploadKnowledgeDialog from "./upload-knowledge-dialog";

const UsageMeter = ({ chatbot }) => {
  const { data: usage } = useKnowledgeUsageQuery(chatbot);

  if (!usage || (!usage.chunksLimit && !usage.storageLimit)) return null;

  const percent = usage.chunksLimit
    ? Math.min(100, Math.round((usage.chunksUsed / usage.chunksLimit) * 100))
    : 0;

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-muted/20 px-4 py-3">
      <div className="flx justify-between text-xs">
        <span className="font-semibold text-foreground">Knowledge usage</span>
        {usage.chunksLimit > 0 && (
          <span className="text-muted-foreground">
            {usage.chunksUsed.toLocaleString()} /{" "}
            {usage.chunksLimit.toLocaleString()} chunks
          </span>
        )}
      </div>
      {usage.chunksLimit > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {usage.storageLimit > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {prettyFileSize(usage.storageUsed) || "0 KB"} of{" "}
          {prettyFileSize(usage.storageLimit)} file storage used
        </p>
      )}
    </div>
  );
};

const SOURCE_ICONS = {
  url: { Icon: Globe, className: "bg-sky-500/10 text-sky-600" },
  file: { Icon: FileText, className: "bg-violet-500/10 text-violet-600" },
  custom: { Icon: TextQuote, className: "bg-amber-500/10 text-amber-600" },
};

const BaseKnowledge = ({ chatbot }) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const openUpload = (source = null) => {
    setEditingSource(source);
    setUploadOpen(true);
  };

  const handleRetry = async (source) => {
    if (source.type === "custom") {
      openUpload(source);
      return;
    }

    try {
      await retrainSource({
        knowledgeBaseId: source.id,
        type: source.type,
      }).unwrap();

      toast.success(`Retraining “${source.title}”`);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, `Failed to retrain “${source.title}”`),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteSource(deleteTarget.id).unwrap();
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
      <UsageMeter chatbot={chatbot.slug} />

      <Button className="w-full rounded-xl" onClick={() => openUpload()}>
        <Upload size={16} />
        Upload Knowledge
      </Button>

      {sources.length > 0 ? (
        <div className="space-y-2">
          {sources.map((source) => {
            const { Icon, className: iconClassName } =
              SOURCE_ICONS[source.type] ?? SOURCE_ICONS.custom;

            return (
              <div
                key={source.id}
                className="flx group rounded-2xl border border-border bg-background px-3.5 py-3 transition hover:border-primary/40"
              >
                <span
                  className={cn(
                    "center size-9 shrink-0 rounded-xl",
                    iconClassName,
                  )}
                >
                  <Icon size={16} />
                </span>

                <div className="min-w-0 flex-1 px-3">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {source.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {sourceMeta(source)}
                  </p>
                </div>

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
                  <>
                    <EmBadge
                      variant="transparent"
                      size="xs"
                      className="bg-red-500/10 text-red-500"
                    >
                      Failed
                    </EmBadge>
                    <button
                      type="button"
                      aria-label={`Retry training ${source.title}`}
                      disabled={isRetraining}
                      onClick={() => handleRetry(source)}
                      className="ml-1.5 center size-8 rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  aria-label={`Remove ${source.title}`}
                  onClick={() => setDeleteTarget(source)}
                  className="ml-1.5 center size-8 rounded-full text-muted-foreground opacity-0 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
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

      <TrainingActivity chatbot={chatbot.slug} />

      <UploadKnowledgeDialog
        key={uploadOpen ? `upload-${editingSource?.id ?? "new"}` : "closed"}
        open={uploadOpen}
        setOpen={(open) => {
          if (!open) setEditingSource(null);
          setUploadOpen(open);
        }}
        chatbotSlug={chatbot.slug}
        source={editingSource}
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
