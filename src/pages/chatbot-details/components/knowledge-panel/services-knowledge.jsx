import { useState } from "react";
import { Loader2, Sparkles, Trash2, Upload, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmBadge } from "@/components/ui/badge";
import {
  useDeleteServiceMutation,
  useListServicesQuery,
} from "@/features/knowledge/knowledgeApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import useInfiniteList from "@/hooks/use-infinite-list";
import ListSkeleton from "./list-skeleton";
import UploadServicesDialog from "./upload-services-dialog";

const PAGE_SIZE = 20;

const ServicesKnowledge = ({ chatbot }) => {
  const [uploadOpen, setUploadOpen] = useState(false);

  const {
    items: services,
    count,
    hasMore,
    isLoading,
    isFetching,
    isError,
    refetch,
    sentinelRef,
    reset,
  } = useInfiniteList({
    useQuery: useListServicesQuery,
    args: { chatbot: chatbot.slug },
    itemsKey: "services",
    pageSize: PAGE_SIZE,
  });

  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();

  const handleRemove = async (service) => {
    try {
      await deleteService({
        chatbot: chatbot.slug,
        service: service.id,
      }).unwrap();
      toast.success(`Removed “${service.name}”`);
      reset();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, `Failed to remove “${service.name}”`),
      );
    }
  };

  const handleUploadOpenChange = (open) => {
    setUploadOpen(open);
    if (!open) reset();
  };

  return (
    <div className="space-y-5">
      <Button
        className="w-full rounded-xl"
        onClick={() => setUploadOpen(true)}
      >
        <Upload size={16} />
        Add Services
      </Button>

      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : isError && services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            Couldn't load services
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
      ) : services.length > 0 ? (
        <>
          {count != null && count > 0 && (
            <p className="text-xs font-medium text-muted-foreground">
              Showing {services.length} of {count}{" "}
              {count === 1 ? "service" : "services"}
            </p>
          )}

          <div className="space-y-2">
            {services.map((service) => (
              <div
                key={service.id}
                className="flx group rounded-2xl border border-border bg-background px-3.5 py-3 transition hover:border-primary/40"
              >
                <span className="center size-9 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Wrench size={15} />
                </span>

                <div className="min-w-0 flex-1 px-3">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {service.name}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {service.description || service.serviceType || "No description"}
                  </p>
                </div>

                <div className="flx shrink-0 gap-2">
                  {service.status === "processing" && (
                    <EmBadge variant="primary-accent" size="xs">
                      <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                      Training
                    </EmBadge>
                  )}
                  {service.status === "failed" && (
                    <EmBadge
                      variant="transparent"
                      size="xs"
                      className="bg-red-500/10 text-red-500"
                    >
                      Failed
                    </EmBadge>
                  )}
                  {service.serviceType && (
                    <EmBadge variant="primary-accent" size="xs">
                      <Sparkles size={11} />
                      {service.serviceType}
                    </EmBadge>
                  )}
                  <span className="text-sm font-bold text-foreground">
                    {service.cost === 0
                      ? "Free"
                      : `${service.currency} ${service.cost}`}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${service.name}`}
                    disabled={isDeleting}
                    onClick={() => handleRemove(service)}
                    className="center size-8 rounded-full text-muted-foreground opacity-0 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasMore && <div ref={sentinelRef} className="h-px" aria-hidden="true" />}

          {isFetching && !isLoading && (
            <p className="flx justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <Loader2 size={13} className="animate-spin" />
              Loading more…
            </p>
          )}

          {isError && services.length > 0 && (
            <div className="flx justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-3.5 py-2.5">
              <p className="text-xs text-muted-foreground">
                Couldn't load more services
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
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <span className="center mx-auto size-11 rounded-2xl bg-primary/10 text-primary">
            <Wrench size={20} />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">
            No services yet
          </p>
          <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
            Import from the template or add services manually.
          </p>
        </div>
      )}

      <UploadServicesDialog
        open={uploadOpen}
        setOpen={handleUploadOpenChange}
        chatbotSlug={chatbot.slug}
      />
    </div>
  );
};

export default ServicesKnowledge;
