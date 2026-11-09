import { normalizeMessage } from "./chat.helpers";
import { getTokens } from "@/hooks/useToken";

// Live voice channel engine: PCM capture (mic), PCM playback (agent audio),
// and the live socket session. Pure classes — React wiring lives in
// useLiveVoice.

const TARGET_SAMPLE_RATE = 16000; // mono, 16-bit LE per the API contract
const CHUNK_SAMPLES = 1600; // ~100 ms chunks at 16 kHz
const BARGE_IN_LEVEL = 900; // mean |sample| (of 32768) treated as the user speaking
const STOP_TIMEOUT_MS = 3000;

// Captures mic audio, downsamples to 16 kHz mono and emits 100 ms Int16
// chunks. Runs as an AudioWorklet so conversion never blocks the main thread.
const WORKLET_SOURCE = `
class Pcm16Downsampler extends AudioWorkletProcessor {
  constructor() {
    super();
    this.carry = new Float32Array(0);
    this.chunk = new Int16Array(${CHUNK_SAMPLES});
    this.chunkLength = 0;
    this.position = 0;
  }

  emitSample(value) {
    this.chunk[this.chunkLength++] = value;
    if (this.chunkLength === this.chunk.length) {
      this.port.postMessage(this.chunk.buffer, [this.chunk.buffer]);
      this.chunk = new Int16Array(${CHUNK_SAMPLES});
      this.chunkLength = 0;
    }
  }

  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input || !input.length) return true;

    const merged = new Float32Array(this.carry.length + input.length);
    merged.set(this.carry, 0);
    merged.set(input, this.carry.length);

    const ratio = sampleRate / ${TARGET_SAMPLE_RATE};
    let position = this.position;

    while (position + 1 < merged.length) {
      const index = Math.floor(position);
      const fraction = position - index;
      const sample =
        merged[index] * (1 - fraction) + merged[index + 1] * fraction;
      const clamped = Math.max(-1, Math.min(1, sample));
      this.emitSample(clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff);
      position += ratio;
    }

    const consumed = Math.min(Math.floor(position), merged.length - 1);
    this.carry = merged.slice(consumed);
    this.position = position - consumed;
    return true;
  }
}

registerProcessor("dison-pcm16-downsampler", Pcm16Downsampler);
`;

export class MicCapture {
  constructor({ onChunk } = {}) {
    this.onChunk = onChunk;
    this.context = null;
    this.stream = null;
    this.source = null;
    this.node = null;
  }

  async start() {
    this.context = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const moduleUrl = URL.createObjectURL(
      new Blob([WORKLET_SOURCE], { type: "application/javascript" }),
    );

    try {
      await this.context.audioWorklet.addModule(moduleUrl);
    } finally {
      URL.revokeObjectURL(moduleUrl);
    }

    this.source = this.context.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(
      this.context,
      "dison-pcm16-downsampler",
    );

    this.node.port.onmessage = (event) => {
      const chunk = event.data;

      if (!(chunk instanceof ArrayBuffer)) return;

      // Rough voice-energy level for barge-in detection.
      const samples = new Int16Array(chunk);
      let total = 0;
      for (let i = 0; i < samples.length; i += 1) {
        total += Math.abs(samples[i]);
      }

      this.onChunk?.(chunk, samples.length ? total / samples.length : 0);
    };

    this.source.connect(this.node);
    await this.context.resume();
  }

  stop() {
    this.node?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.context?.close().catch(() => {});
    this.context = null;
    this.stream = null;
    this.source = null;
    this.node = null;
  }
}

// Queued playback of agent PCM frames as contiguous AudioBufferSourceNodes.
export class AgentAudioPlayer {
  constructor({ onSpeakingChange } = {}) {
    this.context = null;
    this.nextStartTime = 0;
    this.sources = new Set();
    this.speaking = false;
    this.onSpeakingChange = onSpeakingChange;
  }

  async start() {
    if (!this.context) {
      this.context = new AudioContext();
    }
    await this.context.resume();
  }

  setSpeaking(value) {
    if (this.speaking === value) return;
    this.speaking = value;
    this.onSpeakingChange?.(value);
  }

  enqueue(arrayBuffer) {
    if (!this.context) return;

    const samples = new Int16Array(arrayBuffer);
    const floats = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i += 1) {
      floats[i] = samples[i] / 32768;
    }

    const audioBuffer = this.context.createBuffer(
      1,
      floats.length,
      TARGET_SAMPLE_RATE,
    );
    audioBuffer.copyToChannel(floats, 0);

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.context.destination);

    const startAt = Math.max(
      this.nextStartTime,
      this.context.currentTime + 0.02,
    );
    source.start(startAt);
    this.nextStartTime = startAt + audioBuffer.duration;

    this.sources.add(source);
    this.setSpeaking(true);

    source.onended = () => {
      this.sources.delete(source);
      if (!this.sources.size) this.setSpeaking(false);
    };
  }

  flush() {
    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
    });
    this.sources.clear();
    this.nextStartTime = this.context?.currentTime ?? 0;
    this.setSpeaking(false);
  }

  stop() {
    this.flush();
    this.context?.close().catch(() => {});
    this.context = null;
  }
}

