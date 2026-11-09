import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bot, MessageSquare, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layouts/header";
import { ScrollContainer } from "@/components/ui/section";
import TabMenu from "@/components/ui/tab";
import { useChatbotDetailsQuery } from "@/features/chatbot/chatbotApiSlice";
import { useNotifications } from "@/features/notifications/useNotifications";
import useTitle from "@/hooks/useTitle";
import useUrlTab from "@/hooks/useUrlTab";
import { cn } from "@/lib/utils";
import ChatPanel from "./components/chat-panel";
import ChatbotInfoHeader from "./components/chatbot-info-header";
import ConfigForm from "./components/config-form";
import KnowledgePanel from "./components/knowledge-panel";
import SessionList from "./components/session-list";
import useChatSessions from "./hooks/use-chat-sessions";

const DETAIL_TABS = [
  { value: "chat", label: "Chat Session", icon: MessageSquare },
  { value: "config", label: "Configuration", icon: Settings2 },
  { value: "training", label: "Training", icon: Sparkles },
];

const ChatbotDetailsPage = () => {
  const { chatbotSlug } = useParams();
  const { data: chatbot, isLoading, isError } =
    useChatbotDetailsQuery(chatbotSlug);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useUrlTab({
    tabs: DETAIL_TABS,
    defaultTab: "chat",
  });

  // Training finishes asynchronously — keep knowledge queries fresh from
  // training_complete notifications.
  useNotifications();

  const chat = useChatSessions(chatbot);

  useTitle(chatbot ? chatbot.name : "Chatbot");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">Loading chatbot…</p>
      </div>
    );
  }

  if (isError || !chatbot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <span className="center size-14 rounded-2xl bg-primary/10 text-primary">
          <Bot size={26} />
        </span>
        <h1 className="mt-4 text-lg font-bold text-foreground">
          Chatbot not found
        </h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          “{chatbotSlug}” doesn't exist in this workspace — it may have been
          removed.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to chatbots</Link>
        </Button>
      </div>
    );
  }

  const handleSelectSession = (sessionId) => {
    chat.selectSession(sessionId);
    setMobileChatOpen(true);
  };

  const handleNewSession = () => {
    chat.startNewSession();
    setMobileChatOpen(true);
  };

  const handleBack = () => setMobileChatOpen(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <section className="flex min-h-0 flex-1 container">
        <aside
          className={cn(
            "min-h-0 w-full flex-col border-border lg:flex lg:w-[400px] lg:shrink-0 lg:border-r xl:w-[440px]",
            mobileChatOpen ? "hidden" : "flex",
          )}
        >
          <ChatbotInfoHeader chatbot={chatbot} />

          <TabMenu
            tabs={DETAIL_TABS}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            compact
            className="px-4"
          />

          {activeTab === "chat" && (
            <SessionList
              sessions={chat.sessions}
              activeSessionId={chat.activeSessionId}
              isLoading={chat.isLoadingSessions}
              isSessionsError={chat.isSessionsError}
              onRetry={chat.refetchSessions}
              onSelect={handleSelectSession}
              onNewSession={handleNewSession}
              onDelete={chat.deleteSession}
            />
          )}

          {activeTab === "config" && (
            <ScrollContainer className="px-4 py-5">
              <ConfigForm key={chatbot.slug} chatbot={chatbot} />
            </ScrollContainer>
          )}

          {activeTab === "training" && (
            <ScrollContainer className="px-4 py-5">
              <KnowledgePanel chatbot={chatbot} />
            </ScrollContainer>
          )}
        </aside>

        <main
          className={cn(
            "min-h-0 flex-1",
            mobileChatOpen ? "flex" : "hidden lg:flex",
          )}
        >
          <ChatPanel
            key={chat.activeSessionId ?? "welcome"}
            chatbot={chatbot}
            session={chat.activeSession}
            typing={chat.typing}
            loading={chat.isSessionLoading}
            starting={chat.isStarting}
            voice={chat.voice}
            onSend={chat.sendMessage}
            onVoiceStart={chat.startVoice}
            onNewSession={handleNewSession}
            onBack={handleBack}
          />
        </main>
      </section>
    </div>
  );
};

export default ChatbotDetailsPage;
