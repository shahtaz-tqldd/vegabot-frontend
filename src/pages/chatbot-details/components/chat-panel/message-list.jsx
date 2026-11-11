import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Mic,
  Package,
  Sparkles,
  Wrench,
} from "lucide-react";

import { ScrollContainer } from "@/components/ui/scrollbar";
import Image from "@/components/ui/image";
import { cn } from "@/lib/utils";
import ChatbotTile from "../chatbot-tile";
import ChatbotProfile from "@/components/shared/chatbot";

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

// Price is shown exactly as sent, with its currency — never recomputed.
const formatPrice = (price, currency) =>
  price === null || price === undefined || price === ""
    ? null
    : [price, currency].filter(Boolean).join(" ");

const RECOMMENDATION_ICONS = {
  product: Package,
  service: Wrench,
};

const RecommendationCard = ({ item }) => {
  const price = formatPrice(item.price, item.currency);
  const tag = item.type === "service" ? item.serviceType : item.category;
  const FallbackIcon = RECOMMENDATION_ICONS[item.type] ?? Sparkles;
  const Wrapper = item.url ? "a" : "div";

  return (
    <Wrapper
      {...(item.url
        ? { href: item.url, target: "_blank", rel: "noreferrer" }
        : {})}
      className={cn(
        "flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition",
        item.url && "hover:border-primary/40 hover:shadow-sm",
      )}
    >
      <Image
        src={item.imageUrl}
        alt={item.name}
        className="h-28 w-full object-cover"
        fallback={
          <div className="center h-28 w-full bg-muted/60">
            <span className="center size-9 rounded-xl bg-primary/10 text-primary">
              <FallbackIcon size={16} />
            </span>
          </div>
        }
      />

      <div className="flex flex-1 flex-col p-3">
        <div className="flbx gap-2">
          <span className="min-w-0 truncate rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            {tag || item.type}
          </span>
          {item.url && (
            <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
          )}
        </div>
        <p className="mt-2 line-clamp-1 text-sm font-semibold text-foreground">
          {item.name}
        </p>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {item.description}
          </p>
        )}
        {price && (
          <p className="mt-auto pt-2 text-sm font-bold text-foreground">
            {price}
          </p>
        )}
      </div>
    </Wrapper>
  );
};

const Recommendations = ({ items, animate = false }) => {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({
    atStart: true,
    atEnd: false,
    overflow: false,
  });

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;

    setEdges({
      atStart: track.scrollLeft <= 4,
      atEnd: track.scrollLeft >= maxScroll - 4,
      overflow: maxScroll > 4,
    });
  }, []);

  // Re-measure when cards stream in and when the panel resizes.
  useEffect(() => {
    updateEdges();

    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);

    return () => observer.disconnect();
  }, [items, updateEdges]);

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.querySelector("[data-recommendation-card]");
    const step = card ? card.offsetWidth + 8 : track.clientWidth * 0.8;

    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  if (!items?.length) return null;

  return (
    <div
      className={cn(
        "relative mt-2 max-w-full",
        animate &&
          "animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none",
      )}
    >
      <div
        ref={trackRef}
        onScroll={updateEdges}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            data-recommendation-card
            className="shrink-0 snap-start"
          >
            <RecommendationCard item={item} />
          </div>
        ))}
      </div>

      {edges.overflow && (
        <>
          {!edges.atStart && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent"
            />
          )}
          {!edges.atEnd && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent"
            />
          )}

          <button
            type="button"
            aria-label="Show previous recommendations"
            onClick={() => scrollByCard(-1)}
            className={cn(
              "center absolute left-0 top-1/2 z-10 size-7 -translate-y-1/2 rounded-full border border-border bg-card text-foreground shadow-md transition",
              edges.atStart
                ? "pointer-events-none opacity-0"
                : "opacity-100 hover:border-primary/40 hover:text-primary",
            )}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Show more recommendations"
            onClick={() => scrollByCard(1)}
            className={cn(
              "center absolute right-0 top-1/2 z-10 size-7 -translate-y-1/2 rounded-full border border-border bg-card text-foreground shadow-md transition",
              edges.atEnd
                ? "pointer-events-none opacity-0"
                : "opacity-100 hover:border-primary/40 hover:text-primary",
            )}
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  );
};

const TypingDots = () => (
  <span className="flx gap-1.5 py-1.5">
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </span>
);

const TypingIndicator = ({ chatbot }) => (
  <div className="flx gap-2.5">
    <ChatbotTile chatbot={chatbot} className="size-8 rounded-lg text-[10px]" />
    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2">
      <TypingDots />
    </div>
  </div>
);

// The user's in-progress utterance: just the transcript as it arrives —
// the live mic wave lives in the composer, not in the bubble.
const ListeningContent = ({ content }) =>
  content ? (
    <span className="whitespace-pre-wrap">{content}</span>
  ) : (
    <span className="text-white/80">Listening…</span>
  );

const MessageList = ({ chatbot, messages, typing }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <ScrollContainer className="px-5 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={cn("flex gap-2.5", isUser && "flex-row-reverse")}
            >
              {isUser ? null : <ChatbotProfile chatbot={chatbot} size="5" />}

              <div
                className={cn(
                  "max-w-[82%] md:max-w-lg",
                  isUser && "flex flex-col items-end",
                )}
                >
                {isUser ? null : <span className="font-semibold text-[10px] pb-1 pl-1 block">{chatbot.name}</span>}
                
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-6 [&_li]:mt-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_p+p]:mt-2 [&_p]:leading-6 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4",
                    isUser
                      ? "rounded-tr-sm bg-primary text-white"
                      : "rounded-tl-sm bg-muted text-foreground",
                    // Live voice captions: interim speech renders transient.
                    message.partial && !message.listening && "opacity-75",
                    message.partial && !isUser && "italic",
                  )}
                >
                  {message.listening ? (
                    <ListeningContent content={message.content} />
                  ) : message.streaming && !message.content ? (
                    <TypingDots />
                  ) : message.content ? (
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
                <Recommendations
                  items={message.recommendations}
                  animate={message.streaming}
                />
                <span
                  className={cn(
                    "mt-1 flx gap-1 px-1 text-[10px] text-muted-foreground",
                    isUser && "justify-end",
                  )}
                >
                  {message.mode === "audio" && (
                    <>
                      <Mic size={10} aria-hidden />
                      <span>Voice</span>
                      {message.time && <span aria-hidden>·</span>}
                    </>
                  )}
                  {formatTime(message.time)}
                </span>
              </div>
            </div>
          );
        })}

        {typing && <TypingIndicator chatbot={chatbot} />}
        <div ref={bottomRef} />
      </div>
    </ScrollContainer>
  );
};

export default MessageList;
