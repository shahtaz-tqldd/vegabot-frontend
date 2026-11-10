import { useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/features/notifications/notificationsApiSlice";
import { notificationVisual } from "@/features/notifications/notifications.helpers";
import { duration } from "@/lib/date-time";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { cn } from "@/lib/utils";
import useInfiniteList from "@/hooks/use-infinite-list";

const PAGE_SIZE = 20;

const PanelSkeleton = () => (
  <div className="space-y-1 p-2" aria-hidden="true">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="flx gap-3 rounded-xl px-3 py-2.5">
        <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
          <div className="h-3 w-2/5 animate-pulse rounded-full bg-muted" />
          <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    ))}
  </div>
);

const NotificationsMenu = () => {
  const [open, setOpen] = useState(false);

  const {
    items: notifications,
    meta,
    hasMore,
    isLoading,
    isFetching,
    isError,
    refetch,
    sentinelRef,
    reset,
  } = useInfiniteList({
    useQuery: useListNotificationsQuery,
    args: {},
    itemsKey: "notifications",
    pageSize: PAGE_SIZE,
  });

  const unreadCount = meta?.unread_count ?? 0;

  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsReadMutation();

  const handleNotificationClick = (notification) => {
    if (notification.isRead) return;

    markRead({ notification: notification.id }).unwrap().catch((error) => {
      toast.error(
        getApiErrorMessage(error, "Couldn't mark notification as read"),
      );
    });
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      reset();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Couldn't mark notifications as read"),
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
          className="center relative rounded-full border border-border bg-card p-1 outline-none transition hover:border-primary/40 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <span className="center size-8 rounded-full bg-primary/10 text-primary">
            <Bell size={16} />
          </span>
          {unreadCount > 0 && (
            <span className="center absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-96 rounded-2xl p-0 shadow-xl"
      >
        <div className="flx justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-bold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-full px-2.5 text-xs"
              disabled={isMarkingAll}
              onClick={handleMarkAllRead}
            >
              {isMarkingAll ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCheck size={14} />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <PanelSkeleton />
        ) : isError && notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">
              Couldn't load notifications
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 rounded-full"
              onClick={refetch}
            >
              Try again
            </Button>
          </div>
        ) : notifications.length > 0 ? (
          <>
            <div className="max-h-[min(24rem,60vh)] overflow-y-auto p-2 space-y-2">
              {notifications.map((notification) => {
                const { Icon, className: iconClassName } = notificationVisual(
                  notification.notificationType,
                );

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flx w-full gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted/60",
                      !notification.isRead && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "center size-8 shrink-0 rounded-full",
                        iconClassName,
                      )}
                    >
                      <Icon size={14} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "truncate text-[13px] font-semibold",
                            notification.isRead
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {notification.title || notification.notificationType}
                        </span>
                        {!notification.isRead && (
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </span>
                      {notification.message && (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {notification.message}
                        </span>
                      )}
                      {notification.createdAt && (
                        <span className="mt-1 block text-[10px] text-muted-foreground/80">
                          {duration(notification.createdAt)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}

              {hasMore && (
                <div ref={sentinelRef} className="h-px" aria-hidden="true" />
              )}

              {isFetching && !isLoading && (
                <p className="flx justify-center gap-1.5 py-2 text-xs text-muted-foreground">
                  <Loader2 size={13} className="animate-spin" />
                  Loading more…
                </p>
              )}
            </div>

            {isError && notifications.length > 0 && (
              <div className="flx justify-between gap-3 border-t border-border px-4 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Couldn't load more notifications
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={refetch}
                >
                  Try again
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="px-4 py-8 text-center">
            <span className="center mx-auto size-11 rounded-2xl bg-primary/10 text-primary">
              <Bell size={20} />
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">
              You're all caught up
            </p>
            <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
              New notifications will show up here.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsMenu;
