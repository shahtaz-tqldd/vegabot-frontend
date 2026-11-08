import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import { apiSlice } from "@/features/api/apiSlice";
import { getTokens } from "@/hooks/useToken";

const NOTIFICATIONS_PATH = "/ws/notifications/";
const MAX_RETRY_DELAY_MS = 15000;

const isTrainingComplete = (message) =>
  message?.event === "training_complete" ||
  message?.notification_type === "training_complete";

/**
 * Listens on the notifications socket and keeps knowledge queries fresh.
 * Training finishes asynchronously, so training_complete events are what
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
    let attempts = 0;
    let disposed = false;

    const connect = () => {
      if (disposed) return;

      const baseUrl = String(socketUrl).replace(/\/$/, "");
      socket = new WebSocket(
        `${baseUrl}${NOTIFICATIONS_PATH}?token=${accessToken}`,
      );

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (!isTrainingComplete(message)) return;

          dispatch(apiSlice.util.invalidateTags(["knowledge"]));

          const title =
            message?.metadata?.title || message?.data?.title || "Knowledge";
          const skipped = message?.metadata?.training_stage === "skipped";

          toast.success(
            skipped ? `${title} is already trained` : `${title} finished training`,
          );
        } catch {
          // Ignore malformed frames.
        }
      };

      socket.onclose = () => {
        if (disposed) return;
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
      socket?.close();
    };
  }, [dispatch]);
};
