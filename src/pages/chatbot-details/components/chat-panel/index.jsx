import { useState } from "react";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Composer from "./composer";
import MessageList from "./message-list";
import ChatbotProfile from "@/components/shared/chatbot";
import { voiceSupported } from "@/features/chat/audio";
import VoiceInvite from "./voice-invite";
import SessionInsights, { SessionInsightsButton } from "./session-insights";

// Conversation starters that match what this bot can actually do — opening
// lines a real visitor would send, not a price question out of nowhere.
const suggestedPrompts = (chatbot) => {
  const prompts = ["What can you help me with?"];

  if (chatbot.productsEnabled) prompts.push("Help me find the right product");
  if (chatbot.servicesEnabled) prompts.push("What services do you offer?");
  if (chatbot.knowledgeEnabled) {
    prompts.push(
      chatbot.businessType
        ? `Tell me more about your ${chatbot.businessType.toLowerCase()} business`
        : "Tell me more about your business",
    );
  }
  if (chatbot.productOrderingEnabled) prompts.push("I'd like to place an order");

  return prompts.slice(0, 4);
};

const WelcomeScreen = ({ chatbot, onSend, voice, starting = false }) => {
  const canTalk = Boolean(voice) && voiceSupported();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-8">
      <div className="m-auto w-full max-w-xl">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-xl font-bold text-foreground">
            Hi, I&apos;m {chatbot.name}
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
            {chatbot.description ||
              `Ask me anything about ${
                chatbot.businessType || "the business"
              } — I'm here to help.`}
          </p>
        </div>

        {canTalk && (
          <>
            <div className="mt-4">
              <VoiceInvite
                chatbotName={chatbot.name}
                voice={voice}
                disabled={starting}
              />
            </div>
            <div className="mt-7 flx gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              <span className="h-px flex-1 bg-border" />
              or type a message
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {suggestedPrompts(chatbot).map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={starting || voice?.status === "starting"}
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
          className="mt-5"
          placeholder="Type your message…"
          disabled={starting}
        />
      </div>
    </div>
  );
};

const ChatPanel = ({
  chatbot,
  session,
  sessionSummary,
  typing,
  replying = false,
  loading = false,
  starting = false,
  voice,
  onSend,
  onBack,
}) => {
  const [showInsights, setShowInsights] = useState(false);
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

        <SessionInsightsButton
          summary={sessionSummary}
          active={showInsights}
          onClick={() => setShowInsights((open) => !open)}
        />
      </header>

      {showInsights ? (
        <SessionInsights
          chatbot={chatbot}
          session={session}
          summary={sessionSummary}
          onBack={() => setShowInsights(false)}
        />
      ) : loading ? (
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
