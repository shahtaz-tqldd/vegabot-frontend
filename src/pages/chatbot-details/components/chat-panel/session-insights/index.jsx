import { ArrowLeft, BarChart3, PanelRightOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import Analytics from "./analytics";
import {
  CartSection,
  EscalationsSection,
  InsightSection,
  OrdersSection,
} from "./session-lists";

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
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      className="relative shrink-0"
      aria-pressed={active}
      aria-label={
        escalations
          ? `Session details (${escalations} escalation${escalations === 1 ? "" : "s"})`
          : "Session details"
      }
      title="Session details"
      onClick={onClick}
    >
      <PanelRightOpen size={16} />
      {escalations > 0 && (
        <span className="center absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
          {escalations > 99 ? "99+" : escalations}
        </span>
      )}
    </Button>
  );
};

// Takes the place of the message list while open.
const SessionInsights = ({ chatbot, session, summary, onBack }) => {
  const sessionId = session?.id;
  const commerce = showCommerce(chatbot, summary);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flx shrink-0 gap-2 border-b border-border bg-muted/20 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 !px-2 text-xs"
          onClick={onBack}
        >
          <ArrowLeft size={15} />
          Back to messages
        </Button>
        <span className="ml-auto truncate text-[11px] text-muted-foreground">
          Session {sessionId?.slice(0, 8)}
        </span>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-7 px-5 py-5">
          <InsightSection icon={BarChart3} title="Analytics">
            <Analytics messages={session?.messages} summary={summary} />
          </InsightSection>

          {sessionId && (
            <EscalationsSection
              sessionId={sessionId}
              count={summary?.escalationCount ?? 0}
              rev={summary?.escalationCount ?? 0}
            />
          )}

          {sessionId && commerce && (
            <OrdersSection
              sessionId={sessionId}
              count={summary?.orderCount ?? 0}
              rev={summary?.orderCount ?? 0}
            />
          )}

          {sessionId && commerce && (
            <CartSection
              sessionId={sessionId}
              count={summary?.cartItemCount ?? 0}
              rev={`${summary?.cartItemCount ?? 0}-${summary?.purchasedItemCount ?? 0}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionInsights;
