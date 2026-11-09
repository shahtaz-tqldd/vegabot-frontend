import { useCallback, useEffect, useRef, useState } from "react";

import { getTokens } from "@/hooks/useToken";
import { AgentAudioPlayer, MicCapture } from "./audio";

// Close codes from the chat socket contract — never retry these.
const UNAUTHENTICATED = 4401;
const FORBIDDEN = 4403;

const MAX_RETRY_DELAY_MS = 15000;
const KEEPALIVE_INTERVAL_MS = 25000;

// After muting, keep streaming a short tail of silence (~1 s) so the
// server's turn detection sees the utterance end, then stop sending entirely.
const MUTE_SILENCE_CHUNKS = 10;

// Local speech detection, only for the "receiving voice" animation (the
// server does the real turn-taking): RMS above this counts as talking, and
// talking holds for a moment after the level drops so pauses don't flicker.
const TALK_LEVEL = 0.02;
const TALK_HOLD_MS = 700;

const chunkLevel = (chunk) => {
  const samples = new Int16Array(chunk);
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length) / 32768;
};

const VOICE_ERROR_CODES = new Set(["voice_unavailable", "voice_failed"]);

const micErrorMessage = (error) =>
  error?.name === "NotAllowedError" || error?.name === "SecurityError"
    ? "Microphone permission denied"
    : "Couldn't access your microphone";

/**
 * One websocket per chat session (`/ws/chat/sessions/<id>/`) carrying both
 * text and voice. The socket always starts in `text` mode; voice is layered
 * on top with `mode.set` and can be switched on/off at any time.
 *
 * Every JSON frame is forwarded through `onEvent(event)` (plus a synthetic
 * `{ type: "connection.reconnected" }` after a reconnect) so the caller can
 * own conversation state. This hook owns transport only: reconnects,
 * keepalive, an outbox for frames sent before the socket is ready, the mic,
 * and agent audio playback.
 *
 * Voice state: `voiceStatus` is "off" | "starting" | "on"; `muted` stops the
 * mic without leaving voice mode, so spoken replies keep coming while the
 * user types.
 */
