import { useEffect } from "react";
import { setPageTitle } from "@/lib/document-title";

const useTitle = (title) => {
  useEffect(() => {
    setPageTitle(title);
  }, [title]);
};

export default useTitle;
