import { apiSlice } from "../api/apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => {
        return {
          url: `/accounts/login/`,
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["my-profile"],
    }),

    register: builder.mutation({
      query: (payload) => {
        return {
          url: `/accounts/register/`,
          method: "POST",
          body: payload,
        };
      },
    }),

    verifyOTP: builder.mutation({
      query: (payload) => {
        return {
          url: `/accounts/verify-otp/`,
          method: "POST",
          body: payload,
        };
      },
    }),

    googleAuth: builder.mutation({
      query: (payload) => {
        return {
          url: `/accounts/google/`,
          method: "POST",
          body: payload,
        };
      },
      invalidatesTags: ["my-profile"],
    }),

    refresh: builder.mutation({
      query: (payload) => {
        return {
          url: `/accounts/refresh/`,
          method: "POST",
          body: payload,
        };
      },
    }),

    publicAccount: builder.query({
      query: (username) => {
        return {
          url: `/accounts/public/${username}/`,
          method: "GET",
        };
      },
    }),

    userProfile: builder.query({
      query: ({ username }) => {
        return {
          url: `/accounts/${username}/`,
          method: "GET",
        };
      },
    }),

    selfDetails: builder.query({
      query: () => {
        return {
          url: `/accounts/profile/details/`,
          method: "GET",
        };
      },
      providesTags: ["my-profile"],
    }),

    profileStates: builder.query({
      query: () => {
        return {
          url: `/accounts/profile-states/`,
          method: "GET",
        };
      },
      providesTags: ["profile-states"],
    }),

    updateAccount: builder.mutation({
      query: (payload) => {
        return {
          url: `/accounts/profile/update/`,
          method: "PATCH",
          body: payload,
        };
      },
      invalidatesTags: ["my-profile"],
    }),

    changePassword: builder.mutation({
      query: (payload) => {
        return {
          url: `/accounts/change-password/`,
          method: "PATCH",
          body: payload,
        };
      },
    }),

    deleteAccount: builder.mutation({
      query: () => {
        return {
          url: `accounts/settings/delete-account/`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["my-profile"],
    }),

    requestResetPassword: builder.mutation({
      query: (payload) => {
        return {
          url: `/accounts/request-reset-password/`,
          method: "POST",
          body: payload,
        };
      },
    }),

    resetPassword: builder.mutation({
      query: (payload) => {
        return {
          url: `/accounts/reset-password/`,
          method: "POST",
          body: payload,
        };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useUserProfileQuery,
  useRegisterMutation,
  useVerifyOTPMutation,
  useGoogleAuthMutation,
  useRefreshMutation,
  usePublicAccountQuery,
  useSelfDetailsQuery,
  useProfileStatesQuery,
  useUpdateAccountMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useRequestResetPasswordMutation,
  useResetPasswordMutation,
} = authApiSlice;
