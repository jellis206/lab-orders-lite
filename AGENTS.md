# Repository Instructions

## Runtime and tooling

Default to Bun instead of Node.js tooling.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`.
- Use `bun test` instead of Jest or Vitest.
- Use `bun install` instead of npm, Yarn, or pnpm.
- Use `bun run <script>` for package scripts.
- Use `bunx <package> <command>` instead of `npx`.
- Bun loads `.env` automatically; do not add `dotenv`.
- Prefer Bun-native or web-standard APIs over Node-specific packages where practical.

## Selected application stack

Do not reopen framework selection without a concrete blocker.

- Frontend: React SPA, Vite, TanStack Router, Query, and Form, Zod, Tailwind CSS v4, and selected Catalyst UI components. Add TanStack Table only if it simplifies real table behavior.
- API: Hono on Bun with REST/JSON and shared Zod contracts.
- Persistence: Drizzle and libSQL, using the Turso CLI local development server.
- Tests: Bun test for unit/integration/component tests and one focused Playwright flow.
- Stay off TanStack Start, Next.js, GraphQL, Prisma, Redux/Zustand, Express, Nest, Elysia, IoC, generic repositories, queues, and extra hosted infra for local dev.

## Frontend rules

### No `useEffect`

Direct use of React `useEffect` is banned in application code and copied/adapted UI components.

Use the purpose-built owner of each concern instead:

- TanStack Query for server fetching, caching, mutations, and synchronization.
- TanStack Router loaders/search parameters/navigation for route and URL state.
- TanStack Form for form state and validation.
- Event handlers for user-driven side effects.
- Derived values during render (or `useMemo` only for demonstrated expensive computation).
- `useSyncExternalStore` for genuine external subscriptions.

Do not use `useEffect` to synchronize one piece of React state with another, fetch data, mirror props, or drive navigation. If a third-party library internally uses effects, that does not violate this rule; do not copy effect-based implementation code into the repository.

### UI

- Use Tailwind CSS v4 and only the Catalyst components required by the application.
- Preserve/adapt Catalyst accessibility semantics; replace Next-specific links/navigation with TanStack Router.
- Keep the visual system restrained, readable, responsive, and keyboard friendly.
- Every async screen has loading, error, empty, and success states.

## Architecture and correctness

- The Hono API is the canonical application boundary; the SPA communicates through `/api`.
- Keep route handlers thin and business rules independent of Hono, React, and Drizzle.
- Validate all untrusted API input with shared Zod contracts; do not expose database row types as API DTOs.
- Store money as integer cents. The server loads catalog data and derives price, total, and ready time; never trust client-supplied money or turnaround.
- Create orders in one transaction. Snapshot each selected test’s code, name, price cents, and turnaround hours, and persist the order total and estimated-ready timestamp.
- Estimated ready time is elapsed hours for the slowest selected test, not business-calendar hours.
- Order status only moves forward: `pending` → `in_progress` → `completed`, with `cancelled` allowed from `pending` or `in_progress`. `completed` and `cancelled` are terminal.
- A patient or provider is a domain record, not a user account.
- Prefer focused feature modules over generic repositories, base services, IoC, or speculative abstractions.

## Test-driven development

Use a red → green → refactor loop for feature behavior:

1. Write the smallest test that fails for the intended behavior.
2. Implement only enough to make it pass.
3. Refactor while the suite remains green.
4. Commit completed green behavior; do not knowingly commit a failing intermediate state.

Prefer pure unit tests for domain logic, isolated-database integration tests for API/persistence, focused behavior tests for important React interactions, and one narrow Playwright test for the primary workflow. Avoid tests coupled to implementation details or large snapshots.
