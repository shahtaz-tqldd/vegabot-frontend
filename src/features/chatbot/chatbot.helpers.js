import { normalizeVoice } from "./voice.helpers";

const emptyKnowledge = () => ({ base: [], products: [], services: [] });

const CHATBOT_FIELD_MAP = {
  name: "chatbot_name",
  businessType: "business_type",
  welcomeMessage: "welcome_message",
  fallbackMessage: "fallback_message",
  escalationRule: "escalation_rule",
  neverAnswer: "never_answer",
  otherSettings: "other_settings",
  speakingPace: "speaking_pace",
  knowledgeEnabled: "knowledge_enabled",
  productsEnabled: "products_enabled",
  servicesEnabled: "services_enabled",
  productOrderingEnabled: "product_ordering_enabled",
};

// What the agent can do. `requires` marks an add-on that only works with its
// parent feature on.
export const CHATBOT_FEATURES = [
  {
    key: "knowledgeEnabled",
    label: "Knowledge base",
    description: "Answer from documents, web pages, and raw text",
  },
  {
    key: "productsEnabled",
    label: "Products",
    description: "Search and recommend products",
  },
  {
    key: "productOrderingEnabled",
    label: "Product ordering",
    description: "Add products to a cart and take orders",
    requires: "productsEnabled",
  },
  {
    key: "servicesEnabled",
    label: "Services",
    description: "Search and recommend services",
  },
];

export const DEFAULT_FEATURES = {
  knowledgeEnabled: true,
  productsEnabled: true,
  servicesEnabled: true,
  productOrderingEnabled: false,
};

export const pickFeatures = (chatbot = {}) =>
  Object.fromEntries(
    Object.keys(DEFAULT_FEATURES).map((key) => [
      key,
      chatbot[key] ?? DEFAULT_FEATURES[key],
    ]),
  );

// Mirrors the API rules so the request never fails with a 400.
export const featuresError = (features = {}) =>
  features.knowledgeEnabled || features.productsEnabled || features.servicesEnabled
    ? null
    : "Enable at least one of knowledge base, products, or services";

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
  speakingPace: raw.speaking_pace ?? raw.speakingPace ?? "normal",
  knowledgeEnabled: raw.knowledge_enabled ?? raw.knowledgeEnabled ?? true,
  productsEnabled: raw.products_enabled ?? raw.productsEnabled ?? true,
  servicesEnabled: raw.services_enabled ?? raw.servicesEnabled ?? true,
  productOrderingEnabled:
    raw.product_ordering_enabled ?? raw.productOrderingEnabled ?? false,
  voice: normalizeVoice(raw.voice),
  isAdminCreated: raw.is_admin_created ?? raw.isAdminCreated ?? false,
  trainedKnowledge: {
    productCount:
      raw.trained_knowledge?.product_count ??
      raw.trainedKnowledge?.productCount ??
      0,
    serviceCount:
      raw.trained_knowledge?.service_count ??
      raw.trainedKnowledge?.serviceCount ??
      0,
    knowledgeSourceCount:
      raw.trained_knowledge?.knowledge_source_count ??
      raw.trainedKnowledge?.knowledgeSourceCount ??
      0,
  },
  createdBy: raw.created_by ?? raw.createdBy ?? null,
  createdAt: raw.created_at ?? raw.createdAt,
  updatedAt: raw.updated_at ?? raw.updatedAt,
  stats: { conversations: 0, responses: 0, ...raw.stats },
  knowledge: raw.knowledge ?? emptyKnowledge(),
});

export const trainedKnowledgeCount = (chatbot) =>
  (chatbot?.trainedKnowledge?.knowledgeSourceCount || 0) +
  (chatbot?.trainedKnowledge?.productCount || 0) +
  (chatbot?.trainedKnowledge?.serviceCount || 0);
