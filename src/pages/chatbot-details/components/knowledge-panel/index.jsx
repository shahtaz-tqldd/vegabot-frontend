import { useMemo } from "react";
import { BookOpen, Briefcase, Package } from "lucide-react";
import useUrlTab from "@/hooks/useUrlTab";
import { ScrollContainer } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import BaseKnowledge from "./base-knowledge";
import ProductsKnowledge from "./products-knowledge";
import ServicesKnowledge from "./services-knowledge";

// Each training source only shows when its feature is enabled.
const SUB_TABS = [
  { value: "base", label: "Base Knowledge", feature: "knowledgeEnabled", icon: BookOpen },
  { value: "products", label: "Products", feature: "productsEnabled", icon: Package },
  { value: "services", label: "Services", feature: "servicesEnabled", icon: Briefcase },
];

const GRID_COLS = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };

const KnowledgePanel = ({ chatbot }) => {
  const tabs = useMemo(
    () => SUB_TABS.filter((tab) => chatbot[tab.feature] !== false),
    [chatbot],
  );
  const [activeSubTab, setActiveSubTab] = useUrlTab({
    tabs,
    defaultTab: tabs[0]?.value,
    paramName: "knowledge",
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "mx-4 mt-4 grid shrink-0 gap-1 rounded-xl bg-muted p-1",
          GRID_COLS[tabs.length],
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveSubTab(tab.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition",
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
    </div>
  );
};

export default KnowledgePanel;
