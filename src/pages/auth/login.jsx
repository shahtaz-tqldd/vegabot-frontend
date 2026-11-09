import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm, Controller, useWatch } from "react-hook-form";
import { BadgeCheck, CheckCircle, Sparkles } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useLoginMutation } from "@/features/auth/authApiSlice";
import { userLoggedIn } from "@/features/auth/authSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import GoogleAuthButton from "./components/google-auth";
import AuthContainer from "./components/container";

const LoginPage = () => {
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState("");
  const [errorAnimationKey, setErrorAnimationKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const successMessage = location.state?.message;

  const [searchParams, setSearchParams] = useSearchParams();

  // Credentials can arrive via query params (e.g. redirected from the resume
  // app). Captured once so they survive the URL cleanup below.
  const [prefill] = useState(() => ({
    email: searchParams.get("email") || "",
    password: searchParams.get("password") || "",
  }));
  const hasPrefill = Boolean(prefill.email && prefill.password);

  // Scrub the credentials from the address bar once they're captured.
  useEffect(() => {
    if (!searchParams.has("email") && !searchParams.has("password")) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("email");
    nextParams.delete("password");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: prefill.email,
      password: prefill.password,
      rememberMe: true,
    },
  });
  const rememberMe = useWatch({ control, name: "rememberMe" });

  // Handle successful authentication
  const handleAuthSuccess = (accessToken, refreshToken, rememberMe) => {
    dispatch(userLoggedIn({ accessToken, refreshToken, rememberMe }));
    navigate("/", { replace: true });
  };

  const handleGoogleAuthSuccess = ({
    accessToken,
    refreshToken,
    rememberMe,
  }) => {
    handleAuthSuccess(accessToken, refreshToken, rememberMe);
    setError("");
  };

  const handleAuthError = (message) => {
    setError(message);
    setErrorAnimationKey((current) => current + 1);
  };

  const onSubmit = async (data) => {
    try {
      const res = await login({
        email: data.email,
        password: data.password,
        remember_me: data.rememberMe,
      }).unwrap();

      if (res.success && res.data) {
        handleAuthSuccess(
          res.data.access_token,
          res.data.refresh_token,
          data.rememberMe,
        );
        setError("");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError(getApiErrorMessage(error));
      setErrorAnimationKey((current) => current + 1);
    }
  };

  return (
    <AuthContainer
      title="Let's get started"
      description={
        <p>
          Sign in to access vegabot chatbot
        </p>
      }
    >
      {error && (
        <div
          key={errorAnimationKey}
          className="error-bounce mb-6 -mt-6 rounded-lg border border-red-200 bg-red-100 p-2 text-center text-xs"
        >
          <span className="text-red-500">{error}</span>
        </div>
      )}

      {!error && successMessage && (
        <div className="mb-6 -mt-6 rounded-lg border border-green-200 bg-green-100 p-2 text-center text-xs">
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}

      {hasPrefill && (
        <div
          className={cn(
            "mb-6 flex items-center justify-center gap-2 rounded-lg bg-emerald-600/10 p-2 text-center text-xs",
            !error && !successMessage && "-mt-2",
          )}
        >
          <BadgeCheck className="size-3.5 text-emerald-600" />
          <span className="font-medium text-emerald-600">
            Credentials are auto-filled from your link
          </span>
        </div>
      )}

      <div className="space-y-5">
        <GoogleAuthButton
          rememberMe={rememberMe}
          onAuthenticated={handleGoogleAuthSuccess}
          onError={handleAuthError}
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
        <Controller
          name="email"
          control={control}
          rules={{
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address",
            },
          }}
          render={({ field }) => (
            <FloatingInput
              {...field}
              label="Email Address"
              type="email"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          rules={{
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          }}
          render={({ field }) => (
            <FloatingInput
              {...field}
              label="Password"
              type="password"
              error={errors.password?.message}
            />
          )}
        />

        <div className="ml-2">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full h-11">
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="font-medium text-primary hover:underline"
        >
          Create one
        </Link>
      </p>
    </AuthContainer>
  );
};

export default LoginPage;
