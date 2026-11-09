import { Loader2, MessageSquare, Plus, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollContainer } from "@/components/ui/section";
import { duration } from "@/lib/date-time";
import { cn } from "@/lib/utils";

const toSnippet = (content = "") => content.replace(/[*_`#>]/g, "").trim();

const truncate = (value, max = 42) =>
  value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;

const SessionList = ({
  sessions,
  activeSessionId,
  isLoading = false,
  isSessionsError = false,
  onRetry,
  onSelect,
  onNewSession,
  onDelete,
}) => (
  <div className="flex min-h-0 flex-1 flex-col">
    <div className="flbx shrink-0 px-4 pb-2 pt-3">
      <p className="text-xs font-semibold text-muted-foreground">
        Sessions
        {sessions.length > 0 && (
          <span className="ml-1.5 text-foreground/70">({sessions.length})</span>
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
          <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={onRetry}>
            <RotateCcw size={13} />
            Try again
          </Button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
          <MessageSquare size={20} className="mx-auto text-muted-foreground/60" />
          <p className="mt-2 text-sm font-semibold text-foreground">
            No conversations yet
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Say hello from the chat panel to start your first session.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {sessions.map((session) => {
            const title = session.lastMessage
              ? truncate(toSnippet(session.lastMessage.content))
              : "New conversation";

            return (
              <div key={session.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(session.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 pr-10 text-left transition",
                    activeSessionId === session.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-transparent hover:bg-muted/60",
                  )}
                >
                  <p className="truncate text-sm font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {session.lastMessage
                      ? `${session.lastMessage.senderType === "user" ? "You: " : ""}${toSnippet(session.lastMessage.content)}`
                      : "No messages yet"}
                  </p>
                  <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/70">
                    {duration(session.lastActivityAt ?? session.createdAt)} ·{" "}
                    {session.messageCount}{" "}
                    message{session.messageCount === 1 ? "" : "s"}
                  </p>
                </button>

                <button
                  type="button"
                  aria-label="Delete session"
                  onClick={() => onDelete(session.id)}
                  className={cn(
                    "center absolute right-2 top-1/2 size-7 -translate-y-1/2 rounded-lg text-muted-foreground/60 transition hover:bg-red-500/10 hover:text-red-500",
                    "lg:opacity-0 lg:group-hover:opacity-100",
                    activeSessionId === session.id && "lg:opacity-100",
                  )}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ScrollContainer>
  </div>
);

export default SessionList;
