import { useMemo } from "react";
import { BookOpen, Briefcase, History, Package } from "lucide-react";
import useUrlTab from "@/hooks/useUrlTab";
import { ScrollContainer } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import BaseKnowledge from "./base-knowledge";
import ProductsKnowledge from "./products-knowledge";
import ServicesKnowledge from "./services-knowledge";
import TrainingLogs from "./training-activity";

// Each training source only shows when its feature is enabled.
const SUB_TABS = [
  { value: "base", label: "Knowledge", feature: "knowledgeEnabled", icon: BookOpen },
  { value: "products", label: "Products", feature: "productsEnabled", icon: Package },
  { value: "services", label: "Services", feature: "servicesEnabled", icon: Briefcase },
  { value: "logs", label: "Training Logs", icon: History },
];

const KnowledgePanel = ({ chatbot }) => {
  const tabs = useMemo(
    () => SUB_TABS.filter((tab) => !tab.feature || chatbot[tab.feature] !== false),
    [chatbot],
  );
  const [activeSubTab, setActiveSubTab] = useUrlTab({
    tabs,
    defaultTab: tabs[0]?.value,
    paramName: "knowledge",
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-4 mt-4 flex shrink-0 gap-0.5 overflow-x-auto rounded-full bg-muted p-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveSubTab(tab.value)}
            className={cn(
              "flx shrink-0 gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition",
              activeSubTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon size={13} className="shrink-0" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeSubTab === "base" && (
        <ScrollContainer className="px-4 py-5">
          <BaseKnowledge chatbot={chatbot} />
        </ScrollContainer>
      )}
      {activeSubTab === "products" && <ProductsKnowledge chatbot={chatbot} />}
      {activeSubTab === "services" && (
        <ScrollContainer className="px-4 py-5">
          <ServicesKnowledge chatbot={chatbot} />
        </ScrollContainer>
      )}
      {/* Mounted only while active, so logs are fetched on first click. */}
      {activeSubTab === "logs" && (
        <ScrollContainer className="px-4 py-5">
          <TrainingLogs chatbot={chatbot.slug} />
        </ScrollContainer>
      )}
    </div>
  );
};

export default KnowledgePanel;
