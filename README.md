# Lab Orders Lite

A small, production-minded application for managing patients, lab-test catalogs, and lab orders.

Lab Orders Lite is intentionally a **polished vertical slice**, not a miniature hospital platform. The project
prioritizes correctness, clear boundaries, strong typing, high-value tests, and an excellent local-development
experience.

## What it supports

- View, search, create, and edit patients
- View, filter, create, edit, activate, and deactivate lab tests
- Create an order for a patient with one or more active tests
- Preview individual prices, total cost, turnaround, and estimated ready time
- Browse orders with patient/status filters and cursor pagination
- Inspect historical order details and update order status

The primary workflow is:

```text
Select or create a patient
          ↓
Choose one or more lab tests
          ↓
Review prices, total, and estimated readiness
          ↓
Create the order atomically
          ↓
Inspect and find the historical order
```

## Technology

| Area                            | Choice                                     |
| ------------------------------- | ------------------------------------------ |
| Runtime, package manager, tests | Bun                                        |
| Language                        | TypeScript (strict)                        |
| Web                             | React + Vite                               |
| Routing and server state        | TanStack Router + Query                    |
| Forms                           | TanStack Form                              |
| Validation/contracts            | Zod                                        |
| API                             | Hono REST/JSON API                         |
| Persistence                     | Drizzle ORM + libSQL                       |
| Local database                  | Turso CLI development server               |
| Styling                         | Tailwind CSS v4                            |
| Browser testing                 | Playwright (one focused primary-flow test) |

No hosted account is required for local development. Database configuration is compatible with a future Turso Cloud
deployment without changing the persistence layer.

## Architecture

```text
React SPA
  │
  │  REST/JSON through /api
  ▼
Hono feature routes
  │
  ├── Zod request validation and response shaping
  ├── Patient/catalog: focused Drizzle CRUD
  └── Orders: application service
        ├── Framework-independent domain rules
        └── Drizzle transaction and snapshots
                 │
                 ▼
          Local Turso / libSQL
```

The frontend and API are separate applications in one Bun workspace:

```text
lab-orders-lite/
├── apps/
│   ├── api/          # Hono API and persistence adapters
│   └── web/          # React/Vite SPA
├── packages/
│   ├── contracts/    # Framework-independent Zod API contracts
│   └── domain/       # Pure business rules and calculations
├── drizzle/          # Committed database migrations and metadata
├── plans/            # Current progress and later enhancements
├── scripts/          # Isolated Playwright server helper
└── orig_instructions.md
```

This keeps HTTP as the canonical application boundary while allowing the two apps to share contracts and pure domain
logic. A CLI, mobile app, or other client could use the API later without depending on React. Patient and catalog CRUD
remain in focused route modules because another service layer would only delegate; order creation earns an application
service because it coordinates lookups, business rules, derived values, snapshots, and one transaction.

## Domain decisions

### Money uses integer cents

Prices and totals are represented as integer cents. Floating-point dollar arithmetic never determines persisted
financial values.

### Orders preserve history

Order items snapshot the selected test’s:

- code
- name
- price in cents
- turnaround in hours

An order also persists its derived total and estimated-ready timestamp. Editing a catalog test later cannot rewrite what
was originally ordered.

### Ready time uses the slowest test

Turnaround is defined as elapsed hours—not business-calendar hours. An order is estimated to be ready when its slowest
selected test is ready:

```text
CBC          12 hours
CMP          24 hours
Vitamin D    48 hours

Order turnaround = 48 hours
```

The calculation lives in pure domain code and is tested independently.

### Order creation is atomic

The API—not the browser—loads current catalog values, validates the patient and selected tests, creates snapshots,
calculates totals/readiness, and writes the order plus all order items in one transaction.

### Patients are not users

A patient is a clinic record. Do not model `Patient = User` or fold identity into the domain tables. Auth stays out of scope.

### Patients need one contact method

Each patient must have an email address or phone number so the clinic has a way to share results. Either field may be omitted,
and updates cannot clear the last remaining contact method. This is a deliberately small workflow rule rather than a full
communication-preference model.

### Status only moves forward

```text
pending ──────► in_progress ──────► completed
   │                 │
   └──────► cancelled ◄───────────┘
```

`completed` and `cancelled` are terminal states.

### Lists use cursor pagination

Patients, tests, and orders use opaque cursors with deterministic indexed ordering. Search and filters are applied
before pagination, and changing a filter resets loaded cursor state. This avoids loading entire datasets while keeping
narrowing controls simple for users.

## Development approach

Feature work follows a small **red → green → refactor** loop:

1. Write the smallest failing test for the intended behavior.
2. Implement only enough behavior to pass.
3. Improve the design while the suite remains green.
4. Commit a coherent, working increment.

Tests are placed at the lowest useful boundary:

- pure unit tests for domain calculations and status rules
- isolated-database integration tests for persistence and API behavior
- focused component tests for meaningful user interactions
- one Playwright test for the primary cross-application workflow

