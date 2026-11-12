import { apiSlice } from "../api/apiSlice";
import { normalizeChatbot, toChatbotPayload } from "./chatbot.helpers";
import { normalizeVoiceOptions } from "./voice.helpers";

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

    // ── Voices ────────────────────────────────────────────────────────────

    voiceOptions: builder.query({
      query: () => ({ url: `${CHATBOTS_URL}/voices/options/`, method: "GET" }),
      transformResponse: (response = {}) =>
        normalizeVoiceOptions(response.data ?? response),
      keepUnusedDataFor: 3600,
    }),

    // The first request for a voice generates the clip (a few seconds), so
    // it's fetched lazily when someone presses play.
    voicePreview: builder.query({
      query: (voice) => ({
        url: `${CHATBOTS_URL}/voices/preview/`,
        method: "GET",
        params: { voice },
      }),
      transformResponse: (response = {}) => {
        const data = response.data ?? response;
        return { voice: data.voice, previewUrl: data.preview_url ?? null };
      },
      keepUnusedDataFor: 3600,
    }),

    selectVoice: builder.mutation({
      query: ({ chatbot, voiceType, voiceName, customVoice, speakingPace }) => {
        const body = { voice_type: voiceType };
        if (voiceType === "prebuilt") body.voice_name = voiceName;
        if (voiceType === "custom") body.custom_voice = customVoice;
        if (speakingPace) body.speaking_pace = speakingPace;

        return {
          url: `${CHATBOTS_URL}/voices/select/`,
          method: "PATCH",
          params: { chatbot },
          body,
        };
      },
      invalidatesTags: (result, error, { chatbot } = {}) => [
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
  useVoiceOptionsQuery,
  useLazyVoicePreviewQuery,
  useSelectVoiceMutation,
} = chatbotApiSlice;
