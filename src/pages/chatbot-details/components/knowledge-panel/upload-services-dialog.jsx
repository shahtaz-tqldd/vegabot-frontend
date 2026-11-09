import { useRef, useState } from "react";
import {
  FileSpreadsheet,
  FileUp,
  Info,
  ListPlus,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBulkCreateServicesMutation,
  useCreateServiceMutation,
  useImportServicesMutation,
  useLazyDownloadServiceTemplateQuery,
} from "@/features/knowledge/knowledgeApiSlice";
import { CURRENCY_OPTIONS } from "@/features/knowledge/knowledge.helpers";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { cn } from "@/lib/utils";

const TEMPLATE_COLUMNS = [
  "name",
  "service_type",
  "description",
  "cost",
  "currency",
];

const EMPTY_FORM = {
  name: "",
  serviceType: "",
  description: "",
  cost: "",
  currency: "USD",
};

const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const SectionLabel = ({ icon, children }) => {
  const Icon = icon;

  return (
    <p className="flx gap-2 text-sm font-semibold text-foreground">
      <Icon size={15} className="shrink-0 text-primary" />
      {children}
    </p>
  );
};

const UploadServicesDialog = ({ open, setOpen, chatbotSlug }) => {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pending, setPending] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [importServices, { isLoading: isImporting }] =
    useImportServicesMutation();
  const [createService, { isLoading: isCreating }] =
    useCreateServiceMutation();
  const [bulkCreateServices, { isLoading: isBulkCreating }] =
    useBulkCreateServicesMutation();
  const [downloadTemplate, { isFetching: isDownloading }] =
    useLazyDownloadServiceTemplateQuery();

  const isSaving = isCreating || isBulkCreating;

  const closeDialog = () => {
    setForm(EMPTY_FORM);
    setPending([]);
    setOpen(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const { data } = await downloadTemplate();

      if (!data?.blob) return;

      saveBlob(data.blob, data.fileName);
      toast.success("Template downloaded", {
        description: "One row per service, then upload it back here.",
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to download template"));
    }
  };

  const handleUpload = async (fileList) => {
    const file = Array.from(fileList || [])[0];
    if (!file) return;

    try {
      const response = await importServices({
        chatbot: chatbotSlug,
        file,
      }).unwrap();

      const payload = response?.data ?? {};
      const created = payload.created_count ?? 0;
      const rowErrors = payload.errors ?? [];

      if (created) {
        toast.success(`Imported ${created} service${created === 1 ? "" : "s"}`, {
          description: rowErrors.length
            ? `${rowErrors.length} row${rowErrors.length === 1 ? "" : "s"} skipped — check the file and re-import the rest.`
            : "Queued for training — usable once trained.",
        });
        closeDialog();
      } else {
        toast.error("No services were imported", {
          description:
            rowErrors[0]?.error ??
            rowErrors[0]?.message ??
            `Expected columns: ${TEMPLATE_COLUMNS.join(", ")}.`,
        });
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error) || "Couldn't read that file", {
        description: "Upload the CSV or XLSX template with the same columns.",
      });
    }
  };

  const handleAddToPending = () => {
    if (form.name.trim().length < 2) {
      toast.error("Give the service a name");
      return;
    }

    setPending((current) => [
      ...current,
      {
        name: form.name.trim(),
        service_type: form.serviceType.trim(),
        description: form.description.trim(),
        cost: Number(form.cost) || 0,
        currency: form.currency,
      },
    ]);
    setForm(EMPTY_FORM);
  };

  const handleSavePending = async () => {
    if (!pending.length) return;

    try {
      if (pending.length === 1) {
        await createService({ chatbot: chatbotSlug, ...pending[0] }).unwrap();
      } else {
        await bulkCreateServices({
          chatbot: chatbotSlug,
          services: pending,
        }).unwrap();
      }

      toast.success(
        `Added ${pending.length} service${pending.length === 1 ? "" : "s"}`,
        { description: "Queued for training — usable once trained." },
      );
      closeDialog();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add services"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="grid max-h-[min(85vh,40rem)] grid-rows-[auto_minmax(0,1fr)_auto] rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add services</DialogTitle>
          <DialogDescription>
            Import several from a spreadsheet, or add them one at a time —
            services the bot can explain and offer.
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar min-h-0 space-y-5 overflow-y-auto pr-1">
          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 px-4 py-3.5">
            <SectionLabel icon={Info}>How it works</SectionLabel>
            <p className="pl-7 text-xs leading-5 text-muted-foreground">
              Download the <b className="font-semibold text-foreground">template</b>,
              fill one row per service — columns:{" "}
              <b className="font-semibold text-foreground">
                {TEMPLATE_COLUMNS.join(", ")}
              </b>{" "}
              — then upload it back (up to 5,000 rows). Or add services manually
              below, one at a time or several in a row before saving.
            </p>
          </div>

          <div className="space-y-3">
            <SectionLabel icon={FileSpreadsheet}>
              Import from spreadsheet
            </SectionLabel>

            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
            >
              <FileSpreadsheet size={16} />
              {isDownloading ? "Downloading…" : "Download template"}
            </Button>

            <button
              type="button"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleUpload(event.dataTransfer.files);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center transition",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5",
              )}
            >
              <span className="center size-10 rounded-2xl bg-primary/10 text-primary">
                {isImporting ? <FileUp size={18} /> : <Wrench size={18} />}
              </span>
              <p className="mt-2.5 text-sm font-semibold text-foreground">
                {isImporting ? "Importing…" : "Drop the file here or click to browse"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                CSV or XLSX — same columns as the template
              </p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              onChange={(event) => {
                handleUpload(event.target.files);
                event.target.value = "";
              }}
            />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <SectionLabel icon={Plus}>Add manually</SectionLabel>

            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Service name, e.g. Personal training session"
              className="rounded-xl"
            />
            <Input
              value={form.serviceType}
              onChange={(event) =>
                setForm({ ...form, serviceType: event.target.value })
              }
              placeholder="Service type (optional), e.g. Consulting"
              className="rounded-xl"
            />
            <Textarea
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="What's included, who it's for…"
              className="min-h-16 rounded-xl"
            />
            <div className="flx gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Cost
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={(event) =>
                    setForm({ ...form, cost: event.target.value })
                  }
                  placeholder="0"
                  className="rounded-xl"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Currency
                </label>
                <Select
                  value={form.currency}
                  onValueChange={(value) =>
                    setForm({ ...form, currency: value })
                  }
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={handleAddToPending}
            >
              <ListPlus size={16} />
              Add to list
            </Button>

            {pending.length > 0 && (
              <div className="space-y-2">
                {pending.map((service, index) => (
                  <div
                    key={`${service.name}-${index}`}
                    className="flx rounded-xl border border-border bg-background px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {service.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {[
                          service.service_type,
                          service.cost === 0
                            ? "Free"
                            : `${service.currency} ${service.cost}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${service.name} from list`}
                      onClick={() =>
                        setPending((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      className="center size-7 rounded-full text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button onClick={handleSavePending} disabled={!pending.length || isSaving}>
            {isSaving
              ? "Saving…"
              : pending.length
                ? `Add ${pending.length} service${pending.length === 1 ? "" : "s"}`
                : "Add services"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadServicesDialog;
