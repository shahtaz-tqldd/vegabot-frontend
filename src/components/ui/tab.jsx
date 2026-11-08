import React, { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TabMenu = ({
  tabs,
  activeTab,
  setActiveTab,
  className,
  scrollable = false,
  compact = false,
}) => {
  const tabListRef = useRef(null);
  const tabRefs = useRef({});

  useEffect(() => {
    if (!scrollable) return;

    const tabList = tabListRef.current;
    const activeButton = tabRefs.current[activeTab];

    if (!tabList || !activeButton) return;

    const targetLeft =
      activeButton.offsetLeft -
      tabList.clientWidth / 2 +
      activeButton.clientWidth / 2;

    tabList.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });
  }, [activeTab, scrollable]);

  return (
    <div
      ref={tabListRef}
      className={cn(
        "flex items-center gap-2 border-b border-border",
        scrollable
          ? "flex-nowrap overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex-wrap",
        className,
      )}
    >
      {tabs.map((tab) => (
        <TabButton
          key={tab.value}
          tab={tab}
          active={activeTab === tab.value}
          onClick={() => setActiveTab(tab.value)}
          scrollable={scrollable}
          compact={compact}
          buttonRef={(node) => {
            tabRefs.current[tab.value] = node;
          }}
        />
      ))}
    </div>
  );
};

const TabButton = ({ tab, active, onClick, scrollable, compact, buttonRef }) => {
  const Icon = tab.icon;
  const hasCount = tab.count !== undefined && tab.count !== null;
  const isComplete = Boolean(tab.isComplete);
  const unreadCount = Number(tab.unreadCount);
  const hasUnreadCount = Boolean(unreadCount);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flx gap-2 border-b-2 font-semibold transition",
        compact ? "py-1.5 text-xs" : "py-3 text-xs md:text-sm",
        scrollable && "shrink-0 whitespace-nowrap",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
        hasCount ? "pl-3.5 pr-2.5" : "px-2 md:px-3.5",
      )}
    >
      {Icon && <Icon size={compact ? 13 : 15} />}
      {tab.label}
      {(hasCount || isComplete) && (
        <span
          className={cn(
            "center rounded-full bg-muted px-1 text-xs font-semibold",
            compact ? "h-4.5 min-w-4.5" : "h-5 min-w-5",
            isComplete && "bg-primary/10 text-primary",
          )}
        >
          {isComplete ? <Check size={13} strokeWidth={3} /> : tab.count}
        </span>
      )}
      {hasUnreadCount && (
        <span
          className={cn(
            "h-5 min-w-5 px-1 text-xs font-semibold center rounded-full bg-red-600 text-white",
          )}
        >
          {unreadCount}
        </span>
      )}
    </button>
  );
};

export default TabMenu;
