import { useEffect, useRef } from "react";

const HISTORY_STATE_KEY = "__argon_close_on_back";

export const useCloseOnBack = (open, onClose) => {
  const onCloseRef = useRef(onClose);
  const historyMarkerRef = useRef(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handlePopState = () => {
      if (!historyMarkerRef.current) return;

      historyMarkerRef.current = null;
      onCloseRef.current?.();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (open && !historyMarkerRef.current) {
      const marker = `${Date.now()}-${Math.random()}`;
      historyMarkerRef.current = marker;
      window.history.pushState(
        { ...window.history.state, [HISTORY_STATE_KEY]: marker },
        "",
        window.location.href,
      );
      return;
    }

    if (!open && historyMarkerRef.current) {
      const marker = historyMarkerRef.current;
      historyMarkerRef.current = null;

      if (window.history.state?.[HISTORY_STATE_KEY] === marker) {
        window.history.back();
      }
    }
  }, [open]);
};
