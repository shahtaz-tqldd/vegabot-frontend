import { useState } from "react";
import { ArrowLeft, AudioLines, MessageSquare, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ChatbotTile from "../chatbot-tile";
import Composer from "./composer";
import MessageList from "./message-list";
import VoiceCall from "./voice-call";

const MODES = [
  { value: "text", label: "Text", icon: MessageSquare },
  { value: "voice", label: "Voice", icon: AudioLines },
];

const SUGGESTED_PROMPTS = [
  "What can you help me with?",
  "Tell me about your products",
  "How much does it cost?",
];

const WelcomeScreen = ({ chatbot, onSend }) => (
  <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-8">
    <div className="w-full max-w-xl">
      <div className="flex flex-col items-center text-center">
        <ChatbotTile chatbot={chatbot} className="size-16 rounded-3xl text-xl" />
        <h2 className="mt-4 text-xl font-bold text-foreground">
          Hi, I&apos;m {chatbot.name}
        </h2>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
          {chatbot.description ||
            `Ask me anything about ${
              chatbot.businessType || "the business"
            } — I'm here to help.`}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSend(prompt)}
            className="flx gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <Sparkles size={12} />
            {prompt}
          </button>
        ))}
      </div>

      <Composer
        onSend={onSend}
        className="mt-6"
        showNote={false}
        placeholder="Type your message…"
      />
    </div>
  </div>
);

const ChatPanel = ({
  chatbot,
  session,
  typing,
  onSend,
  onNewSession,
  onEndVoiceCall,
  onBack,
}) => {
  const [mode, setMode] = useState("text");

  const handleEndCall = (duration) => {
    onEndVoiceCall(duration);
    setMode("text");
  };

  // No session selected — greet the user and start a conversation from here.
  if (!session) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <WelcomeScreen chatbot={chatbot} onSend={onSend} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flbx shrink-0 gap-3 border-b border-border bg-background px-5 py-3">
        <div className="flx min-w-0 gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Back to sessions"
            onClick={onBack}
            className="lg:hidden"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="relative shrink-0">
            <ChatbotTile chatbot={chatbot} className="size-10 rounded-xl text-sm" />
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {chatbot.name}
            </p>
            <p className="flx gap-1.5 text-xs text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              {typing ? "Typing…" : "Online — replies instantly"}
            </p>
          </div>
        </div>

        <div className="flx gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="New session"
            onClick={onNewSession}
          >
            <Plus size={16} />
          </Button>

          <div className="flex rounded-full border border-border bg-card p-1">
            {MODES.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  aria-pressed={mode === item.value}
                  className={cn(
                    "flx gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition md:px-4",
                    mode === item.value
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {mode === "text" ? (
        <>
          <MessageList
            chatbot={chatbot}
            messages={session.messages}
            typing={typing}
          />
          <Composer onSend={onSend} disabled={typing} />
        </>
      ) : (
        <VoiceCall chatbot={chatbot} onEnd={handleEndCall} />
      )}
    </div>
  );
};

export default ChatPanel;
