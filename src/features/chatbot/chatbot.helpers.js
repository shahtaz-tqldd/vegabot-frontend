const emptyKnowledge = () => ({ base: [], products: [], services: [] });

const CHATBOT_FIELD_MAP = {
  name: "chatbot_name",
  businessType: "business_type",
  welcomeMessage: "welcome_message",
  fallbackMessage: "fallback_message",
  escalationRule: "escalation_rule",
  neverAnswer: "never_answer",
  otherSettings: "other_settings",
};

export const TONE_OPTIONS = [
  "friendly",
  "professional",
  "casual",
  "formal",
  "witty",
];

// Map the UI's camelCase field names to the API's snake_case field names.
export const toChatbotPayload = (values = {}) => {
  const payload = {};

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined) return;
    payload[CHATBOT_FIELD_MAP[key] || key] = value;
  });

  return payload;
};

// Map an API chatbot object to the camelCase shape used by the UI.
export const normalizeChatbot = (raw = {}) => ({
  ...raw,
  name: raw.chatbot_name ?? raw.name ?? "",
  businessType: raw.business_type ?? raw.businessType,
  description: raw.description ?? "",
  tone: raw.tone ?? "friendly",
  status: raw.status ?? "draft",
  welcomeMessage: raw.welcome_message ?? raw.welcomeMessage ?? "",
  fallbackMessage: raw.fallback_message ?? raw.fallbackMessage ?? "",
  instructions: raw.instructions ?? "",
  escalationRule: raw.escalation_rule ?? raw.escalationRule ?? "",
  neverAnswer: raw.never_answer ?? raw.neverAnswer ?? "",
  language: raw.language,
  timezone: raw.timezone,
  otherSettings: raw.other_settings ?? raw.otherSettings,
  logo: raw.logo ?? null,
  createdAt: raw.created_at ?? raw.createdAt,
  updatedAt: raw.updated_at ?? raw.updatedAt,
  stats: { conversations: 0, responses: 0, ...raw.stats },
  knowledge: raw.knowledge ?? emptyKnowledge(),
});

export const knowledgeCount = (chatbot) =>
  (chatbot?.knowledge?.base?.length || 0) +
  (chatbot?.knowledge?.products?.length || 0) +
  (chatbot?.knowledge?.services?.length || 0);
