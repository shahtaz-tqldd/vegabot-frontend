import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";
import ChatbotTile from "../chatbot-tile";

const formatTime = (date) =>
  new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(
    date,
  );

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
              className={cn(
                "flx gap-2.5",
                isUser && "flex-row-reverse",
              )}
            >
              {isUser ? (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-white">
                  You
                </span>
              ) : (
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
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  )}
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
