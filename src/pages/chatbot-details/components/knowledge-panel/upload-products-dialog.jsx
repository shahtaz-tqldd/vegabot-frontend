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
  useImportProductsMutation,
  useLazyDownloadProductTemplateQuery,
} from "@/features/knowledge/knowledgeApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { cn } from "@/lib/utils";

const TEMPLATE_COLUMNS = [
  "name",
  "sku",
  "category",
  "description",
  "price",
  "currency",
  "product_url",
];

const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const UploadProductsDialog = ({ open, setOpen, chatbotSlug }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importProducts, { isLoading: isImporting }] =
    useImportProductsMutation();
  const [downloadTemplate, { isFetching: isDownloading }] =
    useLazyDownloadProductTemplateQuery();

  const closeDialog = () => setOpen(false);

  const handleDownloadTemplate = async () => {
    try {
      const { data } = await downloadTemplate();

      if (!data?.blob) return;

      saveBlob(data.blob, data.fileName);
      toast.success("Template downloaded", {
        description: "Fill it in and upload it back — products sync instantly.",
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to download template"));
    }
  };

  const handleUpload = async (fileList) => {
    const file = Array.from(fileList || [])[0];
    if (!file) return;

    try {
      const response = await importProducts({
        chatbot: chatbotSlug,
        file,
      }).unwrap();

      const payload = response?.data ?? {};
      const created = payload.created_count ?? 0;
      const rowErrors = payload.errors ?? [];

      if (created) {
        toast.success(`Imported ${created} product${created === 1 ? "" : "s"}`, {
          description: rowErrors.length
            ? `${rowErrors.length} row${rowErrors.length === 1 ? "" : "s"} skipped — check the file and re-import the rest.`
            : "Queued for training — usable once trained.",
        });
        closeDialog();
      } else {
        toast.error("No products were imported", {
          description:
            rowErrors[0]?.error ??
            rowErrors[0]?.message ??
            `Make sure the file follows the template columns: ${TEMPLATE_COLUMNS.join(", ")}.`,
        });
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error) || "Couldn't read that file",
        {
          description: "Upload the CSV or XLSX template with the same columns.",
        },
      );
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
                Download the <b>template</b> CSV below.
              </li>
              <li>
                Fill in one row per product — columns:{" "}
                <b>{TEMPLATE_COLUMNS.join(", ")}</b>.
              </li>
              <li>
                Upload the filled file back — up to 5,000 rows. Valid rows are
                queued for training; rows with duplicate SKUs or invalid values
                are skipped and reported.
              </li>
            </ol>
          </div>

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
