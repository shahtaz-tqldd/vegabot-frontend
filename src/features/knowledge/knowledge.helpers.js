const TRAINING_STATUS_MAP = {
  queued: "processing",
  pending: "processing",
  started: "processing",
  processing: "processing",
  training: "processing",
  indexing: "processing",
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

const SOURCE_TYPES = ["file", "url", "custom"];

const inferType = (raw = {}) => {
  if (SOURCE_TYPES.includes(raw.type)) return raw.type;
  if (raw.url) return "url";
  if (raw.file) return "file";
  return "custom";
};

const fallbackTitle = (raw = {}, type) => {
  if (type === "url" && raw.url) {
    try {
      return new URL(raw.url).hostname;
    } catch {
      return raw.url;
    }
  }
  if (type === "file") return raw.title || "File";
  return raw.title || "Custom text";
};

export const prettyFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// Map an API knowledge source to the shape used by the UI.
export const normalizeKnowledgeSource = (raw = {}) => {
  const type = inferType(raw);

  return {
    ...raw,
    id: raw.id ?? raw.knowledge_base_id ?? raw.uuid,
    type,
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
  if (source.type === "url") return source.url ?? "";
  if (source.type === "file") {
    return prettyFileSize(source.fileSize) || "File";
  }
  return `${source.chunks || 0} chunk${source.chunks === 1 ? "" : "s"}`;
};

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

const firstDefined = (candidates, fallback) =>
  candidates.find((value) => value !== undefined && value !== null) ?? fallback;

// Map an API usage summary to the shape used by the UI.
export const normalizeKnowledgeUsage = (raw = {}) => ({
  chunksUsed: Number(
    firstDefined(
      [raw.chunks_used, raw.used_chunks, raw.chunks, raw.total_chunks],
      0,
    ),
  ),
  chunksLimit: Number(
    firstDefined([raw.chunks_limit, raw.max_chunks, raw.chunk_limit], 0),
  ),
  storageUsed: Number(
    firstDefined(
      [raw.file_size_used, raw.storage_used, raw.used_file_size, raw.file_size],
      0,
    ),
  ),
  storageLimit: Number(
    firstDefined(
      [raw.file_size_limit, raw.storage_limit, raw.max_file_size],
      0,
    ),
  ),
});
