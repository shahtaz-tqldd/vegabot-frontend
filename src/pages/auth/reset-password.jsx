import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/input";
import { useResetPasswordMutation } from "@/features/auth/authApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import AuthContainer from "./components/container";

const ResetPasswordPage = () => {
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [errorAnimationKey, setErrorAnimationKey] = useState(0);
  const navigate = useNavigate();

  const initialToken =
    searchParams.get("token") ||
    searchParams.get("reset_token") ||
    searchParams.get("uid") ||
    "";
  const initialEmail = searchParams.get("email") || "";

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: initialEmail,
      token: initialToken,
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, value]) => String(value).trim() !== ""),
      );
      await resetPassword(payload).unwrap();
      navigate("/login", {
        replace: true,
        state: { message: "Password reset successfully. Sign in to continue." },
      });
    } catch (error) {
      console.error("Password reset failed:", error);
      setError(getApiErrorMessage(error, "Failed to reset password!"));
      setErrorAnimationKey((current) => current + 1);
    }
  };

  return (
    <AuthContainer
      title="Set new password"
      description="Choose a new password for your
      argon chatbot account."
    >
      {error && (
        <div
          key={errorAnimationKey}
          className="error-bounce mb-6 -mt-4 rounded-lg border border-red-200 bg-red-100 p-2 text-center text-xs"
        >
          <span className="text-red-500">{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Controller
          name="email"
          control={control}
          rules={{
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
          name="token"
          control={control}
          rules={{
            required: "Reset token is required",
          }}
          render={({ field }) => (
            <FloatingInput
              {...field}
              label="Reset Token"
              error={errors.token?.message}
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
              label="New Password"
              type="password"
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          name="confirm_password"
          control={control}
          rules={{
            required: "Confirm password is required",
            validate: (value, formValues) =>
              value === formValues.password || "Passwords do not match",
          }}
          render={({ field }) => (
            <FloatingInput
              {...field}
              label="Confirm Password"
              type="password"
              error={errors.confirm_password?.message}
            />
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full h-11">
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Back to{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          sign in
        </Link>
      </p>
    </AuthContainer>
  );
};

export default ResetPasswordPage;