The project also bans direct use of React `useEffect` in repository-owned source. TanStack Query owns server
synchronization, Router owns URL state, Form owns form state, and derived values are calculated during render.

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) 1.3 or newer
- [Turso CLI](https://docs.turso.tech/cli/introduction) for local development
- Chromium for Playwright: `bunx playwright install chromium`

### Install and initialize

```bash
git clone https://github.com/jellis206/lab-orders-lite.git
cd lab-orders-lite
bun install
```

Start the local database in one terminal, then migrate and seed it from another:

```bash
# terminal 1
bun run db:dev

# terminal 2
bun run db:migrate
bun run db:seed
```

The seed is deterministic and safe to rerun. Local data is persisted in the ignored `.data/lab-orders.db` file. After
seeding, stop the standalone database process with `Ctrl+C`; `bun dev` starts its own process on the same port.

#### Large-scale testing

For performance testing and UI validation at scale, use the large seed dataset:

```bash
bun run db:seed-large
```

This populates the database with:

- **5,000 patients** with realistic names, contact info, and DOBs
- **45 lab tests** covering common medical tests
- **50,000 orders** distributed across patients
- **~150,000 order-test mappings** (most orders have 2–4 tests)
- Order dates spread across 2024–2025
- Order statuses distributed realistically (~55% completed, 20% pending, 15% in_progress, 10% cancelled)

The dataset is generated in-memory and inserted in ~4 seconds. It's safe to rerun and completely replaces existing data.

### Run the application

```bash
bun dev
```

This starts and coordinates all three development processes:

- local Turso/libSQL: <http://localhost:8080>
- Hono API: <http://localhost:3000>
- Vite web app: <http://localhost:5173>

Vite proxies `/api` to Hono. Configuration defaults to the unauthenticated local endpoint; copy `.env.example` when
overriding it or when supplying a hosted `libsql://` URL and `TURSO_AUTH_TOKEN`.

## Root commands

| Command                 | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `bun dev`               | Start local Turso, API watch mode, and Vite                      |
| `bun test`              | Run unit, integration, and component tests                       |
| `bun run e2e`           | Run the isolated Playwright primary-flow test                    |
| `bun run e2e:headed`    | Run Playwright with a visible browser                            |
| `bun run build`         | Build all applications                                           |
| `bun run typecheck`     | Strictly type-check all workspaces                               |
| `bun run lint`          | Lint all workspaces and enforce the no-`useEffect` rule          |
| `bun run format`        | Format repository source                                         |
| `bun run format:check`  | Check repository formatting without changing files               |
| `bun run check`         | Run typecheck, lint, tests, and builds                           |
| `bun run db:dev`        | Start the persisted local Turso server                           |
| `bun run db:generate`   | Generate Drizzle migrations                                      |
| `bun run db:migrate`    | Apply committed migrations                                       |
| `bun run db:seed`       | Seed deterministic small dataset (4 patients, 6 tests, 4 orders) |
| `bun run db:seed-large` | Seed large dataset for scale testing (5k patients, 50k orders)   |
| `bun run db:studio`     | Open Drizzle Studio                                              |

Database scripts live in `tools/db/` and are not included in production builds.

`bun run e2e` reuses a running `bun dev` stack when one is already up. Otherwise it starts an isolated file database,
migrates, seeds, then serves the API and Vite app. Stop any conflicting process on ports 3000 or 5173 first if the
isolated server cannot bind.

## Scripts and tooling

One-off scripts for development live in `tools/db/` and are excluded from production builds:

- `db-seed.ts` – Seeds the small deterministic dataset
- `db-seed-large.ts` – Seeds a large dataset for scale testing (~5k patients, 50k orders)
- `db-migrate.ts` – Applies pending database migrations

Run them via `bun run db:seed`, `bun run db:seed-large`, and `bun run db:migrate` from the root.

## Scope and trade-offs

The project deliberately does **not** include:

- authentication or authorization
- multi-tenancy
- patient/provider user accounts
- business-day or holiday-aware turnaround calculations
- notifications or audit logging
- billing and payment processing
- external lab integrations
- GraphQL, queues, event buses, or microservices
- AI, embeddings, or vector search

OpenAPI is deferred. The Playwright suite is intentionally one primary-flow test rather than a second copy of the unit
and API suites. The goal is finished, explainable behavior rather than unfinished breadth.

If this moved beyond a take-home, the first improvements would be authentication/authorization and audit history before
using real patient data, followed by an explicit clinic-timezone and business-calendar policy. I would add OpenAPI or more
browser flows only when another client or a demonstrated regression risk justified their maintenance cost.

## Delivery

The original nine-phase plan is complete. Current status and later ideas live in [`plans/PROGRESS.md`](./plans/PROGRESS.md).

## AI usage

AI coding agents were used throughout planning and implementation. I treated them as a drafting tool, not as an
authority: every kept change was read, tested, and edited until I could explain it.

Where they helped:

- Drafting the original plan and phase tickets
- Scaffolding feature modules, Zod contracts, tests, and Catalyst/Headless UI adaptations
- Proposing review fixes (including CodeRabbit findings)

What I changed or rejected:

- Kept the chosen stack (Bun, Hono, Drizzle, TanStack, Zod) and did not add extra frameworks
- Moved business rules into contracts/domain instead of growing Hono handlers
- Banned `useEffect` in app code; Query/Router/Form own those concerns
- Dropped suggestions that added generic repositories, extra client state libraries, or business-calendar turnaround
