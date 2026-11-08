import React from "react";
import clsx from "clsx";

export function Title({ children, variant = "md", className }) {
  const sizeClasses = {
    xl: "text-2xl md:text-4xl font-semibold",
    lg: "text-xl md:text-2xl font-semibold",
    md: "text-lg md:text-xl font-bold",
    sm: "text-base md:text-lg font-extrabold",
    xs: "text-sm md:text-base font-semibold",
  };

  return (
    <h2 className={clsx(sizeClasses[variant], "text-foreground", className)}>
      {children}
    </h2>
  );
}

export function Text({ children, variant = "md", className }) {
  const sizeClasses = {
    lg: "text-base md:text-lg",
    md: "text-sm md:text-base",
    sm: "text-xs md:text-sm leading-5 md:leading-6",
    xs: "text-xs md:text-xs",
  };

  return (
    <p
      className={clsx(sizeClasses[variant], "text-slate-700", className)}
    >
      {children}
    </p>
  );
}
