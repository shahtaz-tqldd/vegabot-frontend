import { useState } from "react";

import {
  useListKnowledgeQuery,
  useListProductsQuery,
  useListServicesQuery,
} from "@/features/knowledge/knowledgeApiSlice";
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
  const [activeSubTab, setActiveSubTab] = useState("base");

  const { data: baseData } = useListKnowledgeQuery({
    chatbot: chatbot.slug,
  });
  const { data: productsData } = useListProductsQuery({
    chatbot: chatbot.slug,
  });
  const { data: servicesData } = useListServicesQuery({
    chatbot: chatbot.slug,
  });

  const counts = {
    base: baseData?.meta?.count ?? 0,
    products: productsData?.meta?.count ?? 0,
    services: servicesData?.meta?.count ?? 0,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {SUB_TABS.map((tab) => (
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
            <span className="truncate">{tab.label}</span>
            <span
              className={cn(
                "center h-4.5 min-w-4.5 rounded-full px-1 text-[10px] font-bold",
                activeSubTab === tab.value
                  ? "bg-primary/10 text-primary"
                  : "bg-background/70 text-muted-foreground",
              )}
            >
              {counts[tab.value]}
            </span>
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
