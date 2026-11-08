import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { useGoogleAuthMutation } from "@/features/auth/authApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase";

const createGoogleBackendPayload = async (authResult) => {
  const { user } = authResult;
  const idToken = await user.getIdToken();
  const credential = GoogleAuthProvider.credentialFromResult(authResult);

  return {
    provider: "google",
    firebase_id_token: idToken,
    google_access_token: credential?.accessToken || null,
    firebase_uid: user.uid,
    email: user.email,
    email_verified: user.emailVerified,
    name: user.displayName,
    photo_url: user.photoURL,
    phone_number: user.phoneNumber,
  };
};

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
);

const GoogleAuthButton = ({ onAuthenticated, rememberMe = false, onError }) => {
  const [googleAuth] = useGoogleAuthMutation();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);

    try {
      const authResult = await signInWithPopup(
        getFirebaseAuth(),
        getGoogleProvider(),
      );
      const payload = await createGoogleBackendPayload(authResult);
      const res = await googleAuth(payload).unwrap();
      const authData = res?.data || {};

      if (authData.access_token && authData.refresh_token) {
        onAuthenticated({
          accessToken: authData.access_token,
          refreshToken: authData.refresh_token,
          rememberMe,
        });
        return;
      }

      throw new Error("Google sign-in succeeded, but backend tokens were missing.");
    } catch (error) {
      console.error("Google authentication failed:", error);
      onError?.(
        error?.message ||
          getApiErrorMessage(error, "Failed to continue with Google!"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isLoading}
      onClick={handleGoogleAuth}
      className="h-11 w-full border-border bg-card text-foreground hover:bg-accent"
    >
      <GoogleMark />
      {isLoading ? "Connecting..." : "Continue with Google"}
    </Button>
  );
};

export default GoogleAuthButton;
