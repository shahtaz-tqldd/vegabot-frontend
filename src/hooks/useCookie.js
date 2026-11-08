import { decodeJWT } from "@/lib/jwt-decoder";

export const setAuthCookie = (auth, name = "argon", path = "/") => {
  const { accessToken, refreshToken } = auth;

  try {
    const { exp } = decodeJWT(accessToken);
    const millisecondsUntilExpiration = exp ? exp * 1000 - Date.now() : 0;

    // Set secure defaults
    let cookieFlags = "; SameSite=Strict";

    // Add Secure flag in production
    if (import.meta.env.PROD) {
      cookieFlags += "; Secure";
    }

    // Set access token with appropriate expiration
    const accessExpires = new Date(Date.now() + millisecondsUntilExpiration);
    document.cookie = `${name}_access=${accessToken}; expires=${accessExpires.toUTCString()}; path=${path}${cookieFlags}`;

    if (refreshToken) {
      // Set refresh token with longer expiration (15 days)
      const refreshExpires = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      document.cookie = `${name}_refresh=${refreshToken}; expires=${refreshExpires.toUTCString()}; path=${path}${cookieFlags}`;
    }

    // Store token expiration time in localStorage for quick validation
    localStorage.setItem(`${name}_exp`, exp.toString());
  } catch (error) {
    console.error("Failed to set authentication cookies:", error);
    throw error;
  }
};

export const getAuthCookie = (name = "argon") => {
  const getCookie = (cookieName) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${cookieName}=`);
    if (parts.length === 2) {
      return parts.pop().split(";").shift();
    }
    return null;
  };

  const accessToken = getCookie(`${name}_access`);
  const refreshToken = getCookie(`${name}_refresh`);
  const tokenExp = localStorage.getItem(`${name}_exp`);

  // Quick expiration check without decoding token
  const isExpired = tokenExp && parseInt(tokenExp) * 1000 < Date.now();

  return {
    accessToken: isExpired ? null : accessToken,
    refreshToken,
    isExpired,
  };
};

export const removeAuthCookie = (name = "argon", path = "/") => {
  const cookieFlags = import.meta.env.PROD
    ? "; Secure; SameSite=Strict"
    : "; SameSite=Strict";

  // Remove cookies by setting immediate expiration
  document.cookie = `${name}_access=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${cookieFlags}`;
  document.cookie = `${name}_refresh=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${cookieFlags}`;

  // Clear localStorage
  localStorage.removeItem(`${name}_exp`);
};

// New function to check if user is authenticated
export const isAuthenticated = (name = "argon") => {
  const { accessToken, refreshToken, isExpired } = getAuthCookie(name);

  if (!accessToken && !refreshToken) {
    return false;
  }

  if (isExpired && !refreshToken) {
    return false;
  }

  return true;
};
