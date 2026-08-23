import { Button } from "./button";

export function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  label = "Load more",
  showEnd = true,
  root,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  label?: string;
  showEnd?: boolean;
  root?: { current: Element | null };
}) {
  function observeSentinel(element: HTMLDivElement | null) {
    if (!element || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMore();
      },
      {
        root: root?.current ?? null,
        rootMargin: root ? "80px 0px" : "240px 0px",
        threshold: 0,
      },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }

  if (!hasNextPage && !showEnd) return null;

  return (
    <div
      ref={observeSentinel}
      className="mt-5 flex flex-col items-center gap-2 py-2"
      role="status"
      aria-live="polite"
    >
      {hasNextPage ? (
        <Button type="button" disabled={isFetchingNextPage} onClick={onLoadMore}>
          {isFetchingNextPage ? "Loading…" : label}
        </Button>
      ) : (
        <p className="text-sm text-app-muted">End of results</p>
      )}
    </div>
  );
}
