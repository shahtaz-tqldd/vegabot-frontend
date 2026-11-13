import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/input";
import { PENDING_VERIFICATION_EMAIL_KEY } from "@/constants/session";
import { useRegisterMutation } from "@/features/auth/authApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import AuthContainer from "./components/container";

const RegisterPage = () => {
  const [registerAccount, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState("");
  const [errorAnimationKey, setErrorAnimationKey] = useState(0);
  const navigate = useNavigate();

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, value]) => String(value).trim() !== ""),
      );
      const res = await registerAccount(payload).unwrap();
      const verificationEmail = res?.data?.email || payload.email;

      try {
        window.sessionStorage.setItem(
          PENDING_VERIFICATION_EMAIL_KEY,
          verificationEmail,
        );
      } catch {
        // Navigation state still carries the email when storage is unavailable.
      }

      navigate("/verify-otp", {
        replace: true,
        state: { email: verificationEmail },
      });
    } catch (error) {
      console.error("Registration failed:", error);
      setError(getApiErrorMessage(error, "Failed to create account!"));
      setErrorAnimationKey((current) => current + 1);
    }
  };

  return (
    <AuthContainer
      title="Create account"
      description={<p>Register to get access to the vegabot chatbot</p>}
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
          name="name"
          control={control}
          render={({ field }) => <FloatingInput {...field} label="Name" />}
        />

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
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthContainer>
  );
};

export default RegisterPage;
