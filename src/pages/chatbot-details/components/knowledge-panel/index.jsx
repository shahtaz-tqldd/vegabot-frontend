import useUrlTab from "@/hooks/useUrlTab";
import { cn } from "@/lib/utils";
import BaseKnowledge from "./base-knowledge";
import ProductsKnowledge from "./products-knowledge";
import ServicesKnowledge from "./services-knowledge";

const SUB_TABS = [
  { value: "base", label: "Base Knowledge" },
  { value: "products", label: "Products" },
  { value: "services", label: "Services" },
];

const KnowledgePanel = ({ chatbot }) => {
  const [activeSubTab, setActiveSubTab] = useUrlTab({
    tabs: SUB_TABS,
    defaultTab: "base",
    paramName: "knowledge",
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveSubTab(tab.value)}
            className={cn(
              "rounded-lg px-2 py-2 text-xs font-semibold transition",
              activeSubTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeSubTab === "base" && <BaseKnowledge chatbot={chatbot} />}
      {activeSubTab === "products" && <ProductsKnowledge chatbot={chatbot} />}
      {activeSubTab === "services" && <ServicesKnowledge chatbot={chatbot} />}
    </div>
  );
};

export default KnowledgePanel;
