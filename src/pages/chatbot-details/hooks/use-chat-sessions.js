import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import { apiSlice } from "@/features/api/apiSlice";
import {
  useChatSessionDetailsQuery,
  useCreateChatSessionMutation,
  useDeleteChatSessionMutation,
  useListChatSessionsQuery,
} from "@/features/chat/chatApiSlice";
import {
  normalizeMessage,
  normalizeRecommendation,
} from "@/features/chat/chat.helpers";
import { useChatConnection } from "@/features/chat/useChatConnection";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

const LOCAL_WELCOME_ID = "local-welcome";
let localCounter = 0;
let orderCounter = 0;

// Client-side ordering for live messages. Socket events don't always arrive
// in conversation order (a voice transcript can finalize after the reply
// started streaming), so each live item is stamped with when it *began* —
// the user starting to talk, a reply starting — and the tail is sorted by it.
const nextOrder = () => {
  orderCounter += 1;
  return orderCounter;
};

const nextLocalId = (prefix) => {
  localCounter += 1;
  return `${prefix}-${Date.now()}-${localCounter}`;
};

const buildLocalMessage = (role, content, extra = {}) => ({
  id: nextLocalId("local"),
  senderType: role === "bot" ? "agent" : "user",
  role,
  mode: "text",
  content,
  attachments: [],
  recommendations: [],
  time: new Date().toISOString(),
  order: nextOrder(),
  ...extra,
});

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

// Server history first, then live messages. Messages are keyed by id: a live
// copy replaces the history copy in place (the newest version wins), unseen
// ones follow in live order. The local welcome greeting always leads.
const mergeMessages = (history = [], local = []) => {
  const byId = new Map(local.map((message) => [message.id, message]));
  const merged = history.map((message) => {
    const live = byId.get(message.id);
    if (!live) return message;
    byId.delete(message.id);
    return { ...message, ...live };
  });
  const rest = local.filter((message) => byId.has(message.id));
  const welcome = rest.find((message) => message.id === LOCAL_WELCOME_ID);

  return [
    ...(welcome ? [welcome] : []),
    ...merged,
    ...rest.filter((message) => message.id !== LOCAL_WELCOME_ID).sort(byOrder),
  ];
};

// Insert or replace by id; `replaceId` swaps a placeholder (optimistic bubble)
// for its stored message. An explicit `order` wins; otherwise a replaced
// message keeps its slot and a new one goes last.
const upsertInto = (list = [], message, replaceId) => {
  let index = list.findIndex((item) => item.id === message.id);
  if (index === -1 && replaceId) {
    index = list.findIndex((item) => item.id === replaceId);
  }
  if (index === -1) {
    return [...list, { ...message, order: message.order ?? nextOrder() }];
  }

  const next = [...list];
  const existing = list[index];
  next[index] = {
    ...existing,
    ...message,
    order: message.order ?? existing.order,
    // Cards can arrive separately from the message (live event vs. stored
    // copy) — never let an empty list wipe cards already shown.
    recommendations: message.recommendations?.length
      ? message.recommendations
      : (existing.recommendations ?? []),
  };
  return replaceId && next[index].id !== replaceId
    ? next.filter((item) => item.id !== replaceId)
    : next;
};

/**
 * Owns the chat conversation state: the session list (REST), the active
 * session's timeline (REST history + socket events), and the one chat
 * socket that carries both typed messages and voice.
 */
