import { useState } from "react";
import moment from "moment";
import {
  Bell,
  Bot,
  Loader2,
  MessageSquare,
  MessagesSquare,
  Package,
  Plus,
  RotateCcw,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import ConfirmDialog from "@/components/dialog/confirm-dialog";
import { Button } from "@/components/ui/button";
import { ScrollContainer } from "@/components/ui/section";
import { duration } from "@/lib/date-time";
import { cn } from "@/lib/utils";

const toSnippet = (content = "") =>
  content
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// The session's identity is when it started; the preview carries the content.
const sessionTitle = (session) => {
  const started = moment(session.createdAt);
  if (!started.isValid()) return "Chat session";
  return started.calendar(null, {
    sameDay: "[Today], h:mm A",
    lastDay: "[Yesterday], h:mm A",
    lastWeek: "ddd, h:mm A",
    sameElse: "MMM D, h:mm A",
  });
};

const MetaChip = ({ icon, count, label, tone = "muted" }) => {
  const Icon = icon;
  return (
    <span
      title={`${count} ${label}`}
      className={cn(
        "flx gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
        tone === "alert"
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : tone === "primary"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
      )}
    >
      <Icon size={10} />
      {count}
    </span>
  );
};

const SessionCard = ({ session, active, onSelect, onDelete }) => {
  const last = session.lastMessage;
  const fromAgent = last?.senderType === "agent";

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onSelect(session.id)}
        className={cn(
          "flex w-full gap-3 rounded-xl border p-3 text-left transition",
          active
            ? "border-primary/40 bg-primary/5"
            : "border-transparent hover:bg-muted/60",
        )}
      >
        <span
          className={cn(
            "relative center size-9 shrink-0 rounded-xl transition",
            active
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          <MessagesSquare size={16} />
          {session.escalationCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-red-500" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2 pr-6">
            <span className="truncate text-[13px] font-semibold text-foreground">
              {sessionTitle(session)}
            </span>
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground/70">
              {duration(session.lastActivityAt ?? session.createdAt)}
            </span>
          </span>

          <span className="mt-0.5 flex gap-1 text-xs leading-5 text-muted-foreground">
            {last ? (
              <span className="line-clamp-1">{toSnippet(last.content)}</span>
            ) : (
              <span className="italic">No messages yet</span>
            )}
          </span>

          <span className="mt-1.5 flex flex-wrap items-center gap-1">
            <MetaChip
              icon={MessageSquare}
              count={session.messageCount}
              label={session.messageCount === 1 ? "message" : "messages"}
            />
            {session.escalationCount > 0 && (
              <MetaChip
                icon={Bell}
                count={session.escalationCount}
                label="escalations"
                tone="alert"
              />
            )}
            {session.orderCount > 0 && (
              <MetaChip
                icon={Package}
                count={session.orderCount}
                label="orders"
                tone="primary"
              />
            )}
            {session.cartItemCount > 0 && (
              <MetaChip
                icon={ShoppingCart}
                count={session.cartItemCount}
                label="cart items"
              />
            )}
          </span>
        </span>
      </button>

      <button
        type="button"
        aria-label="Delete session"
        onClick={() => onDelete(session)}
        className={cn(
          "center absolute right-2 top-2.5 size-7 rounded-lg text-muted-foreground/60 transition hover:bg-red-500/10 hover:text-red-500",
          "lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100",
          active && "lg:opacity-100",
        )}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const SessionList = ({
  sessions,
  activeSessionId,
  isLoading = false,
  isSessionsError = false,
  onRetry,
  onSelect,
  onNewSession,
  onDelete,
}) => {
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await onDelete(toDelete.id);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flbx shrink-0 px-4 pb-2 pt-3">
        <p className="text-xs font-semibold text-muted-foreground">
          Sessions
          {sessions.length > 0 && (
            <span className="ml-1.5 text-foreground/70">
              ({sessions.length})
            </span>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-full !pl-2 pr-2.5 text-xs !gap-1"
          onClick={onNewSession}
        >
          <Plus className="size-3" />
          New chat
        </Button>
      </div>

      <ScrollContainer className="px-3 pb-4">
        {isLoading ? (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            <p className="text-xs">Loading sessions…</p>
          </div>
        ) : isSessionsError ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              Couldn't load sessions
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 rounded-full"
              onClick={onRetry}
            >
              <RotateCcw size={13} />
              Try again
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
            <MessageSquare
              size={20}
              className="mx-auto text-muted-foreground/60"
            />
            <p className="mt-2 text-sm font-semibold text-foreground">
              No conversations yet
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Say hello from the chat panel to start your first session.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                active={activeSessionId === session.id}
                onSelect={onSelect}
                onDelete={setToDelete}
              />
            ))}
          </div>
        )}
      </ScrollContainer>

      <ConfirmDialog
        open={Boolean(toDelete)}
        setOpen={(open) => !open && setToDelete(null)}
        title="Delete this conversation?"
        description={
          toDelete
            ? `The session from ${sessionTitle(toDelete)} and its ${toDelete.messageCount} message${toDelete.messageCount === 1 ? "" : "s"} will be permanently deleted. This can't be undone.`
            : ""
        }
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default SessionList;
