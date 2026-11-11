const TRAINING_STATUS_MAP = {
  queued: "processing",
  pending: "processing",
  started: "processing",
  processing: "processing",
  training: "processing",
  indexing: "processing",
  ready: "trained",
  trained: "trained",
  completed: "trained",
  complete: "trained",
  succeeded: "trained",
  success: "trained",
  skipped: "trained",
  failed: "failed",
  error: "failed",
  cancelled: "failed",
};

export const normalizeTrainingStatus = (status) =>
  TRAINING_STATUS_MAP[String(status || "").toLowerCase()] ?? "processing";

export const CURRENCY_OPTIONS = [
  "USD",
  "EUR",
  "GBP",
  "BDT",
  "INR",
  "AUD",
  "CAD",
  "JPY",
];

// The API's source types are file | website | text; accept the legacy
// url/custom spellings too so nothing breaks mid-rollout.
const normalizeSourceType = (value) => {
  const type = String(value || "").toLowerCase();

  if (type === "website" || type === "url") return "website";
  if (type === "text" || type === "custom") return "text";
  return "file";
};

const inferSourceType = (raw = {}) =>
  normalizeSourceType(raw.source_type ?? raw.type ?? (raw.url ? "website" : "text"));

const fallbackTitle = (raw = {}, type) => {
  if (type === "website" && raw.url) {
    try {
      return new URL(raw.url).hostname;
    } catch {
      return raw.url;
    }
  }
  if (type === "file") return raw.title || raw.file_name || "File";
  return raw.title || "Text source";
};

export const prettyFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// Map an API knowledge source to the shape used by the UI.
export const normalizeKnowledgeSource = (raw = {}) => {
  const type = inferSourceType(raw);

  return {
    ...raw,
    id: raw.id ?? raw.knowledge_base_id ?? raw.uuid,
    type,
    // Retrain is available for URL sources only.
    retrainable: type === "website",
    title: raw.title || fallbackTitle(raw, type),
    hasCustomTitle: Boolean(raw.title),
    url: raw.url ?? null,
    fileUrl: raw.file ?? null,
    fileSize: raw.file_size ?? raw.size ?? null,
    chunks: raw.chunks ?? raw.chunk_count ?? raw.total_chunks ?? 0,
    status: normalizeTrainingStatus(raw.status),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
};

// Secondary line shown under a source's title.
export const sourceMeta = (source = {}) => {
  if (source.source_type === "website") return source.url ?? "";
  if (source.source_type === "file") {
    return prettyFileSize(source.file_size) || "File";
  }
  return `${source.chunks || 0} chunk${source.chunks === 1 ? "" : "s"} of text`;
};

// Map an API product row to the shape used by the UI.
export const normalizeProduct = (raw = {}) => ({
  ...raw,
  id: raw.id ?? raw.uuid,
  name: raw.name ?? "",
  sku: raw.sku ?? "",
  category: raw.category ?? "",
  description: raw.description ?? "",
  price: raw.price ?? 0,
  currency: raw.currency ?? "USD",
  productUrl: raw.product_url ?? raw.productUrl ?? null,
  imageUrl: raw.image_url ?? raw.imageUrl ?? null,
  status: normalizeTrainingStatus(raw.status),
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

// Map an API service row to the shape used by the UI.
export const normalizeService = (raw = {}) => ({
  ...raw,
  id: raw.id ?? raw.uuid,
  name: raw.name ?? "",
  serviceType: raw.service_type ?? raw.serviceType ?? "",
  description: raw.description ?? "",
  cost: raw.cost ?? 0,
  currency: raw.currency ?? "USD",
  status: normalizeTrainingStatus(raw.status),
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

// Map an API training log to the shape used by the UI.
export const normalizeTrainingLog = (raw = {}) => {
  const source =
    typeof raw.source === "object" ? raw.source : { title: raw.source };

  return {
    ...raw,
    id: raw.id ?? raw.log_id ?? raw.uuid,
    status: normalizeTrainingStatus(raw.status ?? raw.state),
    sourceTitle:
      raw.source_title ??
      raw.title ??
      source?.title ??
      source?.name ??
      raw.knowledge_base ??
      "Knowledge source",
    stage: raw.training_stage ?? raw.stage ?? raw.metadata?.training_stage,
    message: raw.message,
    createdAt: raw.created_at ?? raw.timestamp,
  };
};
