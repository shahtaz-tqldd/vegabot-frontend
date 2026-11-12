// Browser audio plumbing for voice mode: microphone capture (PCM16 @ 16 kHz)
// and queued playback of the agent's voice (PCM16 @ 24 kHz). Pure classes —
// the socket/React wiring lives in useChatConnection.

const MIC_SAMPLE_RATE = 16000; // upstream: mono, 16-bit LE, 16 kHz
const AGENT_SAMPLE_RATE = 24000; // downstream: mono, 16-bit LE, 24 kHz
const CHUNK_SAMPLES = 1600; // ~100 ms per frame at 16 kHz

// Downsamples the mic to 16 kHz mono and emits 100 ms Int16 chunks. Runs as
// an AudioWorklet so conversion never blocks the main thread.
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

    const ratio = sampleRate / ${MIC_SAMPLE_RATE};
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

registerProcessor("vegabot-pcm16-downsampler", Pcm16Downsampler);
`;

// Voice mode needs mic capture plus AudioWorklet (for PCM conversion).
export const voiceSupported = () =>
  typeof window !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  "AudioWorkletNode" in window;

export class MicCapture {
  constructor() {
    this.onChunk = null;
    this.context = null;
    this.stream = null;
    this.source = null;
    this.node = null;
    this.analyser = null;
    this.levelBuffer = null;
  }

  get active() {
    return Boolean(this.stream);
  }

  // Asks for mic permission and starts emitting chunks. Echo cancellation
  // keeps the agent's own voice (from the speakers) from reading as the user
  // talking over it.
  async start(onChunk) {
    this.onChunk = onChunk;
    if (this.stream) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    try {
      this.stream = stream;
      this.context = new AudioContext({ sampleRate: MIC_SAMPLE_RATE });

      const moduleUrl = URL.createObjectURL(
        new Blob([WORKLET_SOURCE], { type: "application/javascript" }),
      );

      try {
        await this.context.audioWorklet.addModule(moduleUrl);
      } finally {
        URL.revokeObjectURL(moduleUrl);
      }

      this.source = this.context.createMediaStreamSource(stream);
      this.node = new AudioWorkletNode(
        this.context,
        "vegabot-pcm16-downsampler",
      );
      this.node.port.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) this.onChunk?.(event.data);
      };

      this.source.connect(this.node);

      // Feeds the "receiving voice" animation; read on demand via getLevel().
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.6;
      this.levelBuffer = new Float32Array(this.analyser.fftSize);
      this.source.connect(this.analyser);

      await this.context.resume();
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  // A disabled track yields silence, so muting never tears down the capture
  // graph and unmuting is instant.
  setMuted(muted) {
    this.stream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  // Current input loudness, 0..1 (0 while muted — the track is silent).
  getLevel() {
    if (!this.analyser) return 0;

    this.analyser.getFloatTimeDomainData(this.levelBuffer);
    let sum = 0;
    for (let i = 0; i < this.levelBuffer.length; i += 1) {
      sum += this.levelBuffer[i] * this.levelBuffer[i];
    }
    const rms = Math.sqrt(sum / this.levelBuffer.length);
    // Speech RMS sits roughly in 0.01–0.2; stretch it so talking fills the bars.
    return Math.min(1, rms * 6);
  }

  stop() {
    this.node?.disconnect();
    this.analyser?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.context?.close().catch(() => {});
    this.context = null;
    this.stream = null;
    this.source = null;
    this.node = null;
    this.analyser = null;
    this.levelBuffer = null;
  }
}

// Plays agent PCM frames back-to-back as AudioBufferSourceNodes.
export class AgentAudioPlayer {
  constructor({ onSpeakingChange } = {}) {
    this.context = null;
    this.nextStartTime = 0;
    this.sources = new Set();
    this.speaking = false;
    this.onSpeakingChange = onSpeakingChange;
  }

  // Call from a user gesture (the voice toggle click) so autoplay policies
  // let the context run.
  prime() {
    if (!this.context) this.context = new AudioContext();
    this.context.resume().catch(() => {});
  }

  setSpeaking(value) {
    if (this.speaking === value) return;
    this.speaking = value;
    this.onSpeakingChange?.(value);
  }

  enqueue(arrayBuffer) {
    if (!this.context || !arrayBuffer?.byteLength) return;

    const samples = new Int16Array(
      arrayBuffer,
      0,
      Math.floor(arrayBuffer.byteLength / 2),
    );
    const floats = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i += 1) {
      floats[i] = samples[i] / 32768;
    }

    const audioBuffer = this.context.createBuffer(
      1,
      floats.length,
      AGENT_SAMPLE_RATE,
    );
    audioBuffer.copyToChannel(floats, 0);

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.context.destination);

    const startAt = Math.max(this.nextStartTime, this.context.currentTime + 0.03);
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
      source.onended = null;
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
