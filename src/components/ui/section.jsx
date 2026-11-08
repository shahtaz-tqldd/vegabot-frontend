import React from "react";
import { cn, getInitials } from "@/lib/utils";
import { Link, Mail, ShieldCheck } from "lucide-react";
import Image from "./image";

const SectionTitle = ({
  title,
  details = null,
  icon: Icon = null,
  lg = false,
  tag = null,
  iconColor = "bg-primary/10 text-primary",
}) => {
  return (
    <div className="flex items-start gap-4">
      {Icon && (
        <div
          className={cn(
            "flex  shrink-0 items-center justify-center rounded-2xl text-primary",
            iconColor,
            lg ? "size-14" : "size-11",
          )}
        >
          <Icon className={cn(lg ? "size-6" : "size-5")} />
        </div>
      )}
      <div>
        <h2
          className={cn(
            "font-semibold text-foreground",
            lg ? "text-xl" : "text-base",
          )}
        >
          {title}
          {tag && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {tag}
            </span>
          )}
        </h2>
        {details && (
          <p
            className={cn(
              "mt-1 text-muted-foreground",
              lg ? "text-[15px]" : "text-[13px]",
            )}
          >
            {details}
          </p>
        )}
      </div>
    </div>
  );
};

const DialogHeaderTitle = ({
  title,
  details,
  icon: Icon = null,
  header = null,
}) => {
  if (header) return header;
  return (
    <div className="flex flex-col items-start gap-3">
      {Icon && (
        <div
          className={cn(
            "flex  shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary",
            "size-11",
          )}
        >
          <Icon className={cn("size-5")} />
        </div>
      )}
      <div>
        <h2 className={cn("font-semibold text-foreground", "text-base")}>
          {title}
        </h2>
        <p className={cn("mt-1 text-muted-foreground", "text-sm")}>{details}</p>
      </div>
    </div>
  );
};

