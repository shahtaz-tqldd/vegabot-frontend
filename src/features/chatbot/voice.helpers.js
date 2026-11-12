// Voice API ⇄ UI shape mapping. The API speaks snake_case; the UI camelCase.

export const DEFAULT_SPEAKING_PACES = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];

export const normalizePrebuiltVoice = (raw = {}) => ({
  type: "prebuilt",
  name: raw.name ?? "",
  gender: raw.gender ?? null,
  style: raw.style ?? "",
  description: raw.description ?? "",
  previewUrl: raw.preview_url ?? null,
  isDefault: Boolean(raw.is_default),
});

// A chatbot can still be on a custom voice created elsewhere; we only display
// it, never create or manage it here.
const normalizeCustomVoice = (raw = {}) => ({
  type: "custom",
  id: raw.id,
  name: raw.name ?? "",
  gender: raw.gender ?? null,
  isDefault: false,
});

export const normalizeVoice = (raw) => {
  if (!raw?.type) return null;
  return raw.type === "custom"
    ? normalizeCustomVoice(raw)
    : normalizePrebuiltVoice(raw);
};

export const normalizeVoiceOptions = (raw = {}) => ({
  prebuiltVoices: (raw.prebuilt_voices ?? []).map(normalizePrebuiltVoice),
  speakingPaces: raw.speaking_paces?.length
    ? raw.speaking_paces
    : DEFAULT_SPEAKING_PACES,
});

export const paceLabel = (pace) =>
  DEFAULT_SPEAKING_PACES.find((option) => option.value === pace)?.label ??
  "Normal";

export const capitalize = (value) =>
  String(value || "").replace(/\b\w/g, (char) => char.toUpperCase());
