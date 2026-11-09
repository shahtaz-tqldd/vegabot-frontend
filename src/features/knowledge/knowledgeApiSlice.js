import { apiSlice } from "../api/apiSlice";
import {
  normalizeKnowledgeSource,
  normalizeProduct,
  normalizeService,
  normalizeTrainingLog,
} from "./knowledge.helpers";

const KNOWLEDGE_URL = "/knowledge";

const parseFileName = (disposition, fallback) => {
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition || "");

  return match ? decodeURIComponent(match[1].trim()) : fallback;
};

// Template downloads return the CSV file itself, not the JSON envelope.
const templateResponseHandler = (fallbackName) => async (response) => ({
  blob: await response.blob(),
  fileName: parseFileName(
    response.headers.get("content-disposition"),
    fallbackName,
  ),
});

export const knowledgeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* ----- Base knowledge ----- */
    listKnowledge: builder.query({
      query: ({ chatbot, page = 1, page_size = 100, status, source_type } = {}) => ({
        url: `${KNOWLEDGE_URL}/base/list/`,
        method: "GET",
        params: { chatbot, page, page_size, status, source_type },
      }),
      transformResponse: (response = {}) => ({
        sources: (response.data ?? []).map(normalizeKnowledgeSource),
        meta: response.meta ?? {},
      }),
      providesTags: ["knowledge"],
    }),

    uploadKnowledgeFile: builder.mutation({
      query: ({ chatbot, file, title } = {}) => {
        const formData = new FormData();
        formData.append("chatbot", chatbot);
        formData.append("file", file);
        if (title) formData.append("title", title);

        return {
          url: `${KNOWLEDGE_URL}/base/upload-file/`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["knowledge"],
    }),

    uploadKnowledgeUrl: builder.mutation({
      query: ({ chatbot, url, title } = {}) => ({
        url: `${KNOWLEDGE_URL}/base/upload-url/`,
        method: "POST",
        body: title ? { chatbot, url, title } : { chatbot, url },
      }),
      invalidatesTags: ["knowledge"],
    }),

    uploadKnowledgeText: builder.mutation({
      query: ({ chatbot, content, title } = {}) => ({
        url: `${KNOWLEDGE_URL}/base/upload-text/`,
        method: "POST",
        body: title ? { chatbot, content, title } : { chatbot, content },
      }),
      invalidatesTags: ["knowledge"],
    }),

    // URL sources only — files and text are immutable (delete + re-add).
    retrainKnowledge: builder.mutation({
      query: ({ chatbot, document, force } = {}) => ({
        url: `${KNOWLEDGE_URL}/base/retrain/`,
        method: "POST",
        params: { chatbot, document },
        body: force ? { force: true } : undefined,
      }),
      invalidatesTags: ["knowledge"],
    }),

    deleteKnowledge: builder.mutation({
      query: ({ chatbot, document } = {}) => ({
        url: `${KNOWLEDGE_URL}/base/delete/`,
        method: "DELETE",
        params: { chatbot, document },
      }),
      invalidatesTags: ["knowledge"],
    }),

    /* ----- Products ----- */
    downloadProductTemplate: builder.query({
      query: () => ({
        url: `${KNOWLEDGE_URL}/products/template/`,
        method: "GET",
        responseHandler: templateResponseHandler("products-template.csv"),
      }),
    }),

    listProducts: builder.query({
      query: ({ chatbot, page = 1, page_size = 100, search, status } = {}) => ({
        url: `${KNOWLEDGE_URL}/products/list/`,
        method: "GET",
        params: { chatbot, page, page_size, search, status },
      }),
      transformResponse: (response = {}) => ({
        products: (response.data ?? []).map(normalizeProduct),
        meta: response.meta ?? {},
      }),
      providesTags: ["knowledge"],
    }),

    importProducts: builder.mutation({
      query: ({ chatbot, file } = {}) => {
        const formData = new FormData();
        formData.append("chatbot", chatbot);
        formData.append("file", file);

        return {
          url: `${KNOWLEDGE_URL}/products/import/`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["knowledge"],
    }),

    updateProduct: builder.mutation({
      query: ({ chatbot, product, ...changes } = {}) => ({
        url: `${KNOWLEDGE_URL}/products/update/`,
        method: "PATCH",
        params: { chatbot, product },
        body: changes,
      }),
      invalidatesTags: ["knowledge"],
    }),

    disableProducts: builder.mutation({
      query: ({ chatbot, products } = {}) => ({
        url: `${KNOWLEDGE_URL}/products/disable/`,
        method: "POST",
        body: { chatbot, products },
      }),
      invalidatesTags: ["knowledge"],
    }),

    /* ----- Services ----- */
    downloadServiceTemplate: builder.query({
      query: () => ({
        url: `${KNOWLEDGE_URL}/services/template/`,
        method: "GET",
        responseHandler: templateResponseHandler("services-template.csv"),
      }),
    }),

    listServices: builder.query({
      query: ({ chatbot, page = 1, page_size = 100, search, status } = {}) => ({
        url: `${KNOWLEDGE_URL}/services/list/`,
        method: "GET",
        params: { chatbot, page, page_size, search, status },
      }),
      transformResponse: (response = {}) => ({
        services: (response.data ?? []).map(normalizeService),
        meta: response.meta ?? {},
      }),
      providesTags: ["knowledge"],
    }),

    importServices: builder.mutation({
      query: ({ chatbot, file } = {}) => {
        const formData = new FormData();
        formData.append("chatbot", chatbot);
        formData.append("file", file);

        return {
          url: `${KNOWLEDGE_URL}/services/import/`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["knowledge"],
    }),

    createService: builder.mutation({
      query: ({ chatbot, ...service } = {}) => ({
        url: `${KNOWLEDGE_URL}/services/create/`,
        method: "POST",
        body: { chatbot, ...service },
      }),
      invalidatesTags: ["knowledge"],
    }),

    bulkCreateServices: builder.mutation({
      query: ({ chatbot, services } = {}) => ({
        url: `${KNOWLEDGE_URL}/services/bulk-create/`,
        method: "POST",
        body: { chatbot, services },
      }),
      invalidatesTags: ["knowledge"],
    }),

    updateService: builder.mutation({
      query: ({ chatbot, service, ...changes } = {}) => ({
        url: `${KNOWLEDGE_URL}/services/update/`,
        method: "PATCH",
        params: { chatbot, service },
        body: changes,
      }),
      invalidatesTags: ["knowledge"],
    }),

    deleteService: builder.mutation({
      query: ({ chatbot, service } = {}) => ({
        url: `${KNOWLEDGE_URL}/services/delete/`,
        method: "DELETE",
        params: { chatbot, service },
      }),
      invalidatesTags: ["knowledge"],
    }),

    /* ----- Search & training logs ----- */
    searchKnowledge: builder.mutation({
      query: ({ chatbot, query, source, limit } = {}) => ({
        url: `${KNOWLEDGE_URL}/search/`,
        method: "POST",
        body: { chatbot, query, ...(source ? { source } : {}), ...(limit ? { limit } : {}) },
      }),
      transformResponse: (response = {}) => response.data ?? [],
    }),

    trainingLogs: builder.query({
      query: ({ chatbot, page = 1, page_size = 20, space } = {}) => ({
        url: `${KNOWLEDGE_URL}/logs/list/`,
        method: "GET",
        params: { chatbot, page, page_size, space },
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
  useUploadKnowledgeFileMutation,
  useUploadKnowledgeUrlMutation,
  useUploadKnowledgeTextMutation,
  useRetrainKnowledgeMutation,
  useDeleteKnowledgeMutation,
  useLazyDownloadProductTemplateQuery,
  useListProductsQuery,
  useImportProductsMutation,
  useUpdateProductMutation,
  useDisableProductsMutation,
  useLazyDownloadServiceTemplateQuery,
  useListServicesQuery,
  useImportServicesMutation,
  useCreateServiceMutation,
  useBulkCreateServicesMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useSearchKnowledgeMutation,
  useTrainingLogsQuery,
} = knowledgeApiSlice;
