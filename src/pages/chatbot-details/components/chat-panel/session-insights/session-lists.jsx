import { useState } from "react";
import {
  Bell,
  ExternalLink,
  ImageOff,
  Loader2,
  Package,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/features/chat/chat.helpers";
import {
  useSessionCartItemsQuery,
  useSessionEscalationsQuery,
  useSessionOrdersQuery,
} from "@/features/chat/chatApiSlice";
import useInfiniteList from "@/hooks/use-infinite-list";
import { formatDateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  in_cart: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ordered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  open: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  removed: "bg-muted text-muted-foreground line-through",
  cancelled: "bg-muted text-muted-foreground",
};

const StatusPill = ({ status }) => (
  <span
    className={cn(
      "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
      STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
    )}
  >
    {String(status || "unknown").replaceAll("_", " ")}
  </span>
);

const EmptyState = ({ text }) => (
  <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">
    {text}
  </p>
);

// A titled block on the insights page.
export const InsightSection = ({ icon, title, count, alert, action, children }) => {
  const Icon = icon;
  return (
    <section className="space-y-2.5">
      <div className="flbx gap-2">
        <h3 className="flx gap-2 text-sm font-bold text-foreground">
          <Icon size={15} className={alert && count ? "text-red-600" : "text-primary"} />
          {title}
          {count > 0 && (
            <span
              className={cn(
                "center h-5 min-w-5 rounded-full px-1.5 text-[11px] font-bold",
                alert ? "bg-red-600 text-white" : "bg-muted text-foreground",
              )}
            >
              {count}
            </span>
          )}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
};

const ListState = ({
  items,
  isLoading,
  isError,
  refetch,
  hasMore,
  sentinelRef,
  empty,
  children,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((key) => (
          <div key={key} className="h-20 animate-pulse rounded-2xl bg-muted/60" />
        ))}
      </div>
    );
  }
  if (isError && !items.length) {
    return (
      <div className="flbx rounded-2xl border border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">Couldn't load this list.</p>
        <Button size="sm" variant="outline" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }
  if (!items.length) return empty;

  return (
    <div className="space-y-2">
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-3">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

const ProductThumb = ({ item, size = "size-12" }) =>
  item.imageUrl ? (
    <img
      src={item.imageUrl}
      alt=""
      className={cn(size, "shrink-0 rounded-xl border border-border object-cover")}
    />
  ) : (
    <span
      className={cn(
        size,
        "center shrink-0 rounded-xl bg-muted text-muted-foreground",
      )}
    >
      <ImageOff size={16} />
    </span>
  );

const CartItemRow = ({ item }) => (
  <div className="flex gap-3 rounded-2xl border border-border bg-card p-3">
    <ProductThumb item={item} />
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold text-foreground">
          {item.productName || "Unnamed product"}
        </p>
        <StatusPill status={item.status} />
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {[item.sku && `SKU ${item.sku}`, `Qty ${item.quantity}`]
          .filter(Boolean)
          .join(" · ")}
        {" · "}
        {formatMoney(item.unitPrice, item.currency)} each
      </p>
      <div className="mt-1.5 flbx">
        <p className="text-sm font-bold text-foreground">
          {formatMoney(item.lineTotal, item.currency)}
        </p>
        {item.productUrl && item.product && (
          <a
            href={item.productUrl}
            target="_blank"
            rel="noreferrer"
            className="flx gap-1 text-xs font-semibold text-primary hover:underline"
          >
            View <ExternalLink size={11} />
          </a>
        )}
        {!item.product && (
          <span className="text-[11px] text-muted-foreground">
            Product deleted
          </span>
        )}
      </div>
    </div>
  </div>
);

const CART_FILTERS = [
  { value: "", label: "All" },
  { value: "in_cart", label: "In cart" },
  { value: "ordered", label: "Ordered" },
  { value: "removed", label: "Removed" },
];

// `rev` changes when the session's counts change, so an open panel picks up
// items the agent adds mid-conversation.
export const CartSection = ({ sessionId, rev, count }) => {
  const [status, setStatus] = useState("");
  const { items, isLoading, isError, refetch, hasMore, sentinelRef } =
    useInfiniteList({
      useQuery: useSessionCartItemsQuery,
      args: { session: sessionId, status, rev },
      itemsKey: "items",
    });

  const inCart = items.filter((item) => item.status === "in_cart");
  const cartTotal = inCart.reduce(
    (sum, item) => sum + (Number(item.lineTotal) || 0),
    0,
  );

  return (
    <InsightSection
      icon={ShoppingCart}
      title="Cart"
      count={count}
      action={
        <div className="flex gap-0.5 rounded-full bg-muted p-0.5">
          {CART_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold transition",
                status === filter.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      }
    >
      <ListState
        {...{ items, isLoading, isError, refetch, hasMore, sentinelRef }}
        empty={
          <EmptyState
            text={
              status
                ? "No items with this status."
                : "Products the agent adds to this session's cart show up here."
            }
          />
        }
      >
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
        {inCart.length > 0 && !hasMore && (
          <p className="flbx px-1 text-xs text-muted-foreground">
            <span>In cart now</span>
            <span className="font-bold text-foreground">
              {formatMoney(cartTotal, inCart[0].currency)}
            </span>
          </p>
        )}
      </ListState>
    </InsightSection>
  );
};

export const OrdersSection = ({ sessionId, rev, count }) => {
  const { items, isLoading, isError, refetch, hasMore, sentinelRef } =
    useInfiniteList({
      useQuery: useSessionOrdersQuery,
      args: { session: sessionId, rev },
      itemsKey: "items",
    });

  return (
    <InsightSection icon={Package} title="Orders" count={count}>
      <ListState
        {...{ items, isLoading, isError, refetch, hasMore, sentinelRef }}
        empty={
          <EmptyState text="Orders placed during this session appear here. Payment isn't collected in chat." />
        }
      >
        {items.map((order) => (
          <div
            key={order.id}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="flbx gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-bold text-foreground">
                  {order.orderNumber}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <StatusPill status={order.status} />
            </div>
            <div className="divide-y divide-border/70">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                  <ProductThumb item={item} size="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {item.productName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.quantity} × {formatMoney(item.unitPrice, item.currency)}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {formatMoney(item.lineTotal, item.currency)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flbx border-t border-border px-4 py-2.5">
              <p className="text-xs text-muted-foreground">
                {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
              </p>
              <p className="text-sm font-bold text-foreground">
                {formatMoney(order.totalAmount, order.currency)}
              </p>
            </div>
          </div>
        ))}
      </ListState>
    </InsightSection>
  );
};

export const EscalationsSection = ({ sessionId, rev, count }) => {
  const { items, isLoading, isError, refetch, hasMore, sentinelRef } =
    useInfiniteList({
      useQuery: useSessionEscalationsQuery,
      args: { session: sessionId, rev },
      itemsKey: "items",
    });

  return (
    <InsightSection icon={Bell} title="Escalations" count={count} alert>
      <ListState
        {...{ items, isLoading, isError, refetch, hasMore, sentinelRef }}
        empty={
          <EmptyState text="When the agent hands this conversation to a human, it's logged here." />
        }
      >
        {items.map((escalation) => (
          <div
            key={escalation.id}
            className="space-y-2 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flbx gap-2">
              <p className="text-[11px] text-muted-foreground">
                {formatDateTime(escalation.createdAt)}
              </p>
              <StatusPill status={escalation.status} />
            </div>
            {escalation.question && (
              <p className="text-sm font-semibold leading-6 text-foreground">
                “{escalation.question}”
              </p>
            )}
            {escalation.reason && (
              <p className="text-xs leading-5 text-muted-foreground">
                <span className="font-semibold text-foreground">Reason: </span>
                {escalation.reason}
              </p>
            )}
            {escalation.resolutionNote && (
              <p className="rounded-xl bg-emerald-500/5 px-3 py-2 text-xs leading-5 text-foreground">
                <span className="font-semibold">Resolution: </span>
                {escalation.resolutionNote}
              </p>
            )}
          </div>
        ))}
      </ListState>
    </InsightSection>
  );
};