export const useChatConnection = ({
  sessionId,
  onEvent,
  onError,
  onTalkingChange,
}) => {
  const [connected, setConnected] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("off");
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [userTalking, setUserTalking] = useState(false);

  const callbacksRef = useRef({ onEvent, onError, onTalkingChange });
  const socketRef = useRef(null);
  const readyRef = useRef(false);
  const outboxRef = useRef([]);
  const modeRef = useRef("text");
  const wantVoiceRef = useRef(false);
  const mutedRef = useRef(false);
  const silenceBudgetRef = useRef(0);
  const talkingRef = useRef(false);
  const lastTalkAtRef = useRef(0);

  useEffect(() => {
    callbacksRef.current = { onEvent, onError, onTalkingChange };
  }, [onEvent, onError, onTalkingChange]);

  // Created once per hook instance; both are inert until voice starts.
  const [player] = useState(
    () => new AgentAudioPlayer({ onSpeakingChange: setSpeaking }),
  );
  const [mic] = useState(() => new MicCapture());

  // Mic frames go up only in audio mode; while muted, just a short silence
  // tail is sent so the server can close the user's turn.
  const handleMicChunk = useCallback((chunk) => {
    const now = Date.now();
    if (!mutedRef.current && chunkLevel(chunk) > TALK_LEVEL) {
      lastTalkAtRef.current = now;
    }
    const talking =
      modeRef.current === "audio" && now - lastTalkAtRef.current < TALK_HOLD_MS;
    if (talking !== talkingRef.current) {
      talkingRef.current = talking;
      setUserTalking(talking);
      callbacksRef.current.onTalkingChange?.(talking);
    }

    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return;
    if (modeRef.current !== "audio") return;

    if (mutedRef.current) {
      if (silenceBudgetRef.current <= 0) return;
      silenceBudgetRef.current -= 1;
    }

    socket.send(chunk);
  }, []);

  const sendFrame = useCallback((payload) => {
    const socket = socketRef.current;

    if (readyRef.current && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    } else {
      outboxRef.current.push(payload);
    }
  }, []);

  // Tears voice down locally (mic + playback) without talking to the server.
  const resetVoice = useCallback(() => {
    wantVoiceRef.current = false;
    modeRef.current = "text";
    mutedRef.current = false;
    mic.stop();
    player.stop();
    if (talkingRef.current) callbacksRef.current.onTalkingChange?.(false);
    talkingRef.current = false;
    setVoiceStatus("off");
    setMuted(false);
    setUserTalking(false);
  }, [mic, player]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_APP_SOCKET_URL;
    const { accessToken } = getTokens();

    if (!sessionId || !socketUrl || !accessToken) return undefined;

    let retryTimer;
    let keepaliveTimer;
    let attempts = 0;
    let hasConnected = false;
    let disposed = false;

    const emit = (event) => callbacksRef.current.onEvent?.(event);

    const handleJson = (message) => {
      switch (message.type) {
        case "connection.ready": {
          readyRef.current = true;
          modeRef.current = "text";
          setConnected(true);

          if (hasConnected) emit({ type: "connection.reconnected" });
          hasConnected = true;

          // Mode is per connection: resume voice after a reconnect, and send
          // anything queued before the socket was ready.
          // (While the mic permission prompt is still open, enableVoice sends
          // mode.set once it resolves.)
          const socket = socketRef.current;
          if (wantVoiceRef.current && mic.active) {
            setVoiceStatus("starting");
            socket.send(JSON.stringify({ type: "mode.set", mode: "audio" }));
          }
          const pending = outboxRef.current;
          outboxRef.current = [];
          pending.forEach((payload) => socket.send(JSON.stringify(payload)));
          break;
        }

        case "mode.changed": {
          const mode = message.data?.mode === "audio" ? "audio" : "text";
          modeRef.current = mode;

          if (mode === "audio") {
            if (wantVoiceRef.current) {
              setVoiceStatus("on");
            } else {
              // The user turned voice off while it was starting.
              sendFrame({ type: "mode.set", mode: "text" });
            }
          } else if (wantVoiceRef.current) {
            // Server dropped back to text on its own (e.g. voice_failed).
            resetVoice();
          }
          break;
        }

        case "agent.response.completed":
          if (message.data?.interrupted) player.flush();
          break;

        case "error":
          if (VOICE_ERROR_CODES.has(message.code)) {
            resetVoice();
          } else if (
            message.code === "busy" &&
            wantVoiceRef.current &&
            modeRef.current !== "audio"
          ) {
            // Voice is already running for this session in another tab.
            resetVoice();
          }
          break;

        default:
          break;
      }

      emit(message);
    };

    const connect = () => {
      if (disposed) return;

      const baseUrl = String(socketUrl).replace(/\/$/, "");
      const socket = new WebSocket(
        `${baseUrl}/ws/chat/sessions/${sessionId}/?token=${accessToken}`,
      );
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;

      socket.onopen = () => {
        attempts = 0;
        keepaliveTimer = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, KEEPALIVE_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== "string") {
          // Agent voice. Ignore stragglers once the user has left voice.
          if (wantVoiceRef.current) player.enqueue(event.data);
          return;
        }

        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return; // Ignore malformed frames.
        }
        handleJson(message);
      };

      socket.onclose = (event) => {
        window.clearInterval(keepaliveTimer);
        readyRef.current = false;
        modeRef.current = "text";
        if (socketRef.current === socket) socketRef.current = null;
        if (disposed) return;

        setConnected(false);
        // Agent audio from the dead connection will never finish cleanly.
        player.flush();
        if (wantVoiceRef.current) setVoiceStatus("starting");

        if (event.code === UNAUTHENTICATED || event.code === FORBIDDEN) {
          resetVoice();
          callbacksRef.current.onError?.(
            "This conversation is unavailable — please reopen it.",
          );
          return;
        }

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
      readyRef.current = false;
      outboxRef.current = [];
      socketRef.current?.close(1000); // Closing also ends the live model.
      socketRef.current = null;
      setConnected(false);
      resetVoice();
    };
  }, [sessionId, mic, player, resetVoice, sendFrame]);

  // Stop the mic/audio if the page unmounts mid-voice.
  useEffect(
    () => () => {
      mic.stop();
      player.stop();
    },
    [mic, player],
  );

  const send = useCallback(
    (content) => sendFrame({ type: "message.send", content }),
    [sendFrame],
  );

  // Must be called from the click handler: the audio context is primed
  // synchronously so the browser allows playback.
  const enableVoice = useCallback(async () => {
    if (wantVoiceRef.current) return true;

    wantVoiceRef.current = true;
    mutedRef.current = false;
    setMuted(false);
    setVoiceStatus("starting");
    player.prime();

    try {
      // Ask for the mic before starting the (billed) live model.
      await mic.start(handleMicChunk);
    } catch (error) {
      resetVoice();
      callbacksRef.current.onError?.(micErrorMessage(error));
      return false;
    }

    // The user may have toggled voice back off during the permission prompt.
    if (!wantVoiceRef.current) {
      mic.stop();
      return false;
    }

    // Before the socket is ready, connection.ready sends mode.set itself.
    if (readyRef.current && modeRef.current !== "audio") {
      sendFrame({ type: "mode.set", mode: "audio" });
    }
    return true;
  }, [handleMicChunk, mic, player, resetVoice, sendFrame]);

  const disableVoice = useCallback(() => {
    const wasActive = wantVoiceRef.current || modeRef.current === "audio";
    resetVoice();
    if (wasActive && readyRef.current) {
      sendFrame({ type: "mode.set", mode: "text" });
    }
  }, [resetVoice, sendFrame]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    silenceBudgetRef.current = next ? MUTE_SILENCE_CHUNKS : 0;
    mic.setMuted(next);
    setMuted(next);
  }, [mic]);

  const getMicLevel = useCallback(() => mic.getLevel(), [mic]);

  return {
    connected,
    voiceStatus,
    muted,
    speaking,
    userTalking,
    getMicLevel,
    send,
    enableVoice,
    disableVoice,
    toggleMute,
  };
};
