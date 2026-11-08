import { apiSlice } from "../api/apiSlice";
import { normalizeChatbot, toChatbotPayload } from "./chatbot.helpers";

const CHATBOTS_URL = "/chatbots";

const hasFile = (payload = {}) =>
  Object.values(payload).some((value) => value instanceof File);

// JSON payloads can't carry files — switch to multipart form data when needed.
const toRequestBody = (payload) => {
  if (!hasFile(payload)) return payload;

  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "object" && !(value instanceof File)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });

  return formData;
};

export const chatbotApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listChatbots: builder.query({
      query: ({ page = 1, page_size = 100 } = {}) => ({
        url: `${CHATBOTS_URL}/list/`,
        method: "GET",
        params: { page, page_size },
      }),
      transformResponse: (response = {}) => ({
        chatbots: (response.data ?? []).map(normalizeChatbot),
        meta: response.meta ?? {},
      }),
      providesTags: [{ type: "chatbots", id: "LIST" }],
    }),

    chatbotDetails: builder.query({
      query: (chatbot) => ({
        url: `${CHATBOTS_URL}/details/`,
        method: "GET",
        params: { chatbot },
      }),
      transformResponse: (response = {}) =>
        normalizeChatbot(response.data ?? {}),
      providesTags: (result, error, chatbot) => [
        { type: "chatbots", id: "LIST" },
        { type: "chatbots", id: chatbot },
      ],
    }),

    createChatbot: builder.mutation({
      query: (values) => ({
        url: `${CHATBOTS_URL}/create/`,
        method: "POST",
        body: toRequestBody(toChatbotPayload(values)),
      }),
      invalidatesTags: [{ type: "chatbots", id: "LIST" }],
    }),

    updateChatbot: builder.mutation({
      query: ({ chatbot, ...changes } = {}) => ({
        url: `${CHATBOTS_URL}/update/`,
        method: "PATCH",
        params: { chatbot },
        body: toRequestBody(toChatbotPayload(changes)),
      }),
      invalidatesTags: (result, error, { chatbot } = {}) => [
        { type: "chatbots", id: "LIST" },
        { type: "chatbots", id: chatbot },
      ],
    }),

    deleteChatbot: builder.mutation({
      query: (chatbot) => ({
        url: `${CHATBOTS_URL}/delete/`,
        method: "DELETE",
        params: { chatbot },
      }),
      invalidatesTags: (result, error, chatbot) => [
        { type: "chatbots", id: "LIST" },
        { type: "chatbots", id: chatbot },
      ],
    }),
  }),
});

export const {
  useListChatbotsQuery,
  useChatbotDetailsQuery,
  useCreateChatbotMutation,
  useUpdateChatbotMutation,
  useDeleteChatbotMutation,
} = chatbotApiSlice;
