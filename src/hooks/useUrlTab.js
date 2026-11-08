import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Keeps a validated tab value in a URL search parameter while preserving
 * every other parameter on the page.
 */
const useUrlTab = ({ tabs, defaultTab, paramName = "tab", replace = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabValues = useMemo(
    () => new Set(tabs.map((tab) => tab.value)),
    [tabs],
  );
  const fallbackTab = tabValues.has(defaultTab) ? defaultTab : tabs[0]?.value;
  const tabFromUrl = searchParams.get(paramName);
  const activeTab = tabValues.has(tabFromUrl) ? tabFromUrl : fallbackTab;

  const setActiveTab = useCallback(
    (nextTab) => {
      if (!tabValues.has(nextTab)) return;

      setSearchParams(
        (currentParams) => {
          const nextParams = new URLSearchParams(currentParams);
          nextParams.set(paramName, nextTab);
          return nextParams;
        },
        { replace },
      );
    },
    [paramName, replace, setSearchParams, tabValues],
  );

  return [activeTab, setActiveTab];
};

export default useUrlTab;
