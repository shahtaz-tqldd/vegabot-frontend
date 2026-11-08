import { useEffect, useRef, useState } from "react";
import { getBotReply, getBotReplyDelay } from "@/mocks/chat";

const truncate = (value, max = 48) =>
  value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;

// Owns every chat conversation for a chatbot: the session list, the active
// session, and the simulated replies. The session list (left panel) and the
// chat area (right panel) both render from this state.
const useChatSessions = (chatbot) => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [typingSessionId, setTypingSessionId] = useState(null);
  const nextIdRef = useRef(1);
  const replyTimeoutRef = useRef(null);

  useEffect(
    () => () => window.clearTimeout(replyTimeoutRef.current),
    [],
  );

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? null;

  // Only the session waiting on a reply shows the typing indicator.
  const typing =
    Boolean(activeSessionId) && typingSessionId === activeSessionId;

  const createMessage = (role, content) => {
    nextIdRef.current += 1;

    return {
      id: `msg-${nextIdRef.current}`,
      role,
      content,
      time: new Date(),
    };
  };

  const appendMessage = (sessionId, role, content) => {
    const message = createMessage(role, content);

    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: [...session.messages, message],
              updatedAt: new Date(),
            }
          : session,
      ),
    );
  };

  const sendMessage = (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    let sessionId = activeSessionId;

    if (!sessionId) {
      nextIdRef.current += 1;
      sessionId = `session-${nextIdRef.current}`;

      const messages = chatbot?.welcomeMessage
        ? [
            createMessage("bot", chatbot.welcomeMessage),
            createMessage("user", trimmed),
          ]
        : [createMessage("user", trimmed)];

      setSessions((current) => [
        {
          id: sessionId,
          title: truncate(trimmed),
          createdAt: new Date(),
          updatedAt: new Date(),
          messages,
        },
        ...current,
      ]);
      setActiveSessionId(sessionId);
    } else {
      appendMessage(sessionId, "user", trimmed);
    }

    setTypingSessionId(sessionId);
    replyTimeoutRef.current = window.setTimeout(() => {
      appendMessage(sessionId, "bot", getBotReply(trimmed, chatbot));
      setTypingSessionId(null);
    }, getBotReplyDelay());
  };

  const endVoiceCall = (duration) => {
    if (!activeSessionId) return;

    appendMessage(
      activeSessionId,
      "bot",
      `Voice session ended — **${duration}** total. A transcript was saved to this conversation.`,
    );
  };

  const startNewSession = () => {
    window.clearTimeout(replyTimeoutRef.current);
    setTypingSessionId(null);
    setActiveSessionId(null);
  };

  const deleteSession = (sessionId) => {
    setSessions((current) =>
      current.filter((session) => session.id !== sessionId),
    );

    if (sessionId === activeSessionId) startNewSession();
  };

  return {
    sessions,
    activeSession,
    activeSessionId,
    selectSession: setActiveSessionId,
    typing,
    sendMessage,
    endVoiceCall,
    startNewSession,
    deleteSession,
  };
};

export default useChatSessions;
