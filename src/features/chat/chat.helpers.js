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