const UserProfile = ({ person }) => {
  const isInvitation = person.type === "invitation";

  return (
    <div className="flex min-w-52 items-center gap-3">
      <div className="relative shrink-0">
        {person.avatar_url && !isInvitation ? (
          <Image
            src={person.avatar_url}
            alt={person?.name || "User"}
            type="user"
            className="size-full rounded-full object-cover"
            fallbackClassName="rounded-full"
          />
        ) : (
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-full text-xs font-bold",
              isInvitation
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-primary/10 text-primary",
            )}
          >
            {isInvitation ? (
              <Mail className="size-4" />
            ) : (
              getInitials(person.name || person.email)
            )}
          </span>
        )}
        {person.status === "Active" && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-emerald-500" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {person.name}
          </p>
          {person.role === "Admin" && (
            <ShieldCheck className="size-3.5 text-primary" />
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {person.email}
        </p>
      </div>
    </div>
  );
};

const UserProfileName = ({ person }) => {
  return (
    <div className="flex min-w-52 items-center gap-2">
      <div className="relative shrink-0">
        {person.avatar_url ? (
          <Image
            src={person.avatar_url}
            alt={person?.name || "User"}
            type="user"
            className="size-6 rounded-full object-cover"
            fallbackClassName="rounded-full"
          />
        ) : (
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-xs font-bold",
              "bg-primary/10 text-primary",
            )}
          >
            {getInitials(person.name || person.email)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {person.name}
        </p>
      </div>
    </div>
  );
};

const ContextRow = ({ icon, label, value, link = null, subrow = null }) => {
  const ContextIcon = icon;
  return (
    <div className="flex gap-3 py-2.5">
      <ContextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {link ? (
          <a
            href={link}
            target="__blank"
            className="mt-0.5 break-words text-xs text-blue-600 font-medium flx gap-1.5"
          >
            <Link size={12} />
            {value}
          </a>
        ) : value ? (
          <p className="mt-0.5 break-words text-xs font-medium">{value}</p>
        ) : (
          <p className="mt-0.5 break-words text-xs font-medium">Not found</p>
        )}
        {subrow}
      </div>
    </div>
  );
};

const SCROLLBAR_HIDE_DELAY = 1000;
const SCROLLBAR_MIN_THUMB_SIZE = 32;
const SCROLLBAR_TRACK_INSET = 4;

const ScrollContainer = React.forwardRef(function ScrollContainer(
  {
    children,
    className = "",
    onScroll,
    onMouseEnter,
    onMouseMove,
    onFocus,
    allowScrollChaining = false,
    ...scrollProps
  },
  forwardedRef,
) {
  const scrollRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const hideTimeoutRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const [metrics, setMetrics] = React.useState({
    canScroll: false,
    thumbHeight: 0,
    thumbTop: 0,
  });

  const setScrollRef = React.useCallback(
    (node) => {
      scrollRef.current = node;

      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );

  const updateScrollbar = React.useCallback(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const { clientHeight, scrollHeight, scrollTop } = scrollElement;
    const trackHeight = Math.max(0, clientHeight - SCROLLBAR_TRACK_INSET * 2);
    const canScroll = scrollHeight > clientHeight + 1;
    const thumbHeight = canScroll
      ? Math.min(
          trackHeight,
          Math.max(
            SCROLLBAR_MIN_THUMB_SIZE,
            (clientHeight / scrollHeight) * trackHeight,
          ),
        )
      : 0;
    const availableThumbTravel = trackHeight - thumbHeight;
    const availableScroll = scrollHeight - clientHeight;
    const thumbTop = canScroll
      ? SCROLLBAR_TRACK_INSET +
        (scrollTop / availableScroll) * availableThumbTravel
      : 0;

    setMetrics({ canScroll, thumbHeight, thumbTop });
  }, []);

  const showScrollbar = React.useCallback(() => {
    window.clearTimeout(hideTimeoutRef.current);
    setIsVisible(true);
    hideTimeoutRef.current = window.setTimeout(
      () => setIsVisible(false),
      SCROLLBAR_HIDE_DELAY,
    );
  }, []);

  React.useEffect(() => {
    updateScrollbar();

    const resizeObserver = new ResizeObserver(updateScrollbar);
    if (scrollRef.current) resizeObserver.observe(scrollRef.current);
    if (contentRef.current) resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(hideTimeoutRef.current);
    };
  }, [updateScrollbar]);

  const handleScroll = (event) => {
    updateScrollbar();
    showScrollbar();
    onScroll?.(event);
  };

  const handleThumbPointerDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: scrollRef.current.scrollTop,
    };
    showScrollbar();
  };

  const handleThumbPointerMove = (event) => {
    const drag = dragRef.current;
    const scrollElement = scrollRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !scrollElement) return;

    const trackHeight = scrollElement.clientHeight - SCROLLBAR_TRACK_INSET * 2;
    const availableThumbTravel = trackHeight - metrics.thumbHeight;
    const availableScroll =
      scrollElement.scrollHeight - scrollElement.clientHeight;
    if (availableThumbTravel <= 0) return;

    scrollElement.scrollTop =
      drag.startScrollTop +
      ((event.clientY - drag.startY) / availableThumbTravel) * availableScroll;
    showScrollbar();
  };

  const handleThumbPointerUp = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    showScrollbar();
  };

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      onMouseEnter={(event) => {
        showScrollbar();
        onMouseEnter?.(event);
      }}
      onMouseMove={(event) => {
        showScrollbar();
        onMouseMove?.(event);
      }}
      onFocus={(event) => {
        showScrollbar();
        onFocus?.(event);
      }}
    >
      <div
        {...scrollProps}
        ref={setScrollRef}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          allowScrollChaining ? "overscroll-y-auto" : "overscroll-contain",
          className,
        )}
        onScroll={handleScroll}
      >
        <div ref={contentRef}>{children}</div>
      </div>

      {metrics.canScroll && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-20 w-2 transition-opacity duration-200 motion-reduce:transition-none",
            isVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className={cn(
              "absolute right-0.5 w-1.5 touch-none rounded-full bg-[#78acff] transition-colors hover:bg-foreground/45 active:bg-foreground/55",
              isVisible ? "pointer-events-auto" : "pointer-events-none",
            )}
            style={{
              height: metrics.thumbHeight,
              transform: `translateY(${metrics.thumbTop}px)`,
            }}
            onPointerDown={handleThumbPointerDown}
            onPointerMove={handleThumbPointerMove}
            onPointerUp={handleThumbPointerUp}
            onPointerCancel={handleThumbPointerUp}
          />
        </div>
      )}
    </div>
  );
});

export {
  SectionTitle,
  DialogHeaderTitle,
  UserProfile,
  ContextRow,
  ScrollContainer,
  UserProfileName,
};
