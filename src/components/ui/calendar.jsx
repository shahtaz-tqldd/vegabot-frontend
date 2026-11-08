import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn("bg-background p-3", className)}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", classNames?.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          classNames?.months,
        ),
        month: cn("flex w-full flex-col gap-4", classNames?.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          classNames?.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 p-0",
          classNames?.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 p-0",
          classNames?.button_next,
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-10",
          classNames?.month_caption,
        ),
        caption_label: cn(
          "truncate text-sm font-medium",
          classNames?.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", classNames?.weekdays),
        weekday: cn(
          "w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground",
          classNames?.weekday,
        ),
        week: cn("mt-2 flex w-full", classNames?.week),
        day: cn(
          "relative size-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
          classNames?.day,
        ),
        day_button: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-9 rounded-md p-0 font-normal aria-selected:opacity-100",
          classNames?.day_button,
        ),
        range_start: cn("rounded-l-md bg-accent", classNames?.range_start),
        range_middle: cn("rounded-none bg-accent", classNames?.range_middle),
        range_end: cn("rounded-r-md bg-accent", classNames?.range_end),
        selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          classNames?.selected,
        ),
        today: cn("bg-accent text-accent-foreground", classNames?.today),
        outside: cn(
          "text-muted-foreground opacity-50 aria-selected:opacity-30",
          classNames?.outside,
        ),
        disabled: cn("text-muted-foreground opacity-50", classNames?.disabled),
        hidden: cn("invisible", classNames?.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...props }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", className)} {...props} />
          ) : (
            <ChevronRight className={cn("size-4", className)} {...props} />
          ),
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar };
