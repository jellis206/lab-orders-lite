import { Button } from "./button";

export function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  function observeSentinel(element: HTMLDivElement | null) {
    if (!element || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMore();
      },
      { rootMargin: "240px 0px", threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }

  return (
    <div
      ref={observeSentinel}
      className="mt-5 flex flex-col items-center gap-2 py-2"
      role="status"
      aria-live="polite"
    >
      {hasNextPage ? (
        <Button disabled={isFetchingNextPage} onClick={onLoadMore}>
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      ) : (
        <p className="text-sm text-app-muted">End of results</p>
      )}
    </div>
  );
}
