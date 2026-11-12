// Map the API's snake_case chat payloads to the camelCase shape used by the
// UI. Messages also expose a UI-friendly `role` ("user" | "bot").

const toRole = (senderType) => (senderType === "agent" ? "bot" : "user");

export const normalizeAttachment = (raw = {}) => ({
  id: raw.id,
  attachmentType: raw.attachment_type ?? raw.attachmentType,
  fileUrl: raw.file_url ?? raw.fileUrl,
  fileName: raw.file_name ?? raw.fileName,
  mimeType: raw.mime_type ?? raw.mimeType,
  fileSize: raw.file_size ?? raw.fileSize,
  status: raw.status,
  textPreview: raw.text_preview ?? raw.textPreview,
  createdAt: raw.created_at ?? raw.createdAt,
});

export const normalizeRecommendation = (raw = {}) => ({
  type: raw.type,
  id: raw.id,
  name: raw.name ?? "",
  description: raw.description ?? "",
  price: raw.price ?? null,
  currency: raw.currency ?? "",
  url: raw.url ?? "",
  imageUrl: raw.image_url ?? raw.imageUrl ?? null,
  sku: raw.sku ?? "",
  category: raw.category ?? "",
  serviceType: raw.service_type ?? raw.serviceType ?? "",
});

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// Per-reply model usage (agent messages only; null on user messages).
export const normalizeUsage = (raw) => {
  if (!raw) return null;
  return {
    totalTokens: toNumber(raw.total_tokens),
    inputTokens: toNumber(raw.input_tokens),
    outputTokens: toNumber(raw.output_tokens),
    thinkingTokens: toNumber(raw.thinking_tokens),
    cachedInputTokens: toNumber(raw.cached_input_tokens),
    audioInputTokens: toNumber(raw.audio_input_tokens),
    audioOutputTokens: toNumber(raw.audio_output_tokens),
    audioInputSeconds: toNumber(raw.audio_input_seconds),
    audioOutputSeconds: toNumber(raw.audio_output_seconds),
    cost: toNumber(raw.cost),
    model: raw.model ?? null,
  };
};

export const normalizeMessage = (raw = {}) => {
  const senderType = raw.sender_type ?? raw.senderType;

  return {
    ...raw,
    id: raw.id,
    senderType,
    role: toRole(senderType),
    mode: raw.mode ?? "text",
    content: raw.content ?? "",
    attachments: (raw.attachments ?? []).map(normalizeAttachment),
    recommendations: (raw.recommendations ?? []).map(normalizeRecommendation),
    responseTimeMs: raw.response_time_ms ?? raw.responseTimeMs,
    usage:
      raw.usage && "total_tokens" in raw.usage
        ? normalizeUsage(raw.usage)
        : (raw.usage ?? null),
    time: raw.created_at ?? raw.createdAt ?? null,
  };
};

export const normalizeSessionDetail = (raw = {}) => ({
  id: raw.id,
  chatbotSlug: raw.chatbot?.slug,
  chatbotName: raw.chatbot?.chatbot_name,
  tone: raw.chatbot?.tone,
  status: raw.status,
  messages: (raw.messages ?? []).map(normalizeMessage),
  lastActivityAt: raw.last_activity_at ?? raw.lastActivityAt,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

export const normalizeSessionSummary = (raw = {}) => ({
  id: raw.id,
  chatbotSlug: raw.chatbot?.slug,
  chatbotName: raw.chatbot?.chatbot_name,
  tone: raw.chatbot?.tone,
  status: raw.status,
  messageCount: raw.message_count ?? raw.messageCount ?? 0,
  cartItemCount: raw.cart_item_count ?? 0,
  purchasedItemCount: raw.purchased_item_count ?? 0,
  orderCount: raw.order_count ?? 0,
  escalationCount: raw.escalation_count ?? 0,
  totalTokens: raw.total_tokens ?? null,
  totalCost: raw.total_cost ?? null,
  avgResponseTimeMs: raw.avg_response_time_ms ?? null,
  lastMessage: raw.last_message
    ? {
        senderType: raw.last_message.sender_type,
        content: raw.last_message.content,
        createdAt: raw.last_message.created_at,
      }
    : null,
  lastActivityAt: raw.last_activity_at ?? raw.lastActivityAt,
  createdAt: raw.created_at,
});

// ── Session commerce & escalations ─────────────────────────────────────────

export const normalizeCartItem = (raw = {}) => ({
  id: raw.id,
  session: raw.session,
  product: raw.product ?? null,
  order: raw.order ?? null,
  productName: raw.product_name ?? "",
  sku: raw.sku ?? "",
  productUrl: raw.product_url ?? "",
  imageUrl: raw.image_url ?? null,
  unitPrice: raw.unit_price ?? null,
  currency: raw.currency ?? "",
  quantity: raw.quantity ?? 1,
  lineTotal: raw.line_total ?? null,
  status: raw.status ?? "in_cart",
  createdAt: raw.created_at,
  updatedAt: raw.updated_at,
});

export const normalizeOrder = (raw = {}) => ({
  id: raw.id,
  session: raw.session,
  orderNumber: raw.order_number ?? "",
  status: raw.status ?? "",
  itemCount: raw.item_count ?? 0,
  totalAmount: raw.total_amount ?? null,
  currency: raw.currency ?? "",
  items: (raw.items ?? []).map(normalizeCartItem),
  createdAt: raw.created_at,
});

export const normalizeEscalation = (raw = {}) => ({
  id: raw.id,
  session: raw.session,
  message: raw.message ?? null,
  chatbot: raw.chatbot ?? null,
  question: raw.question ?? "",
  reason: raw.reason ?? "",
  status: raw.status ?? "",
  resolutionNote: raw.resolution_note ?? "",
  createdAt: raw.created_at,
});

export const formatMoney = (amount, currency) => {
  if (amount === null || amount === undefined || amount === "") return "—";
  const value = Number(amount);
  if (!Number.isFinite(value)) return String(amount);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ""}`.trim();
  }
};
