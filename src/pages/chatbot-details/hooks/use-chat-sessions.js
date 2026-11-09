import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useChatSessionDetailsQuery,
  useCreateChatSessionMutation,
  useDeleteChatSessionMutation,
  useListChatSessionsQuery,
  useSendChatMessageMutation,
} from "@/features/chat/chatApiSlice";
import { useChatSocket } from "@/features/chat/useChatSocket";
import { useLiveVoice } from "@/features/chat/useLiveVoice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

const LOCAL_WELCOME_ID = "local-welcome";
let localCounter = 0;

// Ephemeral, client-only messages (the welcome greeting) never hit the API —
// they get throwaway ids so they survive the history merge.
const buildLocalMessage = (role, content) => {
  localCounter += 1;

  return {
    id: `local-${Date.now()}-${localCounter}`,
    senderType: role === "bot" ? "agent" : "user",
    role,
    content,
    attachments: [],
    time: new Date().toISOString(),
  };
};

// Server history first, live/appended messages after, deduped by id. The
// local welcome greeting (when present) always leads the timeline.
const mergeMessages = (history = [], local = []) => {
  const seen = new Set(history.map((message) => message.id).filter(Boolean));
  const unseen = local.filter(
    (message) => !message.id || !seen.has(message.id),
  );
  const welcome = unseen.find((message) => message.id === LOCAL_WELCOME_ID);
  const rest = unseen.filter((message) => message.id !== LOCAL_WELCOME_ID);

  return [...(welcome ? [welcome] : []), ...history, ...rest];
};

/**
 * Owns the chat conversation state: the session list (REST), the active
 * session's timeline (REST history + live socket events), outbound messages
 * (REST send), and live voice calls over the session's live socket.
 */
