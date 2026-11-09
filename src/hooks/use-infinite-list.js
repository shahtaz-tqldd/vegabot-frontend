import { useCallback, useEffect, useRef, useState } from "react";

const mergeById = (previous = [], incoming = []) => {
  const byId = new Map(previous.map((item) => [item.id, item]));

  incoming.forEach((item) => {
    if (item && item.id != null) byId.set(item.id, item);
  });

  return [...byId.values()];
};

const useInfiniteList = ({ useQuery, args, itemsKey, pageSize = 20 }) => {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [processedData, setProcessedData] = useState(null);
  const [processedArgsKey, setProcessedArgsKey] = useState(null);
  const argsKey = JSON.stringify(args);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    ...args,
    page,
    page_size: pageSize,
  });

  if (processedArgsKey !== argsKey) {
    setProcessedArgsKey(argsKey);
    setProcessedData(null);
    setPage(1);
    setItems([]);
  }

  if (processedData !== data) {
    setProcessedData(data);

    if (data) {
      const incoming = data[itemsKey] ?? [];

      setItems((previous) =>
        page === 1 ? incoming : mergeById(previous, incoming),
      );
    }
  }

  const meta = data?.meta ?? {};
  const count = meta.count ?? null;
  const hasMore =
    meta.next != null
      ? true
      : meta.next === null
        ? false
        : (data?.[itemsKey] ?? []).length === pageSize;

  const loadMore = useCallback(() => {
    setPage((current) =>
      hasMore && !isFetching && !isLoading ? current + 1 : current,
    );
  }, [hasMore, isFetching, isLoading]);

  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || isLoading || isFetching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "160px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, isFetching, isLoading, loadMore, items.length]);

  const reset = useCallback(() => setPage(1), []);

  return {
    items,
    count,
    hasMore,
    isLoading,
    isFetching,
    isError,
    refetch,
    sentinelRef,
    reset,
  };
};

export default useInfiniteList;
