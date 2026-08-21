# Lab Orders Lite

A small, production-minded application for managing patients, lab-test catalogs, and lab orders.

Lab Orders Lite is intentionally a **polished vertical slice**, not a miniature hospital platform. The project
prioritizes correctness, clear boundaries, strong typing, high-value tests, and an excellent local-development
experience.

## What it will support

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
Hono routes
  │
  ├── Zod request validation
  │
  ▼
Feature application services
  │
  ├── framework-independent domain rules
  │
  ▼
Drizzle data access
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
├── plans/            # Phase tickets and acceptance criteria
├── orig_instructions.md
└── project.md
```

This keeps HTTP as the canonical application boundary while allowing the two apps to share contracts and pure domain
logic. A CLI, mobile app, or other client could use the API later without depending on React.

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
- [Turso CLI](https://docs.turso.tech/cli/introduction) for the local database phase

### Current scaffold

```bash
git clone https://github.com/jellis206/lab-orders-lite.git
cd lab-orders-lite
bun install
bun dev
```

This currently starts:

- Vite web app: <http://localhost:5173>
- Hono API: <http://localhost:3000>

Database migration and seed commands are already reserved at the root and will become active in the persistence phase:

```bash
bun run db:dev
bun run db:migrate
bun run db:seed
```

The final local workflow will keep `bun dev` responsible for starting local Turso, the API, and the web app together.

## Planned root commands

| Command               | Purpose                                                 |
| --------------------- | ------------------------------------------------------- |
| `bun dev`             | Start local Turso, API watch mode, and Vite             |
| `bun test`            | Run unit, integration, and component tests              |
| `bun run build`       | Build all applications                                  |
| `bun run typecheck`   | Strictly type-check all workspaces                      |
| `bun run lint`        | Lint all workspaces and enforce the no-`useEffect` rule |
| `bun run format`      | Format repository source                                |
| `bun run db:dev`      | Start the persisted local Turso server                  |
| `bun run db:generate` | Generate Drizzle migrations                             |
| `bun run db:migrate`  | Apply committed migrations                              |
| `bun run db:seed`     | Seed deterministic fictional data                       |

Commands in this table are implemented and verified as their owning phase lands. See the current ticket status in
[`plans/`](./plans/README.md).

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

OpenAPI is deferred until the core workflow is complete. The goal is finished, explainable behavior rather than
unfinished breadth.

## Delivery plan

Implementation is split into reviewable phase tickets:

1. [Foundation and developer experience](./plans/01-foundation.md)
2. [Persistence foundation](./plans/02-persistence.md)
3. [Patients vertical slice](./plans/03-patients.md)
4. [Lab-test catalog](./plans/04-lab-tests.md)
5. [Order domain and API](./plans/05-order-domain-api.md)
6. [Order creation UI](./plans/06-order-creation-ui.md)
7. [Order browsing and details](./plans/07-orders-browsing.md)
8. [Quality and polish](./plans/08-quality-polish.md)
9. [Documentation and submission review](./plans/09-documentation-review.md)

Each ticket defines its problem, approach, commit-sized steps, acceptance criteria, and verification commands.

## AI usage

AI tools are used as a planning and implementation accelerator. Generated suggestions are reviewed, adapted, tested, and
kept only when they remain understandable and consistent with the project’s constraints. Every significant design and
implementation choice should be explainable during the follow-up interview.
