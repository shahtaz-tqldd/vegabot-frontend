import { useEffect, useRef } from "react";

import { normalizeMessage } from "@/features/chat/chat.helpers";
import { getTokens } from "@/hooks/useToken";

// Close codes from the chat socket contract — never retry these.
const UNAUTHENTICATED = 4401;
const FORBIDDEN = 4403;

const MAX_RETRY_DELAY_MS = 15000;
const KEEPALIVE_INTERVAL_MS = 25000;

/**
 * Subscribes to a chat session channel (`/ws/chat/sessions/<id>/`).
 *
 * Every `chat.message.created` event (user and agent senders alike) is
 * forwarded through `onMessage(sessionId, message)`. The hook owns
 * reconnection with backoff, a keepalive ping, and latest-handler wiring so
 * consumers can pass inline callbacks safely.
 */
export const useChatSocket = ({ sessionId, onMessage }) => {
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_APP_SOCKET_URL;
    const { accessToken } = getTokens();

    if (!sessionId || !socketUrl || !accessToken) return undefined;

    let socket;
    let retryTimer;
    let keepaliveTimer;
    let attempts = 0;
    let disposed = false;

    const connect = () => {
      if (disposed) return;

      const baseUrl = String(socketUrl).replace(/\/$/, "");
      socket = new WebSocket(
        `${baseUrl}/ws/chat/sessions/${sessionId}/?token=${accessToken}`,
      );

      socket.onopen = () => {
        attempts = 0;
        keepaliveTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, KEEPALIVE_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "chat.message.created") {
            handlerRef.current?.(
              payload.session_id ?? sessionId,
              normalizeMessage(payload.message ?? {}),
            );
          }
          // pong / connection.ready / error / notification.created frames
          // need no action here — notifications have their own socket.
        } catch {
          // Ignore malformed frames.
        }
      };

      socket.onclose = (event) => {
        window.clearInterval(keepaliveTimer);
        if (disposed) return;
        if (event.code === UNAUTHENTICATED || event.code === FORBIDDEN) return;

        attempts += 1;
        retryTimer = window.setTimeout(
          connect,
          Math.min(1000 * 2 ** attempts, MAX_RETRY_DELAY_MS),
        );
      };
    };

    connect();

    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      window.clearInterval(keepaliveTimer);
      socket?.close(1000);
    };
  }, [sessionId]);
};
