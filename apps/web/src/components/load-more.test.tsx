import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LoadMore } from "./load-more";

afterEach(cleanup);

class FakeIntersectionObserver implements IntersectionObserver {
  static callbacks: IntersectionObserverCallback[] = [];
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds: number[] = [];

  constructor(callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.callbacks.push(callback);
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function intersectingEntry(): IntersectionObserverEntry {
  const box = new DOMRect();
  return {
    isIntersecting: true,
    intersectionRatio: 1,
    boundingClientRect: box,
    intersectionRect: box,
    rootBounds: null,
    target: document.body,
    time: 0,
  };
}

test("loads the next page when the sentinel intersects", () => {
  const original = globalThis.IntersectionObserver;
  FakeIntersectionObserver.callbacks = [];
  globalThis.IntersectionObserver = FakeIntersectionObserver;

  try {
    const loads: number[] = [];
    render(<LoadMore hasNextPage isFetchingNextPage={false} onLoadMore={() => loads.push(1)} />);
    expect(FakeIntersectionObserver.callbacks.length).toBe(1);
    FakeIntersectionObserver.callbacks[0]?.(
      [intersectingEntry()],
      new FakeIntersectionObserver(() => undefined),
    );
    expect(loads).toEqual([1]);
  } finally {
    globalThis.IntersectionObserver = original;
  }
});

test("keeps an explicit load more control for keyboard users", () => {
  const loads: number[] = [];
  render(<LoadMore hasNextPage isFetchingNextPage={false} onLoadMore={() => loads.push(1)} />);
  fireEvent.click(screen.getByRole("button", { name: "Load more" }));
  expect(loads).toEqual([1]);
});
