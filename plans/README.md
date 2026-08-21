# Lab Orders Lite — Delivery Plan

## Context

This directory is the implementation backlog for Lab Orders Lite. Each numbered document is a phase-sized ticket defining the problem, recommended approach, commit-sized work units, acceptance criteria, files, reuse, and verification.

The plan is based on:

- [`../orig_instructions.md`](../orig_instructions.md) — assignment acceptance criteria
- [`../project.md`](../project.md) — selected stack, architecture, domain rules, and scope

The repository currently contains an uncommitted Bun workspace, minimal Hono scaffold, stock Vite/React scaffold, and empty `contracts` and `domain` packages. There is no Git history yet.

## Delivery principles

- Build vertically with test-driven development and keep every commit runnable and green.
- For each behavior, use a local **red → green → refactor** loop: write the smallest failing test, implement only enough to pass, then improve names/design while tests stay green. Commit the completed green behavior, not a knowingly failing intermediate state.
- Prefer the lowest valuable test boundary: pure unit tests for domain rules, isolated-database integration tests for API/persistence, and focused component/E2E tests for critical user behavior. Avoid brittle implementation-detail and snapshot-heavy tests.
- Map tests directly to each ticket’s acceptance criteria so passing checks continually demonstrate forward progress.
- Keep Hono handlers thin and the REST API canonical.
- Validate untrusted input with shared Zod contracts; do not expose database row types.
- Keep meaningful calculations independent of Hono, React, and Drizzle.
- Prefer feature-specific modules over generic repositories or enterprise layers.
- Use integer cents and immutable order-test snapshots for historical correctness.
- Use Tailwind CSS v4 and only the locally licensed Catalyst components needed by the app.
- Ban direct React `useEffect` throughout repository-owned source. Use TanStack Query/Router/Form, event handlers, render-time derivation, or `useSyncExternalStore` according to the concern; enforce the rule with static checks.
- Keep repository-wide agent instructions in `AGENTS.md`, not a model-specific instruction file.
- Run local development against `turso dev` with a persisted local database file and environment-driven libSQL URL/token configuration that can point to Turso Cloud later.
- Complete correctness and the primary order flow before optional breadth.

## Phase tickets

1. [Foundation and developer experience](./01-foundation.md)
2. [Persistence foundation](./02-persistence.md)
3. [Patients vertical slice](./03-patients.md)
4. [Lab-test catalog](./04-lab-tests.md)
5. [Order domain and API](./05-order-domain-api.md)
6. [Order creation UI](./06-order-creation-ui.md)
7. [Order browsing and details](./07-orders-browsing.md)
8. [Quality and polish](./08-quality-polish.md)
9. [Documentation and submission review](./09-documentation-review.md)

## Confirmed scope decisions

- First commit captures the supplied uncommitted requirements/scaffold as a baseline.
- Snapshot test code, name, price, and turnaround; persist order total and estimated-ready timestamp.
- Statuses are `pending`, `in_progress`, `completed`, and `cancelled`, editable on order details.
- All primary list APIs use opaque cursor pagination with deterministic indexed ordering. Search/filter criteria remain easy to change and reset cursor state.
- OpenAPI is deferred; one Playwright flow is added only after core unit/integration coverage.
- Feature work follows TDD; each commit ends with tests and relevant quality checks green.
- Repository-authored React code does not use `useEffect`.
- Local persistence is served by the Turso CLI; hosted Turso remains an environment configuration change rather than a redesign.

## Overall definition of done

- A reviewer can install, migrate, seed, run, test, and build from root scripts.
- After persistence setup, `bun dev` starts the local Turso server, Vite SPA, and Hono API with rapid reload and `/api` proxying.
- Patients and catalog tests can be viewed, created, and edited.
- A patient can receive an order with one or more active tests.
- The server derives snapshots, total, and estimated-ready time atomically.
- Existing orders remain historically correct after catalog edits.
- Patients, tests, and orders use cursor pagination with useful narrowing filters; orders can be searched/filtered and inspected.
- Core domain and API behavior is developed test-first and has high-value automated coverage traceable to acceptance criteria.
- The primary workflow is readable, responsive, accessible, and handles loading/error/empty/success states.
- README documents setup, architecture, decisions, trade-offs, limitations, and AI usage.