const useChatSessions = (chatbot) => {
  const dispatch = useDispatch();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [localMessages, setLocalMessages] = useState({});
  const [isStarting, setIsStarting] = useState(false);
  // Replies streaming in, keyed by turn_id: { content, seq, recommendations }.
  const [turns, setTurns] = useState({});
  // Live caption of what the user is saying (voice mode).
  const [caption, setCaption] = useState(null);
  // Timeline slot of the utterance the mic is hearing right now (voice mode).
  const [talkOrder, setTalkOrder] = useState(null);
  // A typed message is waiting for agent.response.started.
  const [awaitingReply, setAwaitingReply] = useState(false);

  // Optimistic user bubbles waiting for message.accepted, oldest first.
  const pendingSendsRef = useRef([]);
  // Timeline slots: when the user last started talking, the slot of the
  // utterance being captioned, and each streaming reply's slot by turn_id.
  const talkStartOrderRef = useRef(0);
  const usedTalkOrderRef = useRef(0);
  const captionOrderRef = useRef(null);
  const turnOrdersRef = useRef({});
  // Cards per turn_id (to carry onto the stored message), and the stored
  // message id of each completed turn (for cards that arrive late).
  const turnRecsRef = useRef({});
  const turnMessageIdsRef = useRef({});
  const sessionIdRef = useRef(null);

  useEffect(() => {
    sessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isError: isSessionsError,
    refetch: refetchSessions,
  } = useListChatSessionsQuery({ page: 1, page_size: 100 });

  const [createSession] = useCreateChatSessionMutation();
  const [deleteSessionMutation] = useDeleteChatSessionMutation();

  const sessionDetails = useChatSessionDetailsQuery(activeSessionId, {
    skip: !activeSessionId,
  });
  const refetchDetails = sessionDetails.refetch;

  const chatbotSlug = chatbot?.slug;

  const sessions = useMemo(
    () =>
      (sessionsData?.sessions ?? []).filter(
        (session) => !chatbotSlug || session.chatbotSlug === chatbotSlug,
      ),
    [sessionsData, chatbotSlug],
  );

  const upsertLocal = useCallback((sessionId, message, replaceId) => {
    if (!sessionId) return;
    setLocalMessages((current) => ({
      ...current,
      [sessionId]: upsertInto(current[sessionId], message, replaceId),
    }));
  }, []);

  const removeLocal = useCallback((sessionId, id) => {
    setLocalMessages((current) => ({
      ...current,
      [sessionId]: (current[sessionId] ?? []).filter((item) => item.id !== id),
    }));
  }, []);

  const resetLiveState = useCallback(() => {
    setTurns({});
    setCaption(null);
    setAwaitingReply(false);
    pendingSendsRef.current = [];
    captionOrderRef.current = null;
    turnOrdersRef.current = {};
    turnRecsRef.current = {};
    turnMessageIdsRef.current = {};
    setTalkOrder(null);
  }, []);

  // The utterance being transcribed sits where the user started talking —
  // before any reply that began streaming after that.
  const claimCaptionOrder = useCallback(() => {
    if (captionOrderRef.current === null) {
      const talkStart = talkStartOrderRef.current;
      captionOrderRef.current =
        talkStart > usedTalkOrderRef.current ? talkStart : nextOrder();
      usedTalkOrderRef.current = captionOrderRef.current;
    }
    return captionOrderRef.current;
  }, []);

  const handleEvent = useCallback(
    (event) => {
      const sessionId = sessionIdRef.current;
      const data = event.data ?? {};

      switch (event.type) {
        case "connection.reconnected":
          // Socket events are not replayed: reload history, drop stale turns.
          resetLiveState();
          refetchDetails?.();
          break;

        case "message.accepted": {
          const pendingId = pendingSendsRef.current.shift();
          if (pendingId && event.message_id) {
            upsertLocal(
              sessionId,
              { id: event.message_id, mode: event.mode ?? "text" },
              pendingId,
            );
          }
          break;
        }

        case "voice.transcript": {
          const order = claimCaptionOrder();

          if (data.partial) {
            setCaption((current) => ({
              text: `${current?.text ?? ""}${data.text ?? ""}`,
              order,
            }));
          } else {
            setCaption(null);
            captionOrderRef.current = null;
            if (data.message_id && data.text) {
              upsertLocal(
                sessionId,
                buildLocalMessage("user", data.text, {
                  id: data.message_id,
                  mode: "audio",
                  order,
                }),
              );
            }
          }
          break;
        }

        case "agent.response.started": {
          const order = nextOrder();
          turnOrdersRef.current[data.turn_id] = order;
          setAwaitingReply(false);
          setTurns((current) => ({
            ...current,
            [data.turn_id]: {
              order,
              content: "",
              seq: 0,
              mode: data.mode ?? "text",
              recommendations: [],
              startedAt: new Date().toISOString(),
            },
          }));
          break;
        }

        case "agent.response.delta":
          setTurns((current) => {
            const turn = current[data.turn_id];
            if (!turn || data.sequence !== turn.seq + 1) return current;
            return {
              ...current,
              [data.turn_id]: {
                ...turn,
                content: turn.content + (data.delta ?? ""),
                seq: turn.seq + 1,
              },
            };
          });
          break;

        // Sent once the reply text is complete — voice audio may still be
        // playing — so the cards show under the reply while it streams.
        case "agent.response.recommendations": {
          const items = (data.items ?? []).map(normalizeRecommendation);
          if (!items.length) break;

          turnRecsRef.current[data.turn_id] = items;

          // The turn already completed: attach to its stored message.
          const storedId = turnMessageIdsRef.current[data.turn_id];
          if (storedId) {
            upsertLocal(sessionId, { id: storedId, recommendations: items });
            break;
          }

          setTurns((current) => {
            const turn = current[data.turn_id];
            if (!turn) return current;
            return {
              ...current,
              [data.turn_id]: { ...turn, recommendations: items },
            };
          });
          break;
        }

        case "agent.response.completed": {
          const order = turnOrdersRef.current[data.turn_id];
          const liveRecs = turnRecsRef.current[data.turn_id];
          delete turnOrdersRef.current[data.turn_id];
          delete turnRecsRef.current[data.turn_id];
          if (data.message) {
            const message = normalizeMessage(data.message);
            turnMessageIdsRef.current[data.turn_id] = message.id;
            upsertLocal(sessionId, {
              ...message,
              recommendations: message.recommendations.length
                ? message.recommendations
                : (liveRecs ?? []),
              ...(order ? { order } : {}),
            });
          }
          setTurns((current) => {
            const next = { ...current };
            delete next[data.turn_id];
            return next;
          });
          dispatch(
            apiSlice.util.invalidateTags([
              { type: "chat-sessions", id: "LIST" },
            ]),
          );
          break;
        }

        case "agent.response.failed":
          delete turnOrdersRef.current[data.turn_id];
          delete turnRecsRef.current[data.turn_id];
          setAwaitingReply(false);
          setTurns((current) => {
            const next = { ...current };
            delete next[data.turn_id];
            return next;
          });
          toast.error(
            data.message ||
              "The assistant could not answer right now. Please try again.",
          );
          break;

        case "chat.message.created": {
          const message = normalizeMessage(event.message ?? {});
          const targetId = event.session_id ?? sessionId;
          if (message.id) upsertLocal(targetId, message);
          break;
        }

        case "error": {
          // A rejected message.send was never stored: drop its bubble.
          const isVoiceError =
            event.code === "voice_unavailable" ||
            event.code === "voice_failed";
          if (!isVoiceError && pendingSendsRef.current.length) {
            const pendingId = pendingSendsRef.current.shift();
            removeLocal(sessionId, pendingId);
            setAwaitingReply(false);
          }

          if (event.code === "voice_failed") {
            toast.error("Voice ended unexpectedly — you can keep typing.");
          } else if (event.code === "busy") {
            toast.error(
              event.message ||
                "The assistant is still replying — try again in a moment.",
            );
          } else {
            toast.error(event.message || "Something went wrong");
          }
          break;
        }

        default:
          break;
      }
    },
    [
      claimCaptionOrder,
      dispatch,
      refetchDetails,
      removeLocal,
      resetLiveState,
      upsertLocal,
    ],
  );

  const handleTalkingChange = useCallback((talking) => {
    if (!talking) {
      setTalkOrder(null);
      return;
    }
    const order = nextOrder();
    talkStartOrderRef.current = order;
    setTalkOrder(order);
  }, []);

  const connection = useChatConnection({
    sessionId: activeSessionId,
    onEvent: handleEvent,
    onError: (message) => toast.error(message),
    onTalkingChange: handleTalkingChange,
  });

  const activeSession = useMemo(() => {
    if (!activeSessionId) return null;

    // Streaming replies and the live caption are placed in the timeline by
    // when they began, until their stored messages land.
    const live = Object.entries(turns).map(([turnId, turn]) => ({
      id: `turn-${turnId}`,
      role: "bot",
      senderType: "agent",
      mode: turn.mode,
      content: turn.content,
      attachments: [],
      recommendations: turn.recommendations,
      time: turn.startedAt,
      order: turn.order,
      streaming: true,
    }));

    // What the user is saying: the transcript as it arrives, or — before the
    // first words are transcribed — an empty "hearing you" bubble. (Skipped
    // while the agent talks so speaker bleed can't flash a ghost bubble.)
    if (caption?.text) {
      live.push({
        id: "voice-caption",
        role: "user",
        senderType: "user",
        mode: "audio",
        content: caption.text,
        attachments: [],
        recommendations: [],
        time: null,
        order: caption.order,
        partial: true,
        listening: true,
      });
    } else if (talkOrder !== null && !connection.speaking) {
      live.push({
        id: "voice-listening",
        role: "user",
        senderType: "user",
        mode: "audio",
        content: "",
        attachments: [],
        recommendations: [],
        time: null,
        order: talkOrder,
        partial: true,
        listening: true,
      });
    }

    const messages = mergeMessages(sessionDetails.data?.messages, [
      ...(localMessages[activeSessionId] ?? []),
      ...live,
    ]);

    return { id: activeSessionId, messages };
  }, [
    activeSessionId,
    sessionDetails.data,
    localMessages,
    turns,
    caption,
    talkOrder,
    connection.speaking,
  ]);

  const replying = awaitingReply || Object.keys(turns).length > 0;

  const selectSession = useCallback(
    (sessionId) => {
      resetLiveState();
      setActiveSessionId(sessionId);
    },
    [resetLiveState],
  );

  const startNewSession = useCallback(() => {
    resetLiveState();
    setActiveSessionId(null);
  }, [resetLiveState]);

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
        upsertLocal(session.id, {
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
  }, [activeSessionId, chatbot, createSession, upsertLocal]);

  // Typed messages go over the socket in either mode: answered in text when
  // voice is off, spoken (with a transcript) when voice is on.
  const sendMessage = useCallback(
    async (content) => {
      const trimmed = (content ?? "").trim();
      if (!trimmed || replying) return;

      const sessionId = await ensureSession();
      if (!sessionId) return;

      const optimistic = buildLocalMessage("user", trimmed, {
        id: nextLocalId("pending"),
        mode: connection.voiceStatus === "off" ? "text" : "audio",
      });

      pendingSendsRef.current.push(optimistic.id);
      upsertLocal(sessionId, optimistic);
      setAwaitingReply(true);
      connection.send(trimmed);
    },
    [connection, ensureSession, replying, upsertLocal],
  );

  // Voice on/off. Turning voice on must start inside the click handler so
  // audio playback is allowed; the session is created afterwards if needed.
  const toggleVoice = useCallback(async () => {
    if (connection.voiceStatus !== "off") {
      connection.disableVoice();
      return;
    }

    const enabling = connection.enableVoice();
    const sessionId = await ensureSession();

    if (!sessionId) {
      connection.disableVoice();
      return;
    }

    await enabling;
  }, [connection, ensureSession]);

  const deleteSession = useCallback(
    async (sessionId) => {
      try {
        await deleteSessionMutation(sessionId).unwrap();

        setLocalMessages((current) => {
          const next = { ...current };
          delete next[sessionId];
          return next;
        });
        setActiveSessionId((current) => {
          if (current !== sessionId) return current;
          resetLiveState();
          return null;
        });
        toast.success("Conversation deleted");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to delete conversation"));
      }
    },
    [deleteSessionMutation, resetLiveState],
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
    typing: awaitingReply,
    replying,
    isStarting,
    isSessionLoading,
    sendMessage,
    voice: {
      status: connection.voiceStatus,
      muted: connection.muted,
      speaking: connection.speaking,
      hearingUser: connection.userTalking || Boolean(caption?.text),
      getMicLevel: connection.getMicLevel,
      toggle: toggleVoice,
      toggleMute: connection.toggleMute,
    },
    startNewSession,
    deleteSession,
  };
};

export default useChatSessions;
