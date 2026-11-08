import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";

const PrivateRoute = ({ children, redirectTo = "/login" }) => {
  const location = useLocation();
  const { isLoading, isFetching, authChecked, authError, refetchProfile } =
    useAuth();
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (authError) {
    return (
      <ServerNotConnected
        isFetching={isFetching}
        refetchProfile={refetchProfile}
      />
    );
  }

  if (!authChecked || isLoading) return null;

  return isAuthenticated ? (
    children
  ) : (
    <Navigate state={{ from: location }} to={redirectTo} replace />
  );
};

const ServerNotConnected = ({ isFetching, refetchProfile }) => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6">
      <div className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <path d="M12 20h.01" />
            <path d="m2 2 20 20" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-foreground">
          Unable to connect to the server
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          We could not reach the server. Please check your internet connection
          or try again in a moment.
        </p>

        <Button
          type="button"
          onClick={refetchProfile}
          disabled={isFetching}
          className="mt-6 w-full"
        >
          {isFetching ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Reconnecting...
            </span>
          ) : (
            "Try again"
          )}
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          Error code: SERVER_CONNECTION_FAILED
        </p>
      </div>
    </div>
  );
};

export default PrivateRoute;
