import { useRef, useState } from "react";
import {
  CalendarClock,
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
  downloadSpreadsheetTemplate,
  normalizeServiceRows,
  parseSpreadsheetRows,
  SERVICE_TEMPLATE,
} from "@/lib/spreadsheet";
import { addServices } from "@/mocks/chatbots";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  durationMinutes: 30,
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

const UploadServicesDialog = ({ open, setOpen, chatbot, onChange }) => {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pending, setPending] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const closeDialog = () => {
    setForm(EMPTY_FORM);
    setPending([]);
    setOpen(false);
  };

  const handleDownloadTemplate = () => {
    downloadSpreadsheetTemplate(SERVICE_TEMPLATE);
    toast.success("Template downloaded", {
      description: "One row per service, then upload it back here.",
    });
  };

  const handleUpload = async (fileList) => {
    const file = Array.from(fileList || [])[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const rows = normalizeServiceRows(await parseSpreadsheetRows(file));

      if (!rows.length) {
        toast.error("No services found in the file", {
          description: `Expected columns: ${SERVICE_TEMPLATE.headers.join(", ")}.`,
        });
        return;
      }

      addServices(chatbot.slug, rows);
      onChange();
      toast.success(`Imported ${rows.length} service${rows.length === 1 ? "" : "s"}`);
      closeDialog();
    } catch {
      toast.error("Couldn't read that file", {
        description:
          "Upload the .xlsx template or a CSV export with the same columns.",
      });
    } finally {
      setIsImporting(false);
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
        description: form.description.trim(),
        price: Number(form.price) || 0,
        durationMinutes: form.durationMinutes,
      },
    ]);
    setForm(EMPTY_FORM);
  };

  const handleSavePending = () => {
    if (!pending.length) return;

    addServices(chatbot.slug, pending);
    onChange();
    toast.success(
      `Added ${pending.length} service${pending.length === 1 ? "" : "s"}`,
    );
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="grid max-h-[min(85vh,40rem)] grid-rows-[auto_minmax(0,1fr)_auto] rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add services</DialogTitle>
          <DialogDescription>
            Import several from a spreadsheet, or add them one at a time —
            services the bot can explain and book.
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar min-h-0 space-y-5 overflow-y-auto pr-1">
          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 px-4 py-3.5">
            <SectionLabel icon={Info}>How it works</SectionLabel>
            <p className="pl-7 text-xs leading-5 text-muted-foreground">
              Download the <b className="font-semibold text-foreground">template</b>,
              fill one row per service — columns:{" "}
              <b className="font-semibold text-foreground">
                {SERVICE_TEMPLATE.headers.join(", ")}
              </b>{" "}
              — then upload it back. Or add services manually below, one at a
              time or several in a row before saving.
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
            >
              <FileSpreadsheet size={16} />
              Download template
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
                CSV, XLSX or XLS — same columns as the template
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
                  Price (USD)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: event.target.value })
                  }
                  placeholder="0"
                  className="rounded-xl"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Duration
                </label>
                <Select
                  value={String(form.durationMinutes)}
                  onValueChange={(value) =>
                    setForm({ ...form, durationMinutes: Number(value) })
                  }
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} min
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
                      <p className="flx gap-1.5 text-[11px] text-muted-foreground">
                        <CalendarClock size={11} />
                        {service.durationMinutes} min ·{" "}
                        {service.price === 0 ? "Free" : `$${service.price}`}
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
          <Button onClick={handleSavePending} disabled={!pending.length}>
            {pending.length
              ? `Add ${pending.length} service${pending.length === 1 ? "" : "s"}`
              : "Add services"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadServicesDialog;
