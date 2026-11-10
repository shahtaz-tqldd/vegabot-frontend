import { apiSlice } from "../api/apiSlice";
import { normalizeNotification } from "./notifications.helpers";

const NOTIFICATIONS_URL = "/notifications";

export const notificationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query({
      query: ({
        page = 1,
        page_size = 20,
        recipient_type,
        notification_type,
        workspace_id,
        chatbot_id,
        unread_only,
      } = {}) => ({
        url: `${NOTIFICATIONS_URL}/`,
        method: "GET",
        params: {
          page,
          page_size,
          recipient_type,
          notification_type,
          workspace_id,
          chatbot_id,
          unread_only: unread_only ? "true" : undefined,
        },
      }),
      transformResponse: (response = {}) => ({
        notifications: (response.data ?? []).map(normalizeNotification),
        meta: response.meta ?? {},
      }),
      providesTags: [{ type: "notifications", id: "LIST" }],
    }),

    markNotificationRead: builder.mutation({
      query: ({ notification } = {}) => ({
        url: `${NOTIFICATIONS_URL}/${notification}/read/`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "notifications", id: "LIST" }],
    }),

    markAllNotificationsRead: builder.mutation({
      query: ({
        recipient_type,
        notification_type,
        workspace_id,
        chatbot_id,
        unread_only,
      } = {}) => ({
        url: `${NOTIFICATIONS_URL}/read-all/`,
        method: "PATCH",
        params: {
          recipient_type,
          notification_type,
          workspace_id,
          chatbot_id,
          unread_only: unread_only ? "true" : undefined,
        },
      }),
      invalidatesTags: [{ type: "notifications", id: "LIST" }],
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApiSlice;
