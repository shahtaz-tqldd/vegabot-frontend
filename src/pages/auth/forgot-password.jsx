import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/input";
import { useRequestResetPasswordMutation } from "@/features/auth/authApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import AuthContainer from "./components/container";

const ForgotPasswordPage = () => {
  const [requestResetPassword, { isLoading }] =
    useRequestResetPasswordMutation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [errorAnimationKey, setErrorAnimationKey] = useState(0);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await requestResetPassword({ email: data.email }).unwrap();
      setError("");
      setSuccess("Password reset instructions have been sent to your email.");
    } catch (error) {
      console.error("Password reset request failed:", error);
      setSuccess("");
      setError(getApiErrorMessage(error, "Failed to request password reset!"));
      setErrorAnimationKey((current) => current + 1);
    }
  };

  return (
    <AuthContainer
      title=" Reset password"
      description="Enter your email and we will send reset instructions."
    >
      {error && (
        <div
          key={errorAnimationKey}
          className="error-bounce mb-6 -mt-4 rounded-lg border border-red-200 bg-red-100 p-2 text-center text-xs"
        >
          <span className="text-red-500">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 -mt-4 rounded-lg border border-green-200 bg-green-100 p-2 text-center text-xs">
          <span className="text-green-700">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <Button type="submit" disabled={isLoading} className="w-full h-11">
          {isLoading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthContainer>
  );
};

export default ForgotPasswordPage;
