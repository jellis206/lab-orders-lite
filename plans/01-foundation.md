# Phase 1 — Foundation and Developer Experience

## Context / problem

The repo has one root workspace definition, duplicate app lockfiles, a minimal Hono response, stock Vite UI, empty shared package folders, incomplete scripts, and no commits. Before feature work, establish a predictable monorepo and prove browser-to-API development works.

## Approach

Normalize the existing scaffold rather than recreating it. Replace the model-specific `CLAUDE.md` instruction file with canonical `AGENTS.md`. Use one root Bun lockfile, strict shared TypeScript settings, stable workspace package names/exports, root task scripts, Vite proxying, and a small routed application shell. Establish Bun unit/integration testing plus focused React Testing Library support before feature slices. Add Tailwind v4 and adapt only required Catalyst primitives; do not copy its Next.js demo or introduce DaisyUI.

## Files to modify

- `package.json`, `bun.lock`, `.gitignore`, `tsconfig.json`, `AGENTS.md` (and removal of superseded `CLAUDE.md`)
- `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/index.ts`
- `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/src/**`
- `packages/contracts/package.json`, `packages/contracts/tsconfig.json`, `packages/contracts/src/index.ts`
- `packages/domain/package.json`, `packages/domain/tsconfig.json`, `packages/domain/src/index.ts`

## Reuse

- Root workspace filters/database forwarding in `package.json`
- Strict flags in `tsconfig.json`, especially `noUncheckedIndexedAccess`
- Existing entries at `apps/api/src/index.ts` and `apps/web/src/main.tsx`
- Catalyst kit at `/Users/jellis/dev/catalyst-ui-kit/typescript/`
- Catalyst Headless UI semantics and error slots; adapt links to TanStack Router

## Commit-sized steps

- [ ] **1.1 Baseline:** commit supplied requirements, scaffold, plans, and canonical `AGENTS.md` as an auditable starting point; remove the superseded `CLAUDE.md` pointer.
- [ ] **1.2 Workspace:** remove nested lockfiles, assign stable workspace package names, add exports, and align strict TS configs.
- [ ] **1.3 Test/quality harness:** first add a failing smoke test per workspace, then configure Bun tests, isolated API test app creation, focused React Testing Library support, typecheck, lint, format, and build scripts until root checks pass. Add a static quality rule/check that fails on direct `useEffect` usage in repository source.
- [ ] **1.4 Dev integration (TDD):** specify `/api/health` response in a failing Hono request test, implement it, then bind API to the documented port, proxy `/api` in Vite, and verify concurrent `bun dev`.
- [ ] **1.5 Web foundation (TDD):** write a router-shell behavior test, then add TanStack Router/Query, Tailwind v4, Headless UI/Catalyst dependencies, providers, route shell, and not-found/error boundaries. Use Router/Query primitives and render-time derivation rather than effects.
- [ ] **1.6 UI primitives:** copy/adapt only used Catalyst components and test critical navigation behavior/accessibility while creating responsive Patients / Lab Tests / Orders navigation with a restrained zinc/blue palette.

## Acceptance criteria

- One `bun.lock` governs all workspaces.
- Root scripts work without manually changing directories.
- A feature can follow red → green → refactor at domain, API/integration, and focused React component levels.
- TypeScript is strict across apps/packages.
- `AGENTS.md` is the sole repository instruction file and explicitly bans direct `useEffect`.
- Static checks reject `useEffect` in repository-owned frontend source; data synchronization/navigation/forms use TanStack tools or event-driven alternatives.
- `bun dev` starts web and API; the web app reaches `/api/health` through Vite.
- Navigation is keyboard accessible and usable at mobile/desktop widths.
- No Next.js dependency or Next-specific runtime code is copied from Catalyst.
- No stock Vite demo assets/UI remain.

## Verification

- `bun install`
- `bun run typecheck`
- `bun run lint`, including the no-`useEffect` guard
- `bun run build`
- `bun dev`, then manually verify shell navigation, mobile menu, and proxied health response
