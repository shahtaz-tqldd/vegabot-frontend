import { cn } from "@/lib/utils";
import React from "react";

const Container = ({ children, className }) => {
  return (
    <section className={cn("mx-auto max-w-7xl space-y-6", className)}>
      {children}
    </section>
  );
};

export default Container;
