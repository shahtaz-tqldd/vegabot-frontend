import React from "react";
import { cn } from "@/lib/utils";

const AuthContainer = ({
  title,
  description,
  children,
  containerClassName,
  panelClassName,
}) => {
  return (
    <div className="center min-h-screen bg-gradient-to-br from-blue-50 via-background to-cyan-50 px-6 py-5 dark:from-blue-950/40 dark:via-background dark:to-cyan-950/30 md:px-8 md:py-10">
      <div className={cn("w-full max-w-md", containerClassName)}>
        <div
          className={cn(
            "border-border shadow-sm md:rounded-3xl md:border md:bg-card md:p-8 md:text-card-foreground md:shadow-xl",
            panelClassName,
          )}
        >
          <div className="mb-10">
            <img src="/logo.png" alt="Argon Chatbot" className="size-12" />
            <h2 className="mt-2 text-xl font-semibold text-foreground md:text-2xl">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
