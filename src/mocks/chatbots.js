/**
 * In-memory demo store for the chatbot builder UI. Chatbot CRUD and the base
 * knowledge tab are API-backed now — only products/services editing still
 * runs through this store until endpoints for them ship.
 */

const uid = () => Math.random().toString(36).slice(2, 10);

const daysAgo = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const base = (items) => items.map((item) => ({ id: uid(), ...item }));

const seedChatbots = [
  {
    id: "bot-aurora",
    slug: "aurora-support",
    name: "Aurora Support",
    description:
      "Front-line support agent for the Aurora web app. Answers billing, account and troubleshooting questions.",
    status: "active",
    tone: "friendly",
    responseLength: "medium",
    welcomeMessage:
      "Hi! I'm Aurora's support assistant. Ask me anything about your account, billing or the product.",
    updatedAt: daysAgo(1),
    stats: { conversations: 412, responses: 1980 },
    knowledge: {
      base: base([
        { type: "url", title: "Aurora help center", meta: "help.aurora.io", status: "trained" },
        { type: "url", title: "Pricing FAQ", meta: "aurora.io/pricing-faq", status: "trained" },
        { type: "file", title: "support-playbook.pdf", meta: "2.4 MB", status: "trained" },
      ]),
      products: base([
        { name: "Aurora Pro", sku: "AUR-PRO-01", category: "Subscription", price: 49, stock: 999 },
        { name: "Aurora Teams", sku: "AUR-TEAM-05", category: "Subscription", price: 199, stock: 999 },
        { name: "Priority support add-on", sku: "AUR-SUP-VP", category: "Add-on", price: 29, stock: 999 },
      ]),
      services: base([
        { name: "Onboarding session", description: "1:1 guided setup of your workspace with a specialist.", price: 0, durationMinutes: 45 },
        { name: "Data migration", description: "We move your existing knowledge base into Aurora.", price: 149, durationMinutes: 90 },
      ]),
    },
  },
  {
    id: "bot-nova",
    slug: "nova-sales",
    name: "Nova Sales",
    description:
      "Qualifies inbound leads, answers pricing questions and books demos for the sales team.",
    status: "active",
    tone: "professional",
    responseLength: "detailed",
    welcomeMessage:
      "Welcome! I'm Nova. Tell me what you're looking for and I'll point you to the right plan — or book a demo.",
    updatedAt: daysAgo(2),
    stats: { conversations: 268, responses: 1147 },
    knowledge: {
      base: base([
        { type: "url", title: "Nova product tour", meta: "novabot.io/tour", status: "trained" },
        { type: "url", title: "Customer case studies", meta: "novabot.io/cases", status: "processing" },
      ]),
      products: base([
        { name: "Nova Starter", sku: "NOV-ST-01", category: "Subscription", price: 19, stock: 999 },
        { name: "Nova Business", sku: "NOV-BZ-02", category: "Subscription", price: 99, stock: 999 },
      ]),
      services: base([
        { name: "Product demo", description: "Live 30-minute walkthrough tailored to your team.", price: 0, durationMinutes: 30 },
      ]),
    },
  },
  {
    id: "bot-lumen",
    slug: "lumen-docs",
    name: "Lumen Docs Bot",
    description:
      "Internal documentation assistant that helps engineers find API references and runbooks fast.",
    status: "active",
    tone: "concise",
    responseLength: "short",
    welcomeMessage: "Ask me about the API, infra or any runbook. I'll keep it short.",
    updatedAt: daysAgo(4),
    stats: { conversations: 1903, responses: 7422 },
    knowledge: {
      base: base([
        { type: "file", title: "api-reference.md", meta: "312 KB", status: "trained" },
        { type: "file", title: "incident-runbooks.pdf", meta: "1.1 MB", status: "trained" },
        { type: "file", title: "architecture-diagrams.png", meta: "4.6 MB", status: "trained" },
        { type: "url", title: "Engineering wiki", meta: "wiki.lumen.dev", status: "trained" },
      ]),
      products: [],
      services: [],
    },
  },
  {
    id: "bot-haven",
    slug: "haven-store",
    name: "Haven Store Assistant",
    description:
      "Shopkeeper agent for the Haven furniture store — product availability, order tracking and returns.",
    status: "active",
    tone: "friendly",
    responseLength: "medium",
    welcomeMessage: "Hey! Looking for something for your home? I can check stock or track an order.",
    updatedAt: daysAgo(3),
    stats: { conversations: 733, responses: 3110 },
    knowledge: {
      base: base([
        { type: "url", title: "Shipping & returns policy", meta: "haven.store/policies", status: "trained" },
      ]),
      products: base([
        { name: "Drift oak coffee table", sku: "HVN-CT-114", category: "Living room", price: 349, stock: 14 },
        { name: "Lyra linen sofa", sku: "HVN-SF-021", category: "Living room", price: 1299, stock: 6 },
        { name: "Base ceramic table lamp", sku: "HVN-LP-330", category: "Lighting", price: 89, stock: 41 },
        { name: "Fold wall shelf", sku: "HVN-SH-077", category: "Storage", price: 59, stock: 0 },
      ]),
      services: base([
        { name: "In-home assembly", description: "Two-person team assembles any Haven furniture purchase.", price: 79, durationMinutes: 120 },
        { name: "Interior design consult", description: "Video call with a certified Haven designer.", price: 59, durationMinutes: 60 },
      ]),
    },
  },
  {
    id: "bot-pulse",
    slug: "pulse-fitness",
    name: "Pulse Fitness Coach",
    description:
      "Workout planner and class-booking agent for the Pulse gym chain.",
    status: "draft",
    tone: "playful",
    responseLength: "medium",
    welcomeMessage: "Yo! Ready to move? Ask me about classes, trainers or a training plan.",
    updatedAt: daysAgo(6),
    stats: { conversations: 87, responses: 340 },
    knowledge: {
      base: base([
        { type: "url", title: "Class schedule", meta: "pulsefit.io/schedule", status: "processing" },
      ]),
      products: [],
      services: base([
        { name: "Personal training", description: "1:1 session with a Pulse certified trainer.", price: 65, durationMinutes: 60 },
        { name: "Body composition scan", description: "InBody scan with a full report.", price: 25, durationMinutes: 15 },
        { name: "Group HIIT class", description: "45-minute high intensity interval session.", price: 18, durationMinutes: 45 },
      ]),
    },
  },
  {
    id: "bot-atlas",
    slug: "atlas-travel",
    name: "Atlas Travel Desk",
    description:
      "Helps travelers compare destinations, visas and packages for the Atlas agency.",
    status: "active",
    tone: "professional",
    responseLength: "detailed",
    welcomeMessage:
      "Good day! I'm Atlas. Tell me your destination or budget and I'll suggest suitable packages.",
    updatedAt: daysAgo(8),
    stats: { conversations: 156, responses: 610 },
    knowledge: {
      base: base([
        { type: "url", title: "Visa requirements by country", meta: "atlas.travel/visas", status: "trained" },
        { type: "file", title: "2026-package-catalog.pdf", meta: "6.8 MB", status: "trained" },
      ]),
      products: base([
        { name: "Bali escape — 7 nights", sku: "ATL-BA-7N", category: "Package", price: 1250, stock: 12 },
        { name: "Alps ski week", sku: "ATL-AL-7N", category: "Package", price: 1890, stock: 8 },
      ]),
      services: base([
        { name: "Trip planning call", description: "Personalized itinerary planning with an agent.", price: 0, durationMinutes: 30 },
      ]),
    },
  },
  {
    id: "bot-sage",
    slug: "sage-tutor",
    name: "Sage Tutor",
    description: "Math and physics tutor bot for high-school students.",
    status: "draft",
    tone: "concise",
    responseLength: "short",
    welcomeMessage: "What are we solving today? Send me a problem.",
    updatedAt: daysAgo(11),
    stats: { conversations: 44, responses: 205 },
    knowledge: { base: [], products: [], services: [] },
  },
  {
    id: "bot-forge",
    slug: "forge-hr",
    name: "Forge HR Helper",
    description: "Answers employee questions about policies, leave and benefits.",
    status: "active",
    tone: "professional",
    responseLength: "medium",
    welcomeMessage: "Hello! Ask me about leave policies, benefits or onboarding at Forge.",
    updatedAt: daysAgo(5),
    stats: { conversations: 921, responses: 2601 },
    knowledge: {
      base: base([
        { type: "file", title: "employee-handbook.pdf", meta: "3.2 MB", status: "trained" },
        { type: "url", title: "Benefits portal guide", meta: "forge.co/benefits", status: "trained" },
      ]),
      products: [],
      services: [],
    },
  },
  {
    id: "bot-zephyr",
    slug: "zephyr-community",
    name: "Zephyr Community",
    description: "Keeps the Zephyr Discord-style community onboarding smooth.",
    status: "draft",
    tone: "playful",
    responseLength: "medium",
    welcomeMessage: "Hi hi! New here? I'll get you set up in no time.",
    updatedAt: daysAgo(14),
    stats: { conversations: 61, responses: 240 },
    knowledge: { base: [], products: [], services: [] },
  },
  {
    id: "bot-orchid",
    slug: "orchid-clinic",
    name: "Orchid Clinic",
    description: "Books appointments and answers patient FAQs for Orchid dental.",
    status: "active",
    tone: "friendly",
    responseLength: "medium",
    welcomeMessage: "Hi! Need an appointment or have a question about our treatments? I can help.",
    updatedAt: daysAgo(2),
    stats: { conversations: 305, responses: 1210 },
    knowledge: {
      base: base([
        { type: "url", title: "Treatment descriptions", meta: "orchid.clinic/treatments", status: "trained" },
      ]),
      products: [],
      services: base([
        { name: "Routine checkup", description: "Full exam, X-rays and cleaning.", price: 95, durationMinutes: 45 },
        { name: "Teeth whitening", description: "In-clinic whitening session.", price: 240, durationMinutes: 60 },
        { name: "Emergency consultation", description: "Same-day urgent dental assessment.", price: 120, durationMinutes: 30 },
      ]),
    },
  },
  {
    id: "bot-cobalt",
    slug: "cobalt-devtools",
    name: "Cobalt DevTools",
    description: "Pre-sales agent for Cobalt's developer tooling suite.",
    status: "active",
    tone: "concise",
    responseLength: "short",
    welcomeMessage: "Ask me about Cobalt CLI, CI runners or pricing.",
    updatedAt: daysAgo(7),
    stats: { conversations: 132, responses: 480 },
    knowledge: {
      base: base([
        { type: "url", title: "CLI docs", meta: "cobalt.dev/docs", status: "trained" },
        { type: "url", title: "Changelog", meta: "cobalt.dev/changelog", status: "trained" },
      ]),
      products: base([
        { name: "Cobalt CLI Pro", sku: "CBL-CLI-PRO", category: "License", price: 15, stock: 999 },
      ]),
      services: [],
    },
  },
  {
    id: "bot-ember",
    slug: "ember-eats",
    name: "Ember Eats",
    description: "Takes orders and tracks deliveries for the Ember restaurant.",
    status: "draft",
    tone: "friendly",
    responseLength: "short",
    welcomeMessage: "Hungry? Tell me what you're craving and I'll place the order.",
    updatedAt: daysAgo(9),
    stats: { conversations: 58, responses: 190 },
    knowledge: { base: [], products: [], services: [] },
  },
  {
    id: "bot-verdict",
    slug: "verdict-legal",
    name: "Verdict Legal Intake",
    description: "Structured intake agent for a small legal practice.",
    status: "active",
    tone: "professional",
    responseLength: "detailed",
    welcomeMessage:
      "Welcome. I can gather the details of your matter and schedule a consultation with the right attorney.",
    updatedAt: daysAgo(3),
    stats: { conversations: 74, responses: 310 },
    knowledge: {
      base: base([
        { type: "file", title: "practice-areas-overview.pdf", meta: "840 KB", status: "trained" },
      ]),
      products: [],
      services: base([
        { name: "Initial consultation", description: "30-minute case assessment with an attorney.", price: 0, durationMinutes: 30 },
      ]),
    },
  },
  {
    id: "bot-driftwood",
    slug: "driftwood-hotel",
    name: "Driftwood Concierge",
    description: "Guest-facing concierge for the Driftwood boutique hotel.",
    status: "active",
    tone: "friendly",
    responseLength: "medium",
    welcomeMessage: "Welcome to Driftwood! Need restaurant tips, spa bookings or a late checkout?",
    updatedAt: daysAgo(1),
    stats: { conversations: 266, responses: 1020 },
    knowledge: {
      base: base([
        { type: "url", title: "Local guide", meta: "driftwood.co/guide", status: "trained" },
      ]),
      products: base([
        { name: "Spa day pass", sku: "DW-SPA-01", category: "Experience", price: 60, stock: 25 },
      ]),
      services: base([
        { name: "Airport pickup", description: "Private car from the airport to the hotel.", price: 45, durationMinutes: 45 },
      ]),
    },
  },
  {
    id: "bot-quantum",
    slug: "quantum-finance",
    name: "Quantum Finance Guide",
    description: "Explains Quantum's investment products and compliance basics.",
    status: "draft",
    tone: "professional",
    responseLength: "detailed",
    welcomeMessage: "Hello. Ask me about our funds, minimums or compliance documentation.",
    updatedAt: daysAgo(16),
    stats: { conversations: 22, responses: 96 },
    knowledge: { base: [], products: [], services: [] },
  },
  {
    id: "bot-wildflower",
    slug: "wildflower-shop",
    name: "Wildflower Shop",
    description: "Gift-finding assistant for a botanical boutique.",
    status: "active",
    tone: "playful",
    responseLength: "medium",
    welcomeMessage: "Hi! Looking for a gift or something green for your home? I love this stuff.",
    updatedAt: daysAgo(4),
    stats: { conversations: 143, responses: 520 },
    knowledge: {
      base: base([
        { type: "url", title: "Plant care guides", meta: "wildflower.shop/care", status: "trained" },
      ]),
      products: base([
        { name: "Monstera deliciosa", sku: "WF-PL-011", category: "Plants", price: 34, stock: 18 },
        { name: "Terracotta pot set", sku: "WF-PT-004", category: "Pots", price: 42, stock: 30 },
        { name: "Dried bouquet — amber", sku: "WF-BQ-107", category: "Dried", price: 28, stock: 0 },
      ]),
      services: [],
    },
  },
];

