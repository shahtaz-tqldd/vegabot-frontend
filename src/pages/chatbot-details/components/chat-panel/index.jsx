import { ArrowLeft, Loader2, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ChatbotTile from "../chatbot-tile";
import Composer from "./composer";
import MessageList from "./message-list";
import ChatbotProfile from "@/components/shared/chatbot";

const SUGGESTED_PROMPTS = [
  "What can you help me with?",
  "Tell me about your products",
  "How much does it cost?",
];

const WelcomeScreen = ({ chatbot, onSend, voice, starting = false }) => (
  <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-8">
    <div className="w-full max-w-xl">
      <div className="flex flex-col items-center text-center">
        <ChatbotProfile />
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
            disabled={starting}
            onClick={() => onSend(prompt)}
            className="flx gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-50"
          >
            <Sparkles size={12} />
            {prompt}
          </button>
        ))}
      </div>

      <Composer
        onSend={onSend}
        voice={voice}
        className="mt-6"
        placeholder="Type your message…"
        disabled={starting}
      />
    </div>
  </div>
);

const ChatPanel = ({
  chatbot,
  session,
  typing,
  replying = false,
  loading = false,
  starting = false,
  voice,
  onSend,
  onNewSession,
  onBack,
}) => {
  const voiceOn = voice && voice.status !== "off";

  // No session selected — greet the user and start a conversation from here.
  if (!session) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <WelcomeScreen
          chatbot={chatbot}
          onSend={onSend}
          voice={voice}
          starting={starting}
        />
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
          <ChatbotProfile size="6"/>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {chatbot.name}
            </p>
            <p className="flx gap-1.5 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-block size-1.5 rounded-full",
                  voiceOn ? "bg-primary" : "bg-emerald-500",
                )}
              />
              {voiceOn
                ? voice.status === "starting"
                  ? "Starting voice…"
                  : voice.muted
                    ? "Voice on — mic muted"
                    : "Voice on"
                : replying
                  ? "Typing…"
                  : "Online — replies instantly"}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New session"
          onClick={onNewSession}
        >
          <Plus size={16} />
        </Button>
      </header>

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={15} className="animate-spin" />
            Loading conversation…
          </p>
        </div>
      ) : (
        <>
          <MessageList
            chatbot={chatbot}
            messages={session.messages}
            typing={typing}
          />
          <Composer
            onSend={onSend}
            voice={voice}
            disabled={loading}
            sendDisabled={replying}
          />
        </>
      )}
    </div>
  );
};

export default ChatPanel;
