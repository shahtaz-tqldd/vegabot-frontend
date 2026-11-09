import { useCallback, useEffect, useRef, useState } from "react";

import { LiveVoiceSession } from "./liveVoice";

/**
 * React wrapper around one LiveVoiceSession. `start(sessionId)` connects and
 * streams state updates through `status` ("idle" | "connecting" | "live" |
 * "stopping") and `speaking`. Callbacks (onMessage, onTranscript, onError,
 * onEnded) are kept in refs so callers can pass inline functions.
 */
export const useLiveVoice = ({
  onMessage,
  onTranscript,
  onError,
  onEnded,
} = {}) => {
  const [status, setStatus] = useState("idle");
  const [speaking, setSpeaking] = useState(false);

  const sessionRef = useRef(null);
  const callbacksRef = useRef({ onMessage, onTranscript, onError, onEnded });

  useEffect(() => {
    callbacksRef.current = { onMessage, onTranscript, onError, onEnded };
  }, [onMessage, onTranscript, onError, onEnded]);

  const start = useCallback(async (sessionId) => {
    if (sessionRef.current) return;

    const session = new LiveVoiceSession({
      sessionId,
      onStatus: (nextStatus) => {
        setStatus(nextStatus);
        if (nextStatus === "idle") sessionRef.current = null;
      },
      onSpeakingChange: setSpeaking,
      onMessage: (id, message) =>
        callbacksRef.current.onMessage?.(id, message),
      onTranscript: (channel, text, partial) =>
        callbacksRef.current.onTranscript?.(channel, text, partial),
      onError: (message) => callbacksRef.current.onError?.(message),
      onEnded: () => callbacksRef.current.onEnded?.(),
    });

    sessionRef.current = session;

    try {
      await session.connect();
    } catch (error) {
      sessionRef.current = null;
      setStatus("idle");
      throw error;
    }
  }, []);

  const stop = useCallback(() => {
    sessionRef.current?.stop();
  }, []);

  const interrupt = useCallback(() => {
    sessionRef.current?.interrupt();
  }, []);

  // Ending a call on unmount: no state updates are expected afterwards
  // because the session is finishing.
  useEffect(
    () => () => {
      sessionRef.current?.finish();
    },
    [],
  );

  return { status, speaking, start, stop, interrupt };
};
