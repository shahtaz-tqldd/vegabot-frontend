import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, MessagesSquare } from "lucide-react";

import { StatusBadge } from "@/components/ui/badge";
import { AVATAR_TONES } from "@/constants/colors";
import { duration } from "@/lib/date-time";
import { cn, getInitials, getPaletteIndex } from "@/lib/utils";
import { knowledgeCount } from "@/features/chatbot/chatbot.helpers";

const ChatbotCard = ({ chatbot }) => {
  const tone = AVATAR_TONES[getPaletteIndex(chatbot.slug, AVATAR_TONES)];

  return (
    <Link
      to={`/chatbot/${chatbot.slug}`}
      className="group flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold",
            tone,
          )}
        >
          {getInitials(chatbot.name)}
        </span>

        <div className="flex items-center gap-2">
          <StatusBadge>{chatbot.status}</StatusBadge>
          <span className="center size-8 rounded-full text-muted-foreground opacity-0 transition-all group-hover:bg-primary/10 group-hover:text-primary group-hover:opacity-100">
            <ArrowUpRight size={16} />
          </span>
        </div>
      </div>

      <h3 className="mt-4 truncate text-base font-bold text-foreground">
        {chatbot.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 min-h-10 text-[13px] leading-5 text-muted-foreground">
        {chatbot.description || "No description yet."}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flx gap-4 text-xs font-medium text-muted-foreground">
          <span className="flx gap-1.5">
            <BookOpen size={14} className="text-primary" />
            {knowledgeCount(chatbot)} knowledge
          </span>
          <span className="flx gap-1.5">
            <MessagesSquare size={14} className="text-primary" />
            {chatbot.stats?.conversations ?? 0}
          </span>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground/80">
          {duration(chatbot.updatedAt)}
        </span>
      </div>
    </Link>
  );
};

export default ChatbotCard;
