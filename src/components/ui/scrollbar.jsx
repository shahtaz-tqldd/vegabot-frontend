import { cn } from "@/lib/utils";
import React from "react";

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
  const rafRef = React.useRef(null);
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

    if (!canScroll) {
      setMetrics((previous) => {
        if (
          !previous.canScroll &&
          previous.thumbHeight === 0 &&
          previous.thumbTop === 0
        ) {
          return previous;
        }

        return {
          canScroll: false,
          thumbHeight: 0,
          thumbTop: 0,
        };
      });

      return;
    }

    const thumbHeight = Math.min(
      trackHeight,
      Math.max(
        SCROLLBAR_MIN_THUMB_SIZE,
        (clientHeight / scrollHeight) * trackHeight,
      ),
    );

    const availableThumbTravel = trackHeight - thumbHeight;
    const availableScroll = scrollHeight - clientHeight;

    const thumbTop = Math.round(
      SCROLLBAR_TRACK_INSET +
        (scrollTop / availableScroll) * availableThumbTravel,
    );

    setMetrics((previous) => {
      if (
        previous.canScroll === canScroll &&
        previous.thumbHeight === thumbHeight &&
        previous.thumbTop === thumbTop
      ) {
        return previous;
      }

      return {
        canScroll,
        thumbHeight,
        thumbTop,
      };
    });
  }, []);

  const scheduleScrollbarUpdate = React.useCallback(() => {
    if (rafRef.current) return;

    rafRef.current = window.requestAnimationFrame(() => {
      updateScrollbar();
      rafRef.current = null;
    });
  }, [updateScrollbar]);

  const showScrollbar = React.useCallback(() => {
    window.clearTimeout(hideTimeoutRef.current);

    setIsVisible(true);

    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, SCROLLBAR_HIDE_DELAY);
  }, []);

  React.useEffect(() => {
    updateScrollbar();

    const resizeObserver = new ResizeObserver(() => {
      scheduleScrollbarUpdate();
    });

    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      resizeObserver.disconnect();

      window.clearTimeout(hideTimeoutRef.current);

      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [scheduleScrollbarUpdate, updateScrollbar]);

  const handleScroll = (event) => {
    scheduleScrollbarUpdate();
    showScrollbar();

    onScroll?.(event);
  };

  const handleMouseEnter = (event) => {
    showScrollbar();
    onMouseEnter?.(event);
  };

  const handleMouseMove = (event) => {
    showScrollbar();
    onMouseMove?.(event);
  };

  const handleFocus = (event) => {
    showScrollbar();
    onFocus?.(event);
  };

  const handleThumbPointerDown = (event) => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    event.preventDefault();
    event.stopPropagation();

    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: scrollElement.scrollTop,
    };

    showScrollbar();
  };

  const handleThumbPointerMove = (event) => {
    const drag = dragRef.current;
    const scrollElement = scrollRef.current;

    if (!drag || drag.pointerId !== event.pointerId || !scrollElement) {
      return;
    }

    const trackHeight = Math.max(
      0,
      scrollElement.clientHeight - SCROLLBAR_TRACK_INSET * 2,
    );

    const availableThumbTravel = trackHeight - metrics.thumbHeight;

    const availableScroll =
      scrollElement.scrollHeight - scrollElement.clientHeight;

    if (availableThumbTravel <= 0 || availableScroll <= 0) {
      return;
    }

    const pointerDelta = event.clientY - drag.startY;

    scrollElement.scrollTop =
      drag.startScrollTop +
      (pointerDelta / availableThumbTravel) * availableScroll;

    showScrollbar();
  };

  const handleThumbPointerUp = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    showScrollbar();
  };

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
    >
      <div
        {...scrollProps}
        ref={setScrollRef}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto",
          "[scrollbar-width:none]",
          "[&::-webkit-scrollbar]:hidden",
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
            "pointer-events-none absolute inset-y-0 right-0 z-20 w-2",
            "transition-opacity duration-200",
            "motion-reduce:transition-none",
            isVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            className={cn(
              "absolute right-0.5 w-1.5",
              "touch-none rounded-full",
              "bg-primary/45",
              "transition-colors",
              "hover:bg-primary/65",
              "active:bg-primary/80",
              isVisible ? "pointer-events-auto" : "pointer-events-none",
            )}
            style={{
              height: `${metrics.thumbHeight}px`,
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

ScrollContainer.displayName = "ScrollContainer";

export { ScrollContainer };
