import { setAuthCookie } from "@/hooks/useCookie";
import { clearTokens, getTokens, setSessionToken } from "@/hooks/useToken";
import { INITIAL_REDIRECT_SESSION_KEY } from "@/constants/session";
import { createSlice } from "@reduxjs/toolkit";

const { accessToken, refreshToken } = getTokens();

const initialState = {
  accessToken: accessToken || null,
  user: null,
  isAuthenticated: !!(accessToken || refreshToken),
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userLoggedIn: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      if (action.payload.rememberMe) {
        setAuthCookie(action.payload);
      } else {
        setSessionToken(
          action.payload.accessToken,
          action.payload.refreshToken
        );
      }
    },
    userDetailsFetched: (state, action) => {
      state.user = action.payload;
    },
    userCreditSpent: (state, action) => {
      const creditSpent = Number(action.payload);
      const currentCredit = Number(state.user?.credit);

      if (
        !Number.isInteger(creditSpent) ||
        creditSpent <= 0 ||
        !Number.isFinite(currentCredit)
      ) {
        return;
      }

      state.user.credit = Math.max(0, currentCredit - creditSpent);
    },
    userLoggedOut: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      clearTokens();
      try {
        window.sessionStorage.removeItem(INITIAL_REDIRECT_SESSION_KEY);
      } catch {
        // Session storage may be unavailable in restricted browsers.
      }
    },
  },
});

export const {
  userLoggedIn,
  userDetailsFetched,
  userCreditSpent,
  userLoggedOut,
} = authSlice.actions;

export default authSlice.reducer;
