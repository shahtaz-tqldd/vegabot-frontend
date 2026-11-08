import { useRef, useState } from "react";
import {
  FileSpreadsheet,
  FileUp,
  Info,
  Package,
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
import {
  downloadSpreadsheetTemplate,
  normalizeProductRows,
  parseSpreadsheetRows,
  PRODUCT_TEMPLATE,
} from "@/lib/spreadsheet";
import { addProducts } from "@/mocks/chatbots";
import { cn } from "@/lib/utils";

const UploadProductsDialog = ({ open, setOpen, chatbot, onChange }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const closeDialog = () => setOpen(false);

  const handleDownloadTemplate = () => {
    downloadSpreadsheetTemplate(PRODUCT_TEMPLATE);
    toast.success("Template downloaded", {
      description: "Fill it in and upload it back — products sync instantly.",
    });
  };

  const handleUpload = async (fileList) => {
    const file = Array.from(fileList || [])[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const rows = normalizeProductRows(await parseSpreadsheetRows(file));

      if (!rows.length) {
        toast.error("No products found in the file", {
          description: `Make sure it follows the template columns: ${PRODUCT_TEMPLATE.headers.join(", ")}.`,
        });
        return;
      }

      addProducts(chatbot.slug, rows);
      onChange();
      toast.success(`Imported ${rows.length} product${rows.length === 1 ? "" : "s"}`);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="grid max-h-[min(80vh,36rem)] grid-rows-[auto_minmax(0,1fr)_auto] rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload products</DialogTitle>
          <DialogDescription>
            Teach the bot your catalog — one spreadsheet row per product.
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar min-h-0 space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 px-4 py-3.5">
            <p className="flx gap-2 text-sm font-semibold text-foreground">
              <Info size={15} className="shrink-0 text-primary" />
              How it works
            </p>
            <ol className="list-decimal space-y-1 pl-9 text-xs leading-5 text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
              <li>
                Download the <b>template</b> spreadsheet below.
              </li>
              <li>
                Fill in one row per product — required columns:{" "}
                <b>{PRODUCT_TEMPLATE.headers.join(", ")}</b>.
              </li>
              <li>
                Upload the filled file back — the bot can then answer pricing,
                stock and comparison questions.
              </li>
            </ol>
          </div>

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
              "flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5",
            )}
          >
            <span className="center size-11 rounded-2xl bg-primary/10 text-primary">
              {isImporting ? <FileUp size={20} /> : <Package size={20} />}
            </span>
            <p className="mt-3 text-sm font-semibold text-foreground">
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

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={closeDialog}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadProductsDialog;
