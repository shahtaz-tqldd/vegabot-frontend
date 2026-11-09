import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleDashed,
  Database,
  Package,
  Wrench,
} from "lucide-react";

import { trainedKnowledgeCount } from "@/features/chatbot/chatbot.helpers";
import { cn, getInitials } from "@/lib/utils";
import { Logo } from "@/assets/icons/logo";

const KnowledgeStat = ({ icon: Icon, label, count }) => {
  const IconComp = Icon;

  return (
    <span
      className="flx gap-1 text-[11px] font-medium text-muted-foreground"
      title={`${count} ${label}`}
    >
      <IconComp size={12} className="text-muted-foreground/70" />
      {count}
      <span className="sr-only">{label}</span>
    </span>
  );
};

const ChatbotCard = ({ chatbot }) => {
  const trained = chatbot.trainedKnowledge;
  const isTrained = trainedKnowledgeCount(chatbot) > 0;
  const creator = chatbot.createdBy;

  return (
    <Link
      to={`/chatbot/${chatbot.slug}`}
      className="group flex flex-col rounded-3xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="flx gap-3.5">
        {chatbot.logo ? (
          <img
            src={chatbot.logo}
            alt={chatbot.name}
            className="size-12 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <Logo className="size-8" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="truncate text-base font-bold text-foreground">
                {chatbot.name}
              </h3>
              <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                {chatbot.businessType}
              </p>
            </div>
            <span className="center size-8 shrink-0 rounded-full text-muted-foreground opacity-0 transition-all group-hover:bg-primary/10 group-hover:text-primary group-hover:opacity-100">
              <ArrowUpRight size={16} />
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3.5 line-clamp-2 min-h-10 text-[13px] leading-5 text-muted-foreground">
        {chatbot.description || "No description yet."}
      </p>

      <div className="mt-auto pt-4">
        <div className="flx justify-between gap-3 border-t border-border pt-3.5">
          <span
            className={cn(
              "flx gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              isTrained
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isTrained ? (
              <BadgeCheck size={13} />
            ) : (
              <CircleDashed
                size={13}
                className="animate-[spin_4s_linear_infinite]"
              />
            )}
            {isTrained ? "Trained" : "Not trained"}
          </span>

          <div className="flx gap-3">
            <KnowledgeStat
              icon={Database}
              label="knowledge sources"
              count={trained.knowledgeSourceCount}
            />
            <KnowledgeStat
              icon={Package}
              label="products"
              count={trained.productCount}
            />
            <KnowledgeStat
              icon={Wrench}
              label="services"
              count={trained.serviceCount}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3.5">
          {creator?.name ? (
            <>
              <span
                title={creator.email || creator.name}
                className="center size-6 shrink-0 rounded-full bg-primary/10 text-[10px] font-bold text-primary"
              >
                {getInitials(creator.name)}
              </span>
              <p className="min-w-0 truncate text-[11px] text-muted-foreground">
                Created by{" "}
                <span className="font-semibold text-foreground">
                  {creator.name}
                </span>
              </p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground/70">
              Creator unknown
            </p>
          )}

          {chatbot.isAdminCreated && (
            <span className="ml-auto shrink-0 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
              Admin
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ChatbotCard;