const useChatSessions = (chatbot) => {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [localMessages, setLocalMessages] = useState({});
  const [typingSessionId, setTypingSessionId] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [captions, setCaptions] = useState({ user: null, agent: null });

  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    refetch: refetchSessions,
  } = useListChatSessionsQuery({ page: 1, page_size: 100 });

  const [createSession] = useCreateChatSessionMutation();
  const [deleteSessionMutation] = useDeleteChatSessionMutation();
  const [sendChatMessage] = useSendChatMessageMutation();

  const sessionDetails = useChatSessionDetailsQuery(activeSessionId, {
    skip: !activeSessionId,
  });

  const chatbotSlug = chatbot?.slug;

  const sessions = useMemo(
    () =>
      (sessionsData?.sessions ?? []).filter(
        (session) => !chatbotSlug || session.chatbotSlug === chatbotSlug,
      ),
    [sessionsData, chatbotSlug],
  );

  const appendLocal = useCallback((sessionId, message) => {
    setLocalMessages((current) => {
      const existing = current[sessionId] ?? [];

      if (message.id && existing.some((item) => item.id === message.id)) {
        return current;
      }

      return { ...current, [sessionId]: [...existing, message] };
    });
  }, []);

  // `chat.message.created` fires for every new message on both the text and
  // live sockets — agent replies, voice finals and messages sent from other
  // tabs alike. appendLocal dedupes by id, and voice captions for that
  // channel drop as soon as the persisted message lands.
  const handleIncomingMessage = useCallback(
    (sessionId, message) => {
      appendLocal(sessionId, message);

      if (message.role === "bot") {
        setTypingSessionId((current) =>
          current === sessionId ? null : current,
        );
      }

      const channel = message.senderType;
      if (channel === "user" || channel === "agent") {
        setCaptions((current) =>
          current[channel] ? { ...current, [channel]: null } : current,
        );
      }
    },
    [appendLocal],
  );

  useChatSocket({
    sessionId: activeSessionId,
    onMessage: handleIncomingMessage,
  });

  const handleVoiceTranscript = useCallback((channel, text, partial) => {
    if (channel !== "user" && channel !== "agent") return;

    setCaptions((current) => ({ ...current, [channel]: { text, partial } }));
  }, []);

  const handleVoiceEnded = useCallback(() => {
    setCaptions({ user: null, agent: null });
  }, []);

  const voice = useLiveVoice({
    onMessage: handleIncomingMessage,
    onTranscript: handleVoiceTranscript,
    onError: (message) => toast.error(message),
    onEnded: handleVoiceEnded,
  });

  const voiceActive = voice.status !== "idle";

  const activeSession = useMemo(() => {
    if (!activeSessionId) return null;

    const messages = mergeMessages(
      sessionDetails.data?.messages,
      localMessages[activeSessionId],
    );

    // During a voice call, live captions ride at the end of the timeline so
    // the user sees what they're saying and what the agent replies. When the
    // final transcript lands as chat.message.created, the caption is dropped
    // (see handleVoiceMessage) and the persisted message takes its place.
    if (voiceActive) {
      const captionBubbles = [];

      if (captions.user?.text) {
        captionBubbles.push({
          id: "caption-user",
          role: "user",
          senderType: "user",
          content: captions.user.text,
          attachments: [],
          time: null,
          partial: captions.user.partial,
        });
      }
      if (captions.agent?.text) {
        captionBubbles.push({
          id: "caption-agent",
          role: "bot",
          senderType: "agent",
          content: captions.agent.text,
          attachments: [],
          time: null,
          partial: captions.agent.partial,
        });
      }

      return {
        id: activeSessionId,
        messages: [...messages, ...captionBubbles],
      };
    }

    return { id: activeSessionId, messages };
  }, [
    activeSessionId,
    sessionDetails.data,
    localMessages,
    voiceActive,
    captions,
  ]);

  const typing = Boolean(activeSessionId) && typingSessionId === activeSessionId;

  const selectSession = useCallback((sessionId) => {
    setActiveSessionId(sessionId);
  }, []);

  const startNewSession = useCallback(() => {
    setActiveSessionId(null);
    setTypingSessionId(null);
  }, []);

  // Shared by text and voice: guarantees an active session, creating one
  // (and seeding the greeting) when the user starts from the welcome screen.
  const ensureSession = useCallback(async () => {
    if (activeSessionId) return activeSessionId;
    if (!chatbot?.slug) return null;

    setIsStarting(true);

    try {
      const session = await createSession({ chatbot: chatbot.slug }).unwrap();

      setActiveSessionId(session.id);

      if (chatbot.welcomeMessage) {
        appendLocal(session.id, {
          ...buildLocalMessage("bot", chatbot.welcomeMessage),
          id: LOCAL_WELCOME_ID,
        });
      }

      return session.id;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't start the conversation"));
      return null;
    } finally {
      setIsStarting(false);
    }
  }, [activeSessionId, appendLocal, chatbot, createSession]);

  const sendMessage = useCallback(
    async (content) => {
      const trimmed = (content ?? "").trim();
      if (!trimmed) return;

      const sessionId = await ensureSession();
      if (!sessionId) return;

      try {
        const sent = await sendChatMessage({
          session: sessionId,
          content: trimmed,
        }).unwrap();

        appendLocal(sessionId, sent);
        setTypingSessionId(sessionId);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to send message"));
      }
    },
    [appendLocal, ensureSession, sendChatMessage],
  );

  const startVoice = useCallback(async () => {
    if (voice.status !== "idle") return;

    const sessionId = await ensureSession();
    if (!sessionId) return;

    try {
      await voice.start(sessionId);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Couldn't start the voice session"),
      );
    }
  }, [ensureSession, voice]);

  const deleteSession = useCallback(
    async (sessionId) => {
      try {
        await deleteSessionMutation(sessionId).unwrap();

        setLocalMessages((current) => {
          const next = { ...current };
          delete next[sessionId];
          return next;
        });
        setTypingSessionId((current) =>
          current === sessionId ? null : current,
        );
        setActiveSessionId((current) =>
          current === sessionId ? null : current,
        );
        toast.success("Conversation deleted");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to delete conversation"));
      }
    },
    [deleteSessionMutation],
  );

  const isSessionLoading =
    Boolean(activeSessionId) &&
    sessionDetails.isLoading &&
    !(localMessages[activeSessionId]?.length > 0);

  return {
    sessions,
    isLoadingSessions,
    isSessionsError,
    refetchSessions,
    activeSession,
    activeSessionId,
    selectSession,
    typing,
    isStarting,
    isSessionLoading,
    sendMessage,
    startVoice,
    voice: {
      status: voice.status,
      speaking: voice.speaking,
      captions,
      interrupt: voice.interrupt,
      stop: voice.stop,
    },
    startNewSession,
    deleteSession,
  };
};

export default useChatSessions;
