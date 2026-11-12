import { apiSlice } from "../api/apiSlice";
import {
  normalizeCartItem,
  normalizeEscalation,
  normalizeMessage,
  normalizeOrder,
  normalizeSessionDetail,
  normalizeSessionSummary,
} from "./chat.helpers";

const CHAT_URL = "/chat";

// JSON is fine for text-only sends; switch to multipart when files ride along.
const toSendBody = ({ session, content, attachments = [] }) => {
  const files = (attachments ?? []).filter(
    (file) => file instanceof File || file instanceof Blob,
  );

  if (!files.length) return { session, content: content ?? "" };

  const formData = new FormData();

  formData.append("session", session);
  if (content?.trim()) formData.append("content", content.trim());
  files.forEach((file) => formData.append("attachments", file));

  return formData;
};

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createChatSession: builder.mutation({
      query: ({ chatbot }) => ({
        url: `${CHAT_URL}/sessions/create/`,
        method: "POST",
        body: { chatbot },
      }),
      transformResponse: (response = {}) =>
        normalizeSessionDetail(response.data ?? {}),
      invalidatesTags: [{ type: "chat-sessions", id: "LIST" }],
    }),

    listChatSessions: builder.query({
      query: ({ page = 1, page_size = 50 } = {}) => ({
        url: `${CHAT_URL}/sessions/list/`,
        method: "GET",
        params: { page, page_size },
      }),
      transformResponse: (response = {}) => ({
        sessions: (response.data ?? []).map(normalizeSessionSummary),
        meta: response.meta ?? {},
      }),
      providesTags: [{ type: "chat-sessions", id: "LIST" }],
    }),

    chatSessionDetails: builder.query({
      query: (session) => ({
        url: `${CHAT_URL}/sessions/details/`,
        method: "GET",
        params: { session },
      }),
      transformResponse: (response = {}) =>
        normalizeSessionDetail(response.data ?? {}),
      providesTags: (result, error, session) => [
        { type: "chat-sessions", id: `SESSION-${session}` },
      ],
    }),

    deleteChatSession: builder.mutation({
      query: (session) => ({
        url: `${CHAT_URL}/sessions/delete/`,
        method: "DELETE",
        params: { session },
      }),
      invalidatesTags: (result, error, session) => [
        { type: "chat-sessions", id: "LIST" },
        { type: "chat-sessions", id: `SESSION-${session}` },
      ],
    }),

    listChatMessages: builder.query({
      query: ({ session, page = 1, page_size = 50 } = {}) => ({
        url: `${CHAT_URL}/messages/list/`,
        method: "GET",
        params: { session, page, page_size },
      }),
      transformResponse: (response = {}) => ({
        messages: (response.data ?? []).map(normalizeMessage),
        meta: response.meta ?? {},
      }),
      providesTags: (result, error, arg) => [
        { type: "chat-messages", id: arg?.session ?? "LIST" },
      ],
    }),

    sendChatMessage: builder.mutation({
      query: ({ session, content, attachments }) => ({
        url: `${CHAT_URL}/messages/send/`,
        method: "POST",
        body: toSendBody({ session, content, attachments }),
      }),
      transformResponse: (response = {}) =>
        normalizeMessage(response.data ?? {}),
      // Keeps the session list summaries (last message, counts) fresh.
      invalidatesTags: (result, error, { session } = {}) => [
        { type: "chat-sessions", id: "LIST" },
        { type: "chat-messages", id: session },
      ],
    }),

    // Session side panels. All three 404 for sessions the user can't see.
    sessionCartItems: builder.query({
      query: ({ session, status, page = 1, page_size = 20 }) => ({
        url: `${CHAT_URL}/sessions/cart-items/`,
        method: "GET",
        params: { session, page, page_size, ...(status ? { status } : {}) },
      }),
      transformResponse: (response = {}) => ({
        items: (response.data ?? []).map(normalizeCartItem),
        meta: response.meta ?? {},
      }),
      providesTags: (result, error, { session } = {}) => [
        { type: "chat-sessions", id: `CART-${session}` },
      ],
    }),

    sessionOrders: builder.query({
      query: ({ session, page = 1, page_size = 20 }) => ({
        url: `${CHAT_URL}/sessions/orders/`,
        method: "GET",
        params: { session, page, page_size },
      }),
      transformResponse: (response = {}) => ({
        items: (response.data ?? []).map(normalizeOrder),
        meta: response.meta ?? {},
      }),
      providesTags: (result, error, { session } = {}) => [
        { type: "chat-sessions", id: `ORDERS-${session}` },
      ],
    }),

    sessionEscalations: builder.query({
      query: ({ session, page = 1, page_size = 20 }) => ({
        url: `${CHAT_URL}/sessions/escalations/`,
        method: "GET",
        params: { session, page, page_size },
      }),
      transformResponse: (response = {}) => ({
        items: (response.data ?? []).map(normalizeEscalation),
        meta: response.meta ?? {},
      }),
      providesTags: (result, error, { session } = {}) => [
        { type: "chat-sessions", id: `ESCALATIONS-${session}` },
      ],
    }),
  }),
});

export const {
  useCreateChatSessionMutation,
  useListChatSessionsQuery,
  useChatSessionDetailsQuery,
  useDeleteChatSessionMutation,
  useListChatMessagesQuery,
  useSendChatMessageMutation,
  useSessionCartItemsQuery,
  useSessionOrdersQuery,
  useSessionEscalationsQuery,
} = chatApiSlice;
