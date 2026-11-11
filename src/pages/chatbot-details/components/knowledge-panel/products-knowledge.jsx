import { useMemo, useState } from "react";
import {
  EyeOff,
  Loader2,
  Package,
  RotateCcw,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmBadge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "@/components/ui/image";
import ConfirmDialog from "@/components/dialog/confirm-dialog";
import {
  useDeleteProductsMutation,
  useDisableProductsMutation,
  useListProductsQuery,
  useRetrainProductsMutation,
} from "@/features/knowledge/knowledgeApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { cn } from "@/lib/utils";
import useInfiniteList from "@/hooks/use-infinite-list";
import ListSkeleton from "./list-skeleton";
import UploadProductsDialog from "./upload-products-dialog";

const PAGE_SIZE = 20;

const BULK_ACTIONS = [
  {
    key: "retrain",
    label: "Retrain selected",
    icon: RotateCcw,
    buttonClassName: "hover:bg-primary/10 hover:text-primary",
  },
  {
    key: "disable",
    label: "Disable selected",
    icon: EyeOff,
    buttonClassName: "hover:bg-amber-500/10 hover:text-amber-600",
  },
  {
    key: "remove",
    label: "Remove selected",
    icon: Trash2,
    buttonClassName: "hover:bg-red-500/10 hover:text-red-500",
  },
];

const plural = (count) => (count === 1 ? "product" : "products");

const bulkDialogProps = (action, count) => {
  switch (action) {
    case "remove":
      return {
        title: "Remove selected products?",
        description: `${count} ${plural(count)} and their trained vectors will be removed. This cannot be undone.`,
        confirmText: "Remove",
        confirmVariant: "destructive",
      };
    case "disable":
      return {
        title: "Disable selected products?",
        description: `${count} ${plural(count)} will stop being used to answer questions until re-enabled.`,
        confirmText: "Disable",
        confirmVariant: "default",
      };
    case "retrain":
      return {
        title: "Retrain selected products?",
        description: `${count} ${plural(count)} will be re-indexed — this may take a few moments.`,
        confirmText: "Retrain",
        confirmVariant: "default",
      };
    default:
      return {};
  }
};

const ProductsKnowledge = ({ chatbot }) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [pendingAction, setPendingAction] = useState(null);
  const [prunedSlug, setPrunedSlug] = useState(chatbot.slug);

  if (prunedSlug !== chatbot.slug) {
    setPrunedSlug(chatbot.slug);
    setSelectedIds(new Set());
    setPendingAction(null);
  }

  const {
    items: products,
    meta,
    hasMore,
    isLoading,
    isFetching,
    isError,
    refetch,
    sentinelRef,
    reset,
  } = useInfiniteList({
    useQuery: useListProductsQuery,
    args: { chatbot: chatbot.slug },
    itemsKey: "products",
    pageSize: PAGE_SIZE,
  });

  const [disableProducts] = useDisableProductsMutation();
  const [deleteProducts, { isLoading: isDeleting }] =
    useDeleteProductsMutation();
  const [retrainProducts, { isLoading: isRetraining }] =
    useRetrainProductsMutation();

  const isActing = isDeleting || isRetraining;
  const selectedCount = selectedIds.size;
  const isSelecting = selectedCount > 0;
  const allSelected =
    products.length > 0 && products.every((item) => selectedIds.has(item.id));
  const someSelected = isSelecting && !allSelected;
  const selectedIdList = useMemo(() => [...selectedIds], [selectedIds]);

  const toggleSelected = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((current) =>
      products.length > 0 && products.every((item) => current.has(item.id))
        ? new Set()
        : new Set(products.map((item) => item.id)),
    );
  };

  const handleConfirm = async () => {
    if (!pendingAction || selectedIdList.length === 0) {
      setPendingAction(null);
      return;
    }

    const count = selectedIdList.length;
    const payload = { chatbot: chatbot.slug, products: selectedIdList };

    try {
      if (pendingAction === "remove") {
        await deleteProducts(payload).unwrap();
        toast.success(`Removed ${count} ${plural(count)}`);
      } else if (pendingAction === "disable") {
        await disableProducts(payload).unwrap();
        toast.success(`Disabled ${count} ${plural(count)}`);
      } else if (pendingAction === "retrain") {
        await retrainProducts(payload).unwrap();
        toast.success(`Retraining ${count} ${plural(count)}`);
      }

      setSelectedIds(new Set());
      setPendingAction(null);
      reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Action failed"));
    }
  };

  const handleUploadOpenChange = (open) => {
    setUploadOpen(open);
    if (!open) reset();
  };

  const dialogProps = bulkDialogProps(pendingAction, selectedCount);
  const showCount = !isLoading && meta?.count != null && meta.count > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 px-4 pb-3 pt-5">
        <Button
          className="w-full rounded-xl"
          onClick={() => setUploadOpen(true)}
        >
          <Upload size={16} />
          Upload Products
        </Button>

        {showCount &&
          (isSelecting ? (
            <div className="flx justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <label className="flx cursor-pointer select-none gap-2 text-xs font-semibold text-foreground">
                <Checkbox
                  checked={allSelected || (someSelected ? "indeterminate" : false)}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all products"
                />
                Select all
              </label>

              <span className="truncate text-xs font-medium text-muted-foreground">
                {selectedCount} selected
              </span>

              <TooltipProvider>
                <div className="flx shrink-0 gap-1">
                  {BULK_ACTIONS.map((action) => {
                    const Icon = action.icon;

                    return (
                      <Tooltip key={action.key}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={action.label}
                            disabled={isActing}
                            onClick={() => setPendingAction(action.key)}
                            className={cn(
                              "center size-7 rounded-full text-muted-foreground transition disabled:opacity-50",
                              action.buttonClassName,
                            )}
                          >
                            <Icon size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{action.label}</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          ) : (
            <p className="text-xs font-medium text-muted-foreground">
              Showing {products.length} of {meta.count}{" "}
              {meta.count === 1 ? "product" : "products"}
            </p>
          ))}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-5">
        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : isError && products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              Couldn't load products
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
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
            <span className="center mx-auto size-11 rounded-2xl bg-primary/10 text-primary">
              <Store size={20} />
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">
              No products yet
            </p>
            <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
              Import the spreadsheet template — one row per product is all it
              takes.
            </p>
          </div>
        ) : (
          <>
            {products.map((product) => {
              const isSelected = selectedIds.has(product.id);

              return (
                <div
                  key={product.id}
                  className={cn(
                    "flx group rounded-2xl border border-border bg-background px-3.5 py-3 transition hover:border-primary/40",
                    isSelected && "border-primary/50 bg-primary/5",
                  )}
                >
                  <span className="relative shrink-0">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      className="size-9 rounded-xl object-cover"
                      fallback={
                        <span className="center size-9 shrink-0 rounded-xl bg-primary/10 text-primary">
                          <Package size={15} />
                        </span>
                      }
                    />

                    <span
                      className={cn(
                        "center absolute -left-1.5 top-1/2 -translate-y-1/2 z-20 rounded bg-background/95 shadow-sm transition",
                        isSelected || isSelecting
                          ? "scale-100 opacity-100"
                          : " scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100",
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelected(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="size-4 rounded-[3px]"
                      />
                    </span>
                  </span>

                  <div className="min-w-0 flex-1 px-3">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {product.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {product.sku || "No SKU"} · {product.category || "General"}
                    </p>
                  </div>

                  <div className="flx shrink-0 gap-2">
                    {product.status === "processing" && (
                      <EmBadge variant="primary-accent" size="xs">
                        <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                        Training
                      </EmBadge>
                    )}
                    {product.status === "failed" && (
                      <EmBadge
                        variant="transparent"
                        size="xs"
                        className="bg-red-500/10 text-red-500"
                      >
                        Failed
                      </EmBadge>
                    )}
                    <span className="text-sm font-bold text-foreground">
                      {product.price === 0
                        ? "Free"
                        : `${product.currency} ${product.price}`}
                    </span>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div ref={sentinelRef} className="h-px" aria-hidden="true" />
            )}

            {isFetching && !isLoading && (
              <p className="flx justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <Loader2 size={13} className="animate-spin" />
                Loading more…
              </p>
            )}

            {isError && products.length > 0 && (
              <div className="flx justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3.5 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Couldn't load more products
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
        )}
      </div>

      <UploadProductsDialog
        open={uploadOpen}
        setOpen={handleUploadOpenChange}
        chatbotSlug={chatbot.slug}
      />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        setOpen={(open) => !open && setPendingAction(null)}
        title={dialogProps.title}
        description={dialogProps.description}
        confirmText={dialogProps.confirmText}
        confirmVariant={dialogProps.confirmVariant}
        isLoading={isActing}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default ProductsKnowledge;
