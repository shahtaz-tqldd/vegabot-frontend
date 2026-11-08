import { cn } from "@/lib/utils";
import React from "react";
import { SectionTitle } from "./section";

const Card = ({ children, className, id = null }) => {
  return (
    <section
      id={id}
      className={cn(
        "overflow-hidden rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
};

export const SectionCard = ({
  icon,
  title,
  description,
  action,
  children,
  className = "",
  childClassName = "",
  headerClassName = "",
}) => {
  return (
    <Card className={cn("p-0", className)}>
      <div
        className={cn(
          "flex items-start justify-between gap-4 border-b p-5",
          headerClassName,
        )}
      >
        <SectionTitle icon={icon} title={title} details={description} />
        {action}
      </div>
      <div className={cn("p-5", childClassName)}>{children}</div>
    </Card>
  );
};

export default Card;
