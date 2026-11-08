import { Suspense, lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";

import AppLayout from "@/layouts/app-layout";
import PrivateRoute from "./private-route";

// auth
const LoginPage = lazy(() => import("@/pages/auth/login"));
const RegisterPage = lazy(() => import("@/pages/auth/register"));
const VerifyOtpPage = lazy(() => import("@/pages/auth/verify-otp"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/reset-password"));

// chatbots
const ChatbotsPage = lazy(() => import("@/pages/chatbot-list"));
const ChatbotDetailsPage = lazy(() => import("@/pages/chatbot-details"));

const withSuspense = (element) => (
  <Suspense fallback={null}>{element}</Suspense>
);

export const routes = createBrowserRouter([
  {
    path: "/",
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: withSuspense(<ChatbotsPage />) }
    
    ],
  },
  {
    path: "/chatbot/:chatbotSlug",
    element: withSuspense(
      <PrivateRoute>
        <ChatbotDetailsPage />
      </PrivateRoute>,
    ),
  },
  { path: "/login", element: withSuspense(<LoginPage />) },
  { path: "/register", element: withSuspense(<RegisterPage />) },
  { path: "/verify-otp", element: withSuspense(<VerifyOtpPage />) },
  { path: "/forgot-password", element: withSuspense(<ForgotPasswordPage />) },
  { path: "/reset-password", element: withSuspense(<ResetPasswordPage />) },
  { path: "*", element: <Navigate to="/" replace /> },
]);
