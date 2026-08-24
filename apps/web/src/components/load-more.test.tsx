import { afterEach, beforeEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { LoadMore, type Pager } from "./load-more";

class FakeIntersectionObserver implements IntersectionObserver {
  static callbacks: IntersectionObserverCallback[] = [];
  static roots: (Element | Document | null)[] = [];
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds: number[] = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    FakeIntersectionObserver.callbacks.push(callback);
    FakeIntersectionObserver.roots.push(options?.root ?? null);
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

let realIntersectionObserver: typeof IntersectionObserver;

beforeEach(() => {
  realIntersectionObserver = globalThis.IntersectionObserver;
  FakeIntersectionObserver.callbacks = [];
  FakeIntersectionObserver.roots = [];
  globalThis.IntersectionObserver = FakeIntersectionObserver;
});

afterEach(() => {
  globalThis.IntersectionObserver = realIntersectionObserver;
  cleanup();
});

function scrollSentinelIntoView() {
  const box = new DOMRect();
  FakeIntersectionObserver.callbacks.at(-1)?.(
    [
      {
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: box,
        intersectionRect: box,
        rootBounds: null,
        target: document.body,
        time: 0,
      },
    ],
    new FakeIntersectionObserver(() => undefined),
  );
}

function pagerStub(overrides: Partial<Pager> = {}): Pager {
  return {
    hasNextPage: true,
    isFetchingNextPage: false,
    fetchNextPage: async () => ({}),
    ...overrides,
  };
}

/** Mirrors a real infinite query: fetching a page eventually exhausts the list. */
function PagedList({ pages }: { pages: number }) {
  const [loaded, setLoaded] = useState(1);
  return (
    <LoadMore
      pager={{
        hasNextPage: loaded < pages,
        isFetchingNextPage: false,
        fetchNextPage: async () => {
          setLoaded((current) => current + 1);
          return {};
        },
      }}
    />
  );
}

test("loads the next page when the sentinel intersects", () => {
  const loads: number[] = [];
  render(
    <LoadMore
      pager={pagerStub({
        fetchNextPage: async () => {
          loads.push(1);
          return {};
        },
      })}
    />,
  );

  scrollSentinelIntoView();

  expect(loads).toEqual([1]);
});

test("uses the assigned picker scroll region as the observer root", async () => {
  function Picker() {
    const [root, setRoot] = useState<HTMLDivElement | null>(null);
    return (
      <div ref={setRoot} role="region" aria-label="Picker results">
        <LoadMore pager={pagerStub()} variant="picker" root={root} />
      </div>
    );
  }

  render(<Picker />);
  const root = screen.getByRole("region", { name: "Picker results" });

  await waitFor(() => expect(FakeIntersectionObserver.roots).toEqual([root]));
});

test("keeps an explicit load more control for keyboard users", () => {
  const loads: number[] = [];
  render(
    <LoadMore
      pager={pagerStub({
        fetchNextPage: async () => {
          loads.push(1);
          return {};
        },
      })}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Load more" }));

  expect(loads).toEqual([1]);
});

test("keeps focus on the control while the next page loads", async () => {
  render(<PagedList pages={3} />);
  const control = screen.getByRole("button", { name: "Load more" });
  fireEvent.focus(control);

  await act(async () => {
    fireEvent.click(control);
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  });

  await waitFor(() => expect(document.activeElement).toBe(control));
});

test("moves focus to the end message when the last page arrives", async () => {
  render(<PagedList pages={2} />);
  const control = screen.getByRole("button", { name: "Load more" });
  fireEvent.focus(control);

  await act(async () => {
    fireEvent.click(control);
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  });

  const end = await screen.findByText("End of results");
  await waitFor(() => expect(document.activeElement).toBe(end));
});

test("stays focusable rather than disabled while fetching", () => {
  const loads: number[] = [];
  render(
    <LoadMore
      pager={pagerStub({
        isFetchingNextPage: true,
        fetchNextPage: async () => {
          loads.push(1);
          return {};
        },
      })}
    />,
  );
  const control = screen.getByRole("button", { name: "Loading…" });

  expect(control.hasAttribute("disabled")).toBe(false);
  expect(control.getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(control);
  expect(loads).toEqual([]);
});

test("keeps the end-of-results live region mounted so the change is announced", () => {
  const { rerender } = render(<LoadMore pager={pagerStub()} />);
  const region = screen.getByRole("status");
  expect(region.textContent).toBe("");

  rerender(<LoadMore pager={pagerStub({ hasNextPage: false })} />);

  expect(screen.getByRole("status")).toBe(region);
  expect(region.textContent).toBe("End of results");
});

test("renders nothing for an exhausted picker", () => {
  const { container } = render(
    <LoadMore pager={pagerStub({ hasNextPage: false })} variant="picker" />,
  );

  expect(container.textContent).toBe("");
});
