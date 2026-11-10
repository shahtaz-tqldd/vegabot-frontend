import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import { apiSlice } from "@/features/api/apiSlice";
import { getTokens } from "@/hooks/useToken";

const NOTIFICATIONS_PATH = "/ws/notifications/";
const MAX_RETRY_DELAY_MS = 15000;
const KEEPALIVE_INTERVAL_MS = 25000;
const UNAUTHENTICATED = 4401;

// Frames are `{ type: "notification.created", data: <notification> }`; older
// backends sent the notification fields flat on the frame itself.
const extractNotification = (frame) => {
  if (frame?.type === "notification.created") return frame.data ?? null;
  if (frame?.event || frame?.notification_type) return frame;
  return null;
};

/**
 * Keeps one notifications socket open for the whole app: realtime
 * notification.created frames refresh the notifications cache (unread badge,
 * open panels), and training_complete events additionally keep knowledge
 * queries fresh — training finishes asynchronously, so those events are what
 * flip sources from "Training" to "Trained" without manual refreshes.
 */
export const useNotifications = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_APP_SOCKET_URL;
    const { accessToken } = getTokens();

    if (!socketUrl || !accessToken) return undefined;

    let socket;
    let retryTimer;
    let keepaliveTimer;
    let attempts = 0;
    let disposed = false;

    const handleNotification = (notification) => {
      dispatch(apiSlice.util.invalidateTags(["notifications"]));

      const type =
        notification?.notification_type ?? notification?.event ?? "general";

      if (type !== "training_complete") return;

      dispatch(apiSlice.util.invalidateTags(["knowledge"]));

      const title =
        notification?.metadata?.title || notification?.title || "Knowledge";
      const skipped = notification?.metadata?.training_stage === "skipped";

      toast.success(
        skipped ? `${title} is already trained` : `${title} finished training`,
      );
    };

    const connect = () => {
      if (disposed) return;

      const baseUrl = String(socketUrl).replace(/\/$/, "");
      socket = new WebSocket(
        `${baseUrl}${NOTIFICATIONS_PATH}?token=${accessToken}`,
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
        let frame;

        try {
          frame = JSON.parse(event.data);
        } catch {
          return; // Ignore malformed frames.
        }

        const notification = extractNotification(frame);
        if (notification) handleNotification(notification);
      };

      socket.onclose = (closeEvent) => {
        window.clearInterval(keepaliveTimer);
        if (disposed) return;
        if (closeEvent.code === UNAUTHENTICATED) return;

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
      socket?.close();
    };
  }, [dispatch]);
};
