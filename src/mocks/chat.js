/**
 * Simulated conversation engine. The real bot streaming (text + voice) will
 * arrive with the backend/socket integration — this keeps the UI demo alive.
 */

const pick = (options) => options[Math.floor(Math.random() * options.length)];

const formatProducts = (chatbot) => {
  const products = chatbot?.knowledge?.products || [];
  if (!products.length) return null;

  const lines = products
    .slice(0, 4)
    .map(
      (product) =>
        `- **${product.name}** — $${product.price}${product.stock === 0 ? " *(out of stock)*" : ""}`,
    );

  return `Here's what I currently know about:\n\n${lines.join("\n")}\n\nWant more details on any of them?`;
};

const formatServices = (chatbot) => {
  const services = chatbot?.knowledge?.services || [];
  if (!services.length) return null;

  const lines = services
    .slice(0, 4)
    .map(
      (service) =>
        `- **${service.name}** — $${service.price} · ${service.durationMinutes} min`,
    );

  return `I can help you book any of these:\n\n${lines.join("\n")}\n\nShall I set one up for you?`;
};

export const getBotReply = (message, chatbot) => {
  const text = String(message).toLowerCase();
  const name = chatbot?.name || "the assistant";

  if (/(^|\s)(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(text)) {
    return pick([
      `Hey there! Great to see you. What can **${name}** do for you today?`,
      `Hello! I'm all ears — ask me about our products, services or anything else.`,
    ]);
  }

  if (text.includes("price") || text.includes("cost") || text.includes("how much")) {
    return (
      formatProducts(chatbot) ||
      formatServices(chatbot) ||
      "I don't have pricing in my knowledge yet — add products or services on the **Knowledge** tab and I'll pick it up instantly."
    );
  }

  if (text.includes("product") || text.includes("buy") || text.includes("shop")) {
    return (
      formatProducts(chatbot) ||
      `No products are loaded yet. Upload the product template from the **Knowledge → Products** tab and I'll be able to answer shop questions right away.`
    );
  }

  if (text.includes("service") || text.includes("book") || text.includes("appointment")) {
    return (
      formatServices(chatbot) ||
      `I don't have any services in my knowledge base yet. Add them under **Knowledge → Services** (single or bulk) and I can start booking.`
    );
  }

  if (text.includes("url") || text.includes("doc") || text.includes("knowledge")) {
    const sources = chatbot?.knowledge?.base || [];
    if (sources.length) {
      return `I'm currently trained on **${sources.length}** knowledge source${sources.length === 1 ? "" : "s"}, including *${sources[0].title}*.`;
    }
    return "My knowledge base is empty so far — add URLs or files under **Knowledge → Base Knowledge**.";
  }

  if (text.includes("who are you") || text.includes("your name")) {
    return `I'm **${name}**${chatbot?.description ? ` — ${chatbot.description.toLowerCase()}` : ""}. I run on the knowledge you connect me to.`;
  }

  if (text.includes("thank")) {
    return pick([
      "Anytime! Anything else I can help with?",
      "You're welcome! Ping me whenever you need me. ",
    ]);
  }

  if (text.includes("bye") || text.includes("see you")) {
    return "See you around! I'll be right here when you need me. ";
  }

  return pick([
    `Good question! Based on my current knowledge, here's the short version:\n\n- I answer using the **base knowledge, products and services** connected to me\n- Everything you add on the left updates me instantly\n\nWant me to go deeper on any part?`,
    `Here's what I've got on that:\n\nI draw from ${knowledgeSummary(chatbot)}. If you'd like a more specific answer, try adding a source about it under the **Knowledge** tab.`,
    `I'm not fully sure about that one yet — my demo brain is intentionally tiny. Try asking about **pricing, products, services or my knowledge sources**.`,
  ]);
};

const knowledgeSummary = (chatbot) => {
  const { base, products, services } = chatbot?.knowledge || {};
  const parts = [];

  if (base?.length) parts.push(`${base.length} knowledge source${base.length === 1 ? "" : "s"}`);
  if (products?.length) parts.push(`${products.length} product${products.length === 1 ? "" : "s"}`);
  if (services?.length) parts.push(`${services.length} service${services.length === 1 ? "" : "s"}`);

  return parts.length ? parts.join(", ") : "an empty knowledge base";
};

export const getBotReplyDelay = () => 900 + Math.random() * 900;

export const buildVoiceTranscript = (chatbot) => {
  const name = chatbot?.name || "the assistant";
  const firstProduct = chatbot?.knowledge?.products?.[0]?.name;
  const firstService = chatbot?.knowledge?.services?.[0];

  const lines = [
    { speaker: "agent", text: `Hey! You're live with ${name}. Just talk naturally — I'm listening.` },
    { speaker: "user", text: "Hi! I wanted to ask about what you can help me with." },
    { speaker: "agent", text: "Sure — I can answer questions about the products and services connected to me, or just chat." },
  ];

  if (firstService) {
    lines.push(
      { speaker: "user", text: `Great. Could you tell me about the ${firstService.name.toLowerCase()}?` },
      {
        speaker: "agent",
        text: `Of course. It's ${firstService.durationMinutes} minutes${firstService.price ? ` for $${firstService.price}` : " and it's free of charge"}. Want me to book you in?`,
      },
    );
  } else if (firstProduct) {
    lines.push(
      { speaker: "user", text: `What can you tell me about the ${firstProduct.toLowerCase()}?` },
      { speaker: "agent", text: `The ${firstProduct.toLowerCase()} is one of our most popular picks. Want the full details?` },
    );
  } else {
    lines.push(
      { speaker: "user", text: "That sounds good. Where do you get your information from?" },
      { speaker: "agent", text: "Everything I know comes from the knowledge base connected to this demo — add some and I'll get smarter." },
    );
  }

  lines.push(
    { speaker: "user", text: "Perfect, that's exactly what I needed." },
    { speaker: "agent", text: "Happy to help! Anything else while we're talking?" },
    { speaker: "user", text: "No, that's all. Thanks!" },
    { speaker: "agent", text: "Anytime. Just tap the call button whenever you want to talk again." },
  );

  return lines;
};

export const VOICE_TRANSCRIPT_STEP_MS = 3400;
