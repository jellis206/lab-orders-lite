import { useRef, type MouseEvent } from "react";
import { Button } from "./button";

/** How early the next page starts loading, measured from the sentinel. */
const PAGE_PREFETCH_MARGIN = "240px 0px";
const PICKER_PREFETCH_MARGIN = "80px 0px";

/** The slice of a TanStack infinite query this footer needs. */
export type Pager = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<object>;
};

export function LoadMore({
  pager,
  label = "Load more",
  variant = "page",
  root,
}: {
  pager: Pager;
  label?: string;
  /** `picker` scrolls inside `root` and stays silent once exhausted. */
  variant?: "page" | "picker";
  root?: Element | null;
}) {
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = pager;
  const endRef = useRef<HTMLParagraphElement>(null);

  // A callback ref, not an effect: this function is new on every render, so
  // React runs the returned cleanup and re-subscribes whenever the props that
  // decide whether to observe (hasNextPage, isFetchingNextPage) change.
  function observeSentinel(element: HTMLDivElement | null) {
    if (
      !element ||
      !hasNextPage ||
      isFetchingNextPage ||
      (variant === "picker" && !root)
    )
      return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNextPage();
      },
      {
        root: root ?? null,
        rootMargin: variant === "picker" ? PICKER_PREFETCH_MARGIN : PAGE_PREFETCH_MARGIN,
        threshold: 0,
      },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }

  // Keyboard users must not lose their place. The control keeps its focus while
  // fetching (aria-disabled, not disabled), and when the final page removes it,
  // focus lands on the end message instead of falling back to <body>.
  async function loadMoreFromControl(event: MouseEvent<HTMLButtonElement>) {
    if (isFetchingNextPage) return;
    const control = event.currentTarget;
    await fetchNextPage();
    requestAnimationFrame(() => {
      if (control.isConnected) control.focus();
      else endRef.current?.focus();
    });
  }

  if (!hasNextPage && variant === "picker") return null;

  return (
    <div ref={observeSentinel} className="mt-5 flex flex-col items-center gap-2 py-2">
      {hasNextPage && (
        <Button
          type="button"
          aria-disabled={isFetchingNextPage}
          onClick={(event: MouseEvent<HTMLButtonElement>) => void loadMoreFromControl(event)}
        >
          {isFetchingNextPage ? "Loading…" : label}
        </Button>
      )}
      {variant === "page" && (
        // Mounted from the start so the swap to text is announced as a change.
        <p
          ref={endRef}
          tabIndex={-1}
          role="status"
          className="text-sm text-app-muted focus:outline-none"
        >
          {hasNextPage ? "" : "End of results"}
        </p>
      )}
    </div>
  );
}
