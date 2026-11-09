import { useRef, useState } from "react";
import {
  BookOpen,
  FileUp,
  Link2,
  TextQuote,
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
import { cn } from "@/lib/utils";
import {
  useUploadKnowledgeFileMutation,
  useUploadKnowledgeTextMutation,
  useUploadKnowledgeUrlMutation,
} from "@/features/knowledge/knowledgeApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

const MODAL_TABS = [
  { value: "urls", label: "URLs", icon: Link2 },
  { value: "text", label: "Text", icon: TextQuote },
  { value: "files", label: "Files", icon: FileUp },
];

const countSettled = (results) => {
  const succeeded = results.filter(
    (result) => result.status === "fulfilled",
  ).length;

  return { succeeded, failed: results.length - succeeded };
};

const UrlsTab = ({ chatbotSlug, onDone }) => {
  const [value, setValue] = useState("");
  const [uploadUrl, { isLoading }] = useUploadKnowledgeUrlMutation();

  const urls = value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const handleAdd = async () => {
    const valid = urls.filter((url) => /^https?:\/\/.+\..+/.test(url));
    const invalid = urls.length - valid.length;

    if (!valid.length) {
      toast.error("Enter at least one valid URL (https://…)");
      return;
    }

    const results = await Promise.allSettled(
      valid.map((url) =>
        uploadUrl({ chatbot: chatbotSlug, url }).unwrap(),
      ),
    );
    const { succeeded, failed } = countSettled(results);

    if (succeeded) {
      toast.success(`${succeeded} URL${succeeded === 1 ? "" : "s"} added`, {
        description: "Pages will be scraped and trained into the base.",
      });
    }
    if (failed) {
      toast.error(`${failed} URL${failed === 1 ? "" : "s"} failed to upload`);
    }
    if (invalid) {
      toast.warning(
        `${invalid} entr${invalid === 1 ? "y" : "ies"} skipped — must start with http(s)://`,
      );
    }

    if (succeeded) onDone();
  };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <Textarea
        rows={6}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={"https://example.com\nhttps://example.com/pricing"}
        className="rounded-xl"
      />
      <p className="text-xs text-muted-foreground">
        One URL per line — pages are scraped, chunked and trained into the base
        knowledge.
      </p>
      <Button
        onClick={handleAdd}
        disabled={!urls.length || isLoading}
        className="ml-auto rounded-xl"
      >
        <Link2 size={15} />
        {isLoading
          ? "Adding…"
          : `Add ${urls.length ? `${urls.length} URL${urls.length === 1 ? "" : "s"}` : "URLs"}`}
      </Button>
    </div>
  );
};

// Text sources are immutable once created — replace by deleting and
// re-adding.
const TextTab = ({ chatbotSlug, onDone }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploadText, { isLoading }] = useUploadKnowledgeTextMutation();

  const handleSubmit = async () => {
    const trimmed = content.trim();

    if (trimmed.length < 10) {
      toast.error("Add at least a few sentences of content");
      return;
    }

    try {
      await uploadText({
        chatbot: chatbotSlug,
        content: trimmed,
        ...(title.trim() ? { title: title.trim() } : {}),
      }).unwrap();

      toast.success("Text added", {
        description: "Training started — it becomes usable once trained.",
      });
      onDone();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save text source"));
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Title (optional)"
        className="rounded-xl"
      />
      <Textarea
        rows={7}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Paste the knowledge the bot should answer from…"
        className="rounded-xl"
      />
      <p className="text-xs text-muted-foreground">
        Policies, FAQs, notes — up to 200,000 characters, chunked and trained
        into the knowledge base.
      </p>
      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="ml-auto rounded-xl"
      >
        {isLoading ? "Saving…" : "Add text"}
      </Button>
    </div>
  );
};

const FilesTab = ({ chatbotSlug, onDone }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, { isLoading }] = useUploadKnowledgeFileMutation();

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;

    const results = await Promise.allSettled(
      files.map((file) =>
        uploadFile({ chatbot: chatbotSlug, file }).unwrap(),
      ),
    );
    const { succeeded, failed } = countSettled(results);

    if (succeeded) {
      toast.success(`${succeeded} file${succeeded === 1 ? "" : "s"} uploading`, {
        description: "They'll be trained into the base knowledge shortly.",
      });
    }
    if (failed) {
      toast.error(`${failed} file${failed === 1 ? "" : "s"} failed to upload`);
    }

    if (succeeded) onDone();
  };

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <button
        type="button"
        disabled={isLoading}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5",
        )}
      >
        <span className="center size-11 rounded-2xl bg-primary/10 text-primary">
          <BookOpen size={20} />
        </span>
        <p className="mt-3 text-sm font-semibold text-foreground">
          {isLoading ? "Uploading…" : "Drop files here or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, DOCX, XLSX, CSV, JSON or XML — stored privately and queued for
          training
        </p>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.xlsx,.csv,.json,.xml"
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="mx-auto rounded-xl"
      >
        Browse files
      </Button>
    </div>
  );
};

const UploadKnowledgeDialog = ({ open, setOpen, chatbotSlug }) => {
  const [activeTab, setActiveTab] = useState("urls");

  const closeDialog = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="grid max-h-[min(70vh,32rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload knowledge</DialogTitle>
          <DialogDescription>
            Add URLs, paste text or upload documents — everything trains into
            the base knowledge.
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar min-h-0 space-y-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {MODAL_TABS.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flx justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition",
                    activeTab === tab.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "urls" && (
            <UrlsTab chatbotSlug={chatbotSlug} onDone={closeDialog} />
          )}
          {activeTab === "text" && (
            <TextTab chatbotSlug={chatbotSlug} onDone={closeDialog} />
          )}
          {activeTab === "files" && (
            <FilesTab chatbotSlug={chatbotSlug} onDone={closeDialog} />
          )}
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

export default UploadKnowledgeDialog;
