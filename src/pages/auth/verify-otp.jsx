import React, { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PENDING_VERIFICATION_EMAIL_KEY } from "@/constants/session";
import { useVerifyOTPMutation } from "@/features/auth/authApiSlice";
import { userLoggedIn } from "@/features/auth/authSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import AuthContainer from "./components/container";

const OTP_LENGTH = 4;

const VerifyOtpPage = () => {
  const [verifyOTP, { isLoading }] = useVerifyOTPMutation();
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [errorAnimationKey, setErrorAnimationKey] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const storedEmail = (() => {
    try {
      return window.sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
    } catch {
      return null;
    }
  })();

  const email = location.state?.email || storedEmail || "";
  const code = digits.join("");

  const showError = (message) => {
    setError(message);
    setErrorAnimationKey((current) => current + 1);
  };

  const setDigit = (index, value) => {
    const clean = value.replace(/\D/g, "");

    if (!clean) {
      setDigits((current) =>
        current.map((digit, i) => (i === index ? "" : digit)),
      );
      return;
    }

    setDigits((current) => {
      const next = [...current];
      clean
        .slice(0, OTP_LENGTH - index)
        .split("")
        .forEach((char, offset) => {
          next[index + offset] = char;
        });
      return next;
    });

    const nextIndex = Math.min(index + clean.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (event) => {
    event?.preventDefault();

    if (code.length !== OTP_LENGTH) {
      showError("Enter the 6-digit code from your email");
      return;
    }

    try {
      const res = await verifyOTP({ email, otp: code }).unwrap();
      const tokens = res?.data || {};

      if (tokens.access_token) {
        dispatch(
          userLoggedIn({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            rememberMe: true,
          }),
        );
      }

      try {
        window.sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
      } catch {
        // Storage may be unavailable; nothing critical to clean up.
      }

      navigate("/", { replace: true });
    } catch (verifyError) {
      console.error("Verification failed:", verifyError);
      showError(getApiErrorMessage(verifyError, "Verification failed"));
    }
  };

  const handleResend = () => {
    toast.info("Demo tip", {
      description: "The resend endpoint will be connected with the backend.",
    });
  };

  return (
    <AuthContainer
      title="Verify your email"
      description={
        <p>
          {email ? (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-primary">{email}</span>
            </>
          ) : (
            "Enter the 6-digit code we sent to your email"
          )}
        </p>
      }
    >
      {error && (
        <div
          key={errorAnimationKey}
          className="error-bounce mb-6 -mt-4 rounded-lg border border-red-200 bg-red-100 p-2 text-center text-xs"
        >
          <span className="text-red-500">{error}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-between gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputRefs.current[index] = node;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              value={digit}
              onChange={(event) => setDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              className="h-14 w-full rounded-xl border border-input bg-card text-center text-lg font-bold text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          ))}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full"
        >
          {isLoading ? "Verifying…" : "Verify account"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Didn't get the code?{" "}
        <button
          type="button"
          onClick={handleResend}
          className="font-medium text-primary hover:underline"
        >
          Resend
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Wrong email?{" "}
        <Link
          to="/register"
          className="font-medium text-primary hover:underline"
        >
          Go back
        </Link>
      </p>
    </AuthContainer>
  );
};

export default VerifyOtpPage;
