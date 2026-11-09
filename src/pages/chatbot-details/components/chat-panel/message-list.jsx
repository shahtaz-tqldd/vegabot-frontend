import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import ChatbotTile from "../chatbot-tile";

const prettyFileSize = (bytes = 0) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const isImage = (attachment) =>
  attachment.attachmentType === "image" ||
  String(attachment.mimeType || "").startsWith("image/");

const MessageAttachments = ({ attachments }) => {
  if (!attachments?.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((attachment) =>
        isImage(attachment) && attachment.fileUrl ? (
          <a
            key={attachment.id}
            href={attachment.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-xl border border-border"
          >
            <img
              src={attachment.fileUrl}
              alt={attachment.fileName || "Attachment"}
              className="h-28 w-40 object-cover transition hover:opacity-90"
            />
          </a>
        ) : (
          <a
            key={attachment.id}
            href={attachment.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flx max-w-56 gap-2 rounded-xl border border-border bg-background px-3 py-2 transition hover:border-primary/40"
          >
            <span className="center size-8 shrink-0 rounded-lg bg-primary/10 text-primary">
              <FileText size={14} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-foreground">
                {attachment.fileName || "Attachment"}
              </span>
              {Boolean(attachment.fileSize) && (
                <span className="block text-[10px] text-muted-foreground">
                  {prettyFileSize(attachment.fileSize)}
                </span>
              )}
            </span>
          </a>
        ),
      )}
    </div>
  );
};

const TypingIndicator = ({ chatbot }) => (
  <div className="flx gap-2.5">
    <ChatbotTile chatbot={chatbot} className="size-8 rounded-lg text-[10px]" />
    <div className="flx gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  </div>
);

const MessageList = ({ chatbot, messages, typing }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={cn("flx gap-2.5", isUser && "flex-row-reverse")}
            >
              {isUser ? null : (
                <ChatbotTile
                  chatbot={chatbot}
                  className="size-8 rounded-lg text-[10px]"
                />
              )}

              <div
                className={cn(
                  "max-w-[82%] md:max-w-lg",
                  isUser && "flex flex-col items-end",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-6 [&_li]:mt-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_p+p]:mt-2 [&_p]:leading-6 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4",
                    isUser
                      ? "rounded-tr-sm bg-primary text-white"
                      : "rounded-tl-sm bg-muted text-foreground",
                    // Live voice captions: interim speech renders transient.
                    message.partial && "opacity-75",
                    message.partial && !isUser && "italic",
                  )}
                >
                  {message.content ? (
                    isUser ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    )
                  ) : null}
                  <MessageAttachments attachments={message.attachments} />
                </div>
                <span
                  className={cn(
                    "mt-1 block px-1 text-[10px] text-muted-foreground",
                    isUser ? "text-right" : "text-left",
                  )}
                >
                  {formatTime(message.time)}
                </span>
              </div>
            </div>
          );
        })}

        {typing && <TypingIndicator chatbot={chatbot} />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default MessageList;
