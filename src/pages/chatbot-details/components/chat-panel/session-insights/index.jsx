import { useState } from "react";
import { ArrowLeft, BarChart3, Bell, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Analytics from "./analytics";
import {
  CartSection,
  EscalationsSection,
  OrdersSection,
} from "./session-lists";

const TABS = [
  { value: "analytics", label: "Analytics", icon: BarChart3 },
  { value: "cart", label: "Cart & Orders", icon: ShoppingCart },
  { value: "escalation", label: "Escalation", icon: Bell },
];

// Cart / orders only make sense when the bot can take orders — but still show
// them if this session already has some (ordering may have been turned off).
const showCommerce = (chatbot, summary) =>
  Boolean(
    chatbot?.productOrderingEnabled ||
    summary?.cartItemCount ||
    summary?.orderCount,
  );

// Single header button. Escalations are the only thing that needs attention,
// so they're the only count surfaced on it.
export const SessionInsightsButton = ({ summary, active, onClick }) => {
  const escalations = summary?.escalationCount ?? 0;

  return (
    <Button
      variant="outline"
      size="sm"
      className="relative shrink-0 gap-1.5 rounded-full text-xs font-semibold"
      aria-pressed={active}
      aria-label={
        escalations
          ? `Session details (${escalations} escalation${escalations === 1 ? "" : "s"})`
          : "Session details"
      }
      title="Session details"
      onClick={onClick}
    >
      {active ? "View messages" : "Show Insights"}
      {escalations > 0 && (
        <span className="center absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
          {escalations > 99 ? "99+" : escalations}
        </span>
      )}
    </Button>
  );
};

// Takes the place of the message list while open.
const SessionInsights = ({ chatbot, session, summary, onBack }) => {
  const [tab, setTab] = useState("analytics");
  const sessionId = session?.id;
  const commerce = showCommerce(chatbot, summary);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl flx shrink-0 gap-2 border-b border-border bg-muted/20 px-5 py-2">
        <div className="flex gap-0.5 rounded-full bg-muted p-0.5">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "flx gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition",
                tab === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-7 px-5 py-5">
          {tab === "analytics" && (
            <section className="space-y-2.5">
              <Analytics messages={session?.messages} summary={summary} />
            </section>
          )}

          {tab === "escalation" && sessionId && (
            <EscalationsSection
              sessionId={sessionId}
              count={summary?.escalationCount ?? 0}
              rev={summary?.escalationCount ?? 0}
            />
          )}

          {tab === "cart" && sessionId && commerce && (
            <>
              <CartSection
                sessionId={sessionId}
                count={summary?.cartItemCount ?? 0}
                rev={`${summary?.cartItemCount ?? 0}-${summary?.purchasedItemCount ?? 0}`}
              />
              <OrdersSection
                sessionId={sessionId}
                count={summary?.orderCount ?? 0}
                rev={summary?.orderCount ?? 0}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionInsights;
