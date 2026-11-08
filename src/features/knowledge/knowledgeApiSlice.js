import { apiSlice } from "../api/apiSlice";
import {
  normalizeKnowledgeSource,
  normalizeKnowledgeUsage,
  normalizeTrainingLog,
} from "./knowledge.helpers";

const KNOWLEDGE_URL = "/knowledge";

export const knowledgeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listKnowledge: builder.query({
      query: ({ chatbot, page = 1, page_size = 100 } = {}) => ({
        url: `${KNOWLEDGE_URL}/documents/list/`,
        method: "GET",
        params: { chatbot, page, page_size },
      }),
      transformResponse: (response = {}) => ({
        sources: (response.data ?? []).map(normalizeKnowledgeSource),
        meta: response.meta ?? {},
      }),
      providesTags: ["knowledge"],
    }),

    knowledgeDetails: builder.query({
      query: (knowledgeBaseId) => ({
        url: `${KNOWLEDGE_URL}/details/`,
        method: "GET",
        params: { knowledge_base_id: knowledgeBaseId },
      }),
      transformResponse: (response = {}) =>
        normalizeKnowledgeSource(response.data ?? {}),
      providesTags: (result, error, knowledgeBaseId) => [
        { type: "knowledge", id: knowledgeBaseId },
      ],
    }),

    uploadKnowledgeFile: builder.mutation({
      query: ({ chatbot, file, title } = {}) => {
        const formData = new FormData();
        formData.append("file", file);
        if (title) formData.append("title", title);

        return {
          url: `${KNOWLEDGE_URL}/upload/`,
          method: "POST",
          params: { chatbot, type: "file" },
          body: formData,
        };
      },
      invalidatesTags: ["knowledge"],
    }),

    uploadKnowledgeUrl: builder.mutation({
      query: ({ chatbot, url, title } = {}) => ({
        url: `${KNOWLEDGE_URL}/documents/website/`,
        method: "POST",
        params: { chatbot, type: "url" },
        body: title ? { chatbot, url, title } : { chatbot, url },
      }),
      invalidatesTags: ["knowledge"],
    }),

    uploadKnowledgeCustom: builder.mutation({
      query: ({ chatbot, content, title } = {}) => ({
        url: `${KNOWLEDGE_URL}/upload/`,
        method: "POST",
        params: { chatbot, type: "custom" },
        body: title ? { content, title } : { content },
      }),
      invalidatesTags: ["knowledge"],
    }),

    searchKnowledge: builder.mutation({
      query: ({ chatbotSlug, query } = {}) => ({
        url: `${KNOWLEDGE_URL}/search/`,
        method: "POST",
        body: { chatbotSlug, query },
      }),
      transformResponse: (response = {}) => response.data ?? [],
    }),

    knowledgeUsage: builder.query({
      query: (chatbot) => ({
        url: `${KNOWLEDGE_URL}/usage/`,
        method: "GET",
        params: { chatbot },
      }),
      transformResponse: (response = {}) =>
        normalizeKnowledgeUsage(response.data ?? response ?? {}),
      providesTags: ["knowledge"],
    }),

    retrainKnowledge: builder.mutation({
      query: ({ knowledgeBaseId, type, content, title } = {}) => {
        const body = {};
        if (content !== undefined) body.content = content;
        if (title !== undefined) body.title = title;

        return {
          url: `${KNOWLEDGE_URL}/update/`,
          method: "PATCH",
          params: { knowledge_base_id: knowledgeBaseId, type },
          body: Object.keys(body).length ? body : undefined,
        };
      },
      invalidatesTags: (result, error, { knowledgeBaseId } = {}) => [
        "knowledge",
        { type: "knowledge", id: knowledgeBaseId },
      ],
    }),

    deleteKnowledge: builder.mutation({
      query: (knowledgeBaseId) => ({
        url: `${KNOWLEDGE_URL}/delete/`,
        method: "DELETE",
        params: { knowledge_base_id: knowledgeBaseId },
      }),
      invalidatesTags: (result, error, knowledgeBaseId) => [
        "knowledge",
        { type: "knowledge", id: knowledgeBaseId },
      ],
    }),

    trainingLogs: builder.query({
      query: ({ chatbot, page = 1, page_size = 20 } = {}) => ({
        url: `${KNOWLEDGE_URL}/training-logs/`,
        method: "GET",
        params: { chatbot, page, page_size },
      }),
      transformResponse: (response = {}) => ({
        logs: (response.data ?? []).map(normalizeTrainingLog),
        meta: response.meta ?? {},
      }),
      providesTags: ["knowledge"],
    }),
  }),
});

export const {
  useListKnowledgeQuery,
  useKnowledgeDetailsQuery,
  useUploadKnowledgeFileMutation,
  useUploadKnowledgeUrlMutation,
  useUploadKnowledgeCustomMutation,
  useSearchKnowledgeMutation,
  useKnowledgeUsageQuery,
  useRetrainKnowledgeMutation,
  useDeleteKnowledgeMutation,
  useTrainingLogsQuery,
} = knowledgeApiSlice;
