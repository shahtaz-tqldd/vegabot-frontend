import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn, userLoggedOut } from "@/features/auth/authSlice";
import { getTokens } from "@/hooks/useToken";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL;
let refreshPromise = null;

const getTokenPayload = (data = {}) => data.data || data;

const getAccessToken = (data = {}) =>
  data.access_token || data.accessToken || data.access;

const getRefreshToken = (data = {}) =>
  data.refresh_token || data.refreshToken || data.refresh;

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    const { accessToken } = getTokens();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  const { refreshToken, rememberMe } = getTokens();

  if (!refreshToken) {
    api.dispatch(userLoggedOut());
    return result;
  }

  if (!refreshPromise) {
    refreshPromise = baseQuery(
      {
        url: "/accounts/refresh/",
        method: "POST",
        body: { refresh: refreshToken },
        credentials: "include",
      },
      api,
      extraOptions,
    )
      .then((refreshResult) => {
        const refreshData = getTokenPayload(refreshResult.data);
        const nextAccessToken = getAccessToken(refreshData);

        if (refreshResult.error || !nextAccessToken) {
          api.dispatch(userLoggedOut());
          return false;
        }

        api.dispatch(
          userLoggedIn({
            accessToken: nextAccessToken,
            refreshToken: getRefreshToken(refreshData) || refreshToken,
            rememberMe,
          }),
        );

        return true;
      })
      .catch((error) => {
        console.error("Refresh token failed:", error);
        api.dispatch(userLoggedOut());
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  const refreshSucceeded = await refreshPromise;

  if (refreshSucceeded) {
    result = await baseQuery(args, api, extraOptions);
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "apiSlice",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "my-profile",
    "profile-states",
    "chatbots",
    "knowledge",
    "chat-sessions",
    "chat-messages",
  ],
  keepUnusedDataFor: 300, // Don't keep any unused data
  refetchOnMountOrArgChange: false, // Always refetch when component mounts
  refetchOnReconnect: true, // Refetch on reconnection
  endpoints: () => ({}),
});

// Export utility functions for cache management
export const {
  util: { resetApiState },
} = apiSlice;