/**
 * One live voice call over `WS /ws/chat/sessions/<id>/live/`.
 * Connects, requests the mic after `live.started`, streams audio both ways,
 * renders transcripts through callbacks, and cleans up on stop/error/close.
 */
export class LiveVoiceSession {
  constructor({
    sessionId,
    onStatus,
    onTranscript,
    onMessage,
    onSpeakingChange,
    onError,
    onEnded,
  }) {
    this.sessionId = sessionId;
    this.onStatus = onStatus;
    this.onTranscript = onTranscript;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onEnded = onEnded;

    this.ws = null;
    this.mic = new MicCapture({ onChunk: (chunk, level) => this.handleMicChunk(chunk, level) });
    this.player = new AgentAudioPlayer({
      onSpeakingChange: (speaking) => {
        if (!speaking) this.bargeInSent = false;
        onSpeakingChange?.(speaking);
      },
    });

    this.status = "idle";
    this.finishing = false;
    this.liveStarted = false;
    this.bargeInSent = false;
    this.stopTimer = null;
  }

  setStatus(status) {
    this.status = status;
    this.onStatus?.(status);
  }

  send(payload) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }

  async connect() {
    const socketUrl = import.meta.env.VITE_APP_SOCKET_URL;
    const { accessToken } = getTokens();

    if (!socketUrl || !accessToken) {
      throw new Error("Missing socket configuration or credentials");
    }

    this.setStatus("connecting");

    const baseUrl = String(socketUrl).replace(/\/$/, "");
    this.ws = new WebSocket(
      `${baseUrl}/ws/chat/sessions/${this.sessionId}/live/?token=${accessToken}`,
    );
    this.ws.binaryType = "arraybuffer";

    this.ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        try {
          this.handleJson(JSON.parse(event.data));
        } catch {
          // Ignore malformed frames.
        }
      } else {
        this.player.enqueue(event.data);
      }
    };

    this.ws.onclose = (event) => {
      if (this.finishing) return;

      if (event.code === 4401 || event.code === 4403) {
        this.fail("Voice session unavailable — please reopen the chat.");
      } else {
        this.fail("Voice connection ended unexpectedly");
      }
    };
  }

  handleJson(message) {
    switch (message.type) {
      case "connection.ready":
        this.send({ type: "live.start" });
        break;

      case "live.started":
        this.liveStarted = true;
        this.beginStreaming();
        break;

      case "live.stopped":
        this.finish();
        break;

      case "live.transcript":
        this.onTranscript?.(
          message.channel,
          message.text ?? "",
          Boolean(message.partial),
        );
        break;

      case "chat.message.created":
        // Persisted finals (user speech + agent replies) arrive in the API's
        // snake_case shape — normalize so consumers see role/senderType.
        this.onMessage?.(
          message.session_id ?? this.sessionId,
          normalizeMessage(message.message ?? {}),
        );
        break;

      case "live.error":
      case "live.not_available":
      case "error":
        this.fail(message.message || "Live voice failed");
        break;

      default:
        // pong, message.accepted, notification.created — nothing to do.
        break;
    }
  }

  async beginStreaming() {
    try {
      await this.player.start();
      await this.mic.start();
      this.setStatus("live");
    } catch (error) {
      const denied =
        error?.name === "NotAllowedError" || error?.name === "SecurityError";
      this.fail(
        denied
          ? "Microphone permission denied"
          : "Couldn't access your microphone",
      );
    }
  }

  // Mic audio goes up only after live.started (enforced by call order); while
  // the agent speaks, a loud enough chunk triggers barge-in.
  handleMicChunk(chunk, level) {
    if (this.ws?.readyState !== WebSocket.OPEN || !this.liveStarted) return;

    this.ws.send(chunk);

    if (this.player.speaking && !this.bargeInSent && level > BARGE_IN_LEVEL) {
      this.bargeInSent = true;
      this.player.flush();
      this.send({ type: "live.interrupt" });
    }
  }

  interrupt() {
    if (!this.liveStarted) return;
    this.bargeInSent = true;
    this.player.flush();
    this.send({ type: "live.interrupt" });
  }

  stopMicAndPlayer() {
    this.mic.stop();
    this.player.stop();
  }

  stop() {
    if (this.finishing || this.status === "idle") return;

    this.setStatus("stopping");

    if (this.liveStarted && this.ws?.readyState === WebSocket.OPEN) {
      this.stopMicAndPlayer();
      this.send({ type: "live.stop" });
      this.stopTimer = window.setTimeout(() => this.finish(), STOP_TIMEOUT_MS);
    } else {
      this.finish();
    }
  }

  fail(message) {
    this.onError?.(message);
    this.finish();
  }

  finish() {
    if (this.finishing) return;
    this.finishing = true;

    window.clearTimeout(this.stopTimer);
    this.stopMicAndPlayer();

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onmessage = null;
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close(1000);
      }
      this.ws = null;
    }

    this.setStatus("idle");
    this.onEnded?.();
  }
}
