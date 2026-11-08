import { getAuthCookie, removeAuthCookie } from "./useCookie";

export const getTokens = () => {
  const { accessToken: cookieAccessToken, refreshToken: cookieRefreshToken } =
    getAuthCookie();

  const sessionAccessToken = sessionStorage.getItem("argon_access");
  const sessionRefreshToken = sessionStorage.getItem("argon_refresh");

  if (cookieRefreshToken) {
    return {
      accessToken: cookieAccessToken,
      refreshToken: cookieRefreshToken,
      rememberMe: true,
    };
  } else {
    return {
      accessToken: sessionAccessToken,
      refreshToken: sessionRefreshToken,
      rememberMe: false,
    };
  }
};

export const clearTokens = () => {
  sessionStorage.removeItem("argon_access");
  sessionStorage.removeItem("argon_refresh");
  removeAuthCookie();
};

export const setSessionToken = (accessToken, refreshToken) => {
  sessionStorage.setItem("argon_access", accessToken);
  sessionStorage.setItem("argon_refresh", refreshToken);
};