const chatbots = [...seedChatbots];

export const getChatbots = () => chatbots;

export const getChatbot = (slug) =>
  chatbots.find((chatbot) => chatbot.slug === slug);

// Seed an empty shell for API-backed chatbots so the knowledge demo flows
// (which stay local until the knowledge endpoints ship) keep working.
export const ensureChatbot = ({ slug, name }) => {
  const existing = getChatbot(slug);
  if (existing) return existing;

  const chatbot = {
    id: `bot-${uid()}`,
    slug,
    name: name || slug,
    description: "",
    status: "draft",
    tone: "friendly",
    responseLength: "medium",
    welcomeMessage: "",
    updatedAt: new Date().toISOString(),
    stats: { conversations: 0, responses: 0 },
    knowledge: { base: [], products: [], services: [] },
  };

  chatbots.unshift(chatbot);
  return chatbot;
};

export const addProducts = (slug, products) => {
  const chatbot = getChatbot(slug);
  if (!chatbot) return [];

  const created = base(products);
  chatbot.knowledge.products.unshift(...created);
  touch(chatbot);
  return created;
};

export const removeProduct = (slug, id) => {
  const chatbot = getChatbot(slug);
  if (!chatbot) return;

  chatbot.knowledge.products = chatbot.knowledge.products.filter(
    (product) => product.id !== id,
  );
  touch(chatbot);
};

export const addServices = (slug, services) => {
  const chatbot = getChatbot(slug);
  if (!chatbot) return [];

  const created = base(services);
  chatbot.knowledge.services.unshift(...created);
  touch(chatbot);
  return created;
};

export const removeService = (slug, id) => {
  const chatbot = getChatbot(slug);
  if (!chatbot) return;

  chatbot.knowledge.services = chatbot.knowledge.services.filter(
    (service) => service.id !== id,
  );
  touch(chatbot);
};

const touch = (chatbot) => {
  chatbot.updatedAt = new Date().toISOString();
};
