Build **Lab Orders Lite** as a small, polished, production-minded take-home application for managing patients, lab
tests, and lab orders.

The goal is not to maximize features. Build a **meaningful, finished vertical slice** that demonstrates good engineering
judgment, clean architecture, thoughtful data modeling, testing discipline, and excellent developer experience.

Optimize for:

- simplicity
- performance
- maintainability
- strong typing
- clear boundaries
- easy local development
- easy live modification during an interview

Avoid unnecessary abstraction, speculative infrastructure, and adding technologies merely because they are interesting.

---

# Product Requirements

Build a mini clinic/lab-order system supporting:

## Patients

Allow users to:

- view patients
- create patients
- edit patients
- search/select patients when creating orders

A patient should include at minimum:

- first name
- last name
- date of birth
- email
- phone

Contact fields may be optional where appropriate.

---

## Lab Test Catalog

Allow users to:

- view available lab tests
- create lab tests
- edit lab tests

A lab test should include at minimum:

- code
- name
- price
- turnaround time
- active/inactive status if useful

Lab test codes should be unique.

Store monetary values as **integer cents**, never floating-point dollars.

---

## Orders

Allow users to create an order for a patient containing **one or more lab tests**.

An order should include:

- patient
- selected tests
- order status
- ordered date/time
- total cost
- estimated ready date

The order creation workflow should clearly show the user:

- selected tests
- individual prices
- total price
- estimated turnaround / ready date

---

## Historical Correctness

Treat orders as historical records.

If a catalog test costs `$30` when an order is created and its catalog price later changes to `$35`, the existing order
must still represent the original `$30` price.

Snapshot relevant catalog data onto the ordered test record, including at least:

- price in cents
- turnaround duration

Consider whether test name/code should also be snapshotted and make a deliberate decision.

---

## Estimated Ready Date

Define a clear business rule for calculating the estimated ready date.

For the initial implementation, a reasonable rule is:

> The order is estimated to be ready when the slowest selected test is ready.

For example:

```text
CBC             12 hours
CMP             24 hours
Vitamin D       48 hours

Order turnaround = 48 hours
```

Keep this calculation in pure, independently testable domain logic.

Document assumptions such as whether turnaround means elapsed hours or business hours.

Do not implement complicated business-calendar behavior unless necessary.

---

## Orders List

Provide an orders screen that supports useful browsing.

At minimum support:

- viewing orders
- filtering/searching by patient
- filtering by status

If useful and inexpensive to implement, also support:

- sorting
- pagination
- viewing order details

Use URL search parameters for durable filter/search state where appropriate.

---

# Core Technology Stack

Use the following stack unless there is a concrete technical reason not to.

## Runtime and Tooling

- **Bun**

  - package manager
  - runtime
  - workspace manager
  - scripts
  - test runner where appropriate

- **TypeScript**

  - strict mode

Keep Node-specific assumptions out of the code where Bun-native/web-standard alternatives are straightforward.

---

# Repository Structure

Use a **single Bun workspace/monorepo**.

The frontend and backend should be architecturally separate applications while living in the same repository.

Prefer approximately:

```text
lab-orders-lite/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── contracts/
│   └── domain/
│
├── drizzle/
├── package.json
├── bun.lock
└── README.md
```

Do not add Turborepo, Nx, or another monorepo orchestration framework. Bun workspaces and root scripts are sufficient
for a project of this size.

The exact internal structure may evolve if a simpler arrangement becomes clearly preferable.

---

# Frontend

Use:

- **React**
- **Vite**
- **TanStack Router**
- **TanStack Query**
- **TanStack Form**
- **TanStack Table only where it provides real value**
- **Zod**

Do **not** use TanStack Start.

The frontend should be a normal React SPA communicating with the backend through the HTTP API.

---

## TanStack Router

Use TanStack Router for typed application routing.

Likely routes include:

```text
/
├── /patients
│   ├── /new
│   └── /$patientId
│
├── /tests
│   ├── /new
│   └── /$testId
│
└── /orders
    ├── /new
    └── /$orderId
```

Keep route organization simple.

---

## TanStack Query

Use TanStack Query for **server state**.

Do not manually reproduce caching/refetching with large amounts of:

```text
useState
useEffect
manual loading state
manual cache synchronization
```

Use appropriate query keys and invalidate/refetch relevant data after mutations.

Good candidates include:

- patients
- lab tests
- orders
- order details

---

## TanStack Form

Use TanStack Form for meaningful forms such as:

- create/edit patient
- create/edit lab test
- create order

Integrate it with Zod where practical.

Provide useful inline validation messages.

---

## TanStack Table

Use TanStack Table where it actually helps, particularly for the orders list if implementing:

- filtering
- sorting
- pagination
- column rendering

Do not introduce it for trivial lists simply because it is available.

---

# API

Use **Hono** running on Bun.

The Hono API is the **canonical application boundary**.

Use conventional REST/JSON rather than GraphQL.

The frontend should consume this API just like any other client.

Design the API so future consumers such as these could reasonably use it:

```text
React web app
CLI
MCP server
mobile application
partner integration
```

Do not build those consumers now.

---

# REST Design

Prefer conventional resources such as:

```text
GET    /api/patients
POST   /api/patients
GET    /api/patients/:id
PATCH  /api/patients/:id

GET    /api/tests
POST   /api/tests
GET    /api/tests/:id
PATCH  /api/tests/:id

GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
```

Exact endpoints may differ if another design is clearly cleaner.

Use appropriate HTTP status codes.

Examples:

```text
200 OK
201 Created
204 No Content
400 Bad Request
404 Not Found
409 Conflict
422 Unprocessable Content
500 Internal Server Error
```

Use a consistent error response shape.

---

# API Contracts and Zod

Use **Zod** at application boundaries.

Validate all untrusted API input.

Keep request/response DTOs explicit.

Do not simply expose database row types as the public API because doing so reduces code.

Database schemas and API schemas have different responsibilities.

Shared API contracts should live somewhere appropriate such as:

```text
packages/contracts/
```

For example:

```text
packages/contracts/
├── patients.ts
├── lab-tests.ts
├── orders.ts
└── common.ts
```

Keep these contracts framework-independent.

Avoid maintaining duplicate TypeScript interfaces when Zod can infer the corresponding type.

---

# OpenAPI

If it can be integrated without introducing substantial complexity, expose/generated **OpenAPI documentation** for the
Hono API.

This is valuable because the API is intentionally designed as a reusable product boundary.

Do not let OpenAPI work consume significant project scope.

---

# Backend Architecture

Keep Hono route handlers thin.

Prefer:

```text
HTTP request
     ↓
Zod validation
     ↓
Hono route
     ↓
application/domain service
     ↓
data-access module
     ↓
Drizzle
     ↓
libSQL
```

A route should primarily handle transport concerns:

- reading validated input
- invoking application functionality
- translating known errors to HTTP responses
- returning output

Business rules should not live inside large route handlers.

---

# Domain/Application Logic

Keep meaningful business logic independent of:

- Hono
- React
- Drizzle
- HTTP

Examples:

```text
calculateOrderTotal()
calculateEstimatedReadyAt()
createOrder()
changeOrderStatus()
```

Pure calculations should be pure functions where practical.

This makes the code easier to:

- test
- reason about
- modify during the interview
- reuse from future transports such as CLI/MCP

---

# Avoid Architecture Astronautics

Do not introduce generic enterprise-style layers simply for pattern purity.

Avoid things like:

```text
AbstractRepository<T>
BaseController
BaseService
FactoryFactory
IoC container
CQRS framework
event bus
```

unless the application develops an actual requirement for them.

A feature-specific module such as:

```text
orders/
├── order.service.ts
├── order.repository.ts
└── order.domain.ts
```

is reasonable if each piece has a meaningful responsibility.

Do not force every simple CRUD operation through unnecessary indirection.

---

# Persistence

Use:

- **Drizzle ORM**
- **libSQL / SQLite**

For local development and evaluation, use a local database so the reviewer does not need cloud infrastructure.

The application should be runnable after cloning without requiring a hosted database account.

Keep the persistence configuration compatible with a future hosted libSQL/Turso deployment if practical, but do not
require Turso.

---

# Drizzle

Use Drizzle as:

- schema definition
- typed query layer
- migration tooling

Keep database schemas strongly typed.

Use generated migrations and commit them to the repository.

Provide root scripts such as:

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
```

Use Drizzle transactions for multi-record operations that should be atomic.

Order creation is an important example.

---

# Suggested Data Model

At minimum model:

```text
Patient
LabTest
Order
OrderTest
```

Conceptually:

```text
Patient
  └── Orders
        └── OrderTests
              └── LabTest
```

A reasonable relational representation is:

```text
patients

lab_tests

orders
  patient_id → patients.id

order_tests
  order_id → orders.id
  lab_test_id → lab_tests.id
```

`order_tests` should contain snapshot fields required for historical correctness.

---

## Patient

Potential fields:

```text
id
first_name
last_name
date_of_birth
email
phone
created_at
updated_at
```

---

## Lab Test

Potential fields:

```text
id
code
name
price_cents
turnaround_hours
active
created_at
updated_at
```

Use a unique constraint/index for `code`.

---

## Order

Potential fields:

```text
id
patient_id
status
ordered_at
created_at
updated_at
```

Decide deliberately whether derived totals/ready dates should be persisted or calculated.

Explain the choice.

---

## Order Test

Potential fields:

```text
order_id
lab_test_id
price_cents
turnaround_hours
```

Consider snapshotting:

```text
test_code
test_name
```

if preserving the exact historical representation of the order is valuable.

Explain whichever approach is chosen.

---

# Database Integrity

Use appropriate:

- primary keys
- foreign keys
- unique constraints
- non-null constraints
- indexes

Do not rely entirely on application code for invariants the database can safely enforce.

Examples include:

```text
unique lab test code
valid foreign keys
required names
required order/patient relationship
```

---

# Order Creation

Treat `createOrder()` as one of the project's primary pieces of business functionality.

Conceptually:

```text
createOrder(input)
    │
    ├── verify patient exists
    ├── verify test IDs exist
    ├── verify at least one test
    ├── load catalog data
    ├── snapshot test prices
    ├── snapshot turnaround
    ├── calculate total
    ├── calculate estimated ready date
    │
    └── transaction
          ├── create order
          └── create order tests
```

Avoid trusting client-supplied prices or turnaround values.

The server must derive these from the current test catalog.

---

# Development Experience

A reviewer should be able to run:

```bash
bun install
bun dev
```

and have the complete application start.

`bun dev` should start both:

```text
Vite React frontend
Bun/Hono API
```

concurrently.

Both applications should support rapid development feedback:

- Vite HMR for React
- Bun watch/hot reload behavior for Hono

Prefer root scripts rather than requiring reviewers to manually open multiple terminals.

---

# Local Development Networking

Use something like:

```text
Vite
localhost:5173

Hono
localhost:3000
```

Configure the Vite development server to proxy:

```text
/api/*
```

to the Hono backend.

Frontend application code should therefore be able to request:

```text
/api/orders
```

rather than hardcoding:

```text
http://localhost:3000/api/orders
```

Keep production deployment assumptions out of frontend source code.

---

# Root Scripts

Provide a pleasant root-level experience.

Ideally:

```bash
bun dev

bun test

bun run build

bun run lint

bun run format

bun run db:generate

bun run db:migrate

bun run db:seed
```

Exact script names may vary slightly, but common tasks should not require remembering workspace-specific commands.

---

# Database Seeding

Provide realistic seed data.

Include enough data to immediately demonstrate:

- multiple patients
- multiple tests
- different prices
- different turnaround times
- multiple orders
- different statuses
- orders containing multiple tests

Make seeded data obviously fictional.

Running the seed operation repeatedly should ideally be safe or easy to reset.

---

# UI / UX

Keep the interface polished but modest.

Do not spend most of the project building a custom design system.

Prioritize:

- readable typography
- clear page hierarchy
- obvious actions
- accessible labels
- keyboard-friendly forms
- sensible responsive layout
- useful feedback

Every asynchronous screen should handle appropriate states:

```text
loading
error
empty
success
```

Forms should clearly expose validation errors.

Mutations should provide useful feedback and update relevant server state correctly.

---

# Suggested Primary User Flow

The most polished flow should be:

```text
Open app
   ↓
View patient
   ↓
Create/select patient
   ↓
Create order
   ↓
Choose one or more lab tests
   ↓
See prices and turnaround
   ↓
See calculated total
   ↓
Submit
   ↓
See created order
   ↓
Find it in orders list
```

Optimize this path before expanding scope.

---

# Testing Strategy

Testing is a first-class deliverable.

Favor **high-value tests**, not arbitrary coverage numbers.

---

## Unit Tests

Test pure domain/business logic.

At minimum consider:

```text
calculateOrderTotal
calculateEstimatedReadyAt
order status rules
```

Test relevant edge cases.

For example:

```text
one test
multiple tests
different turnaround durations
zero tests rejected
```

---

## API / Integration Tests

Test important backend behavior against an isolated test database.

Order creation should receive especially good coverage.

Verify scenarios including:

```text
valid order is created

multiple order_tests are persisted

price snapshots are correct

catalog price changes do not alter historical orders

ready date uses correct turnaround

unknown patient is rejected

unknown test is rejected

empty test selection is rejected
```

Test transaction behavior where practical.

---

## End-to-End Testing

If time permits, add **one or two high-value E2E tests** rather than a large suite.

A strong candidate:

```text
create patient
→ create order
→ select multiple tests
→ submit
→ verify total
→ verify ready date
→ verify order appears in orders list
```

Use Playwright if adding E2E coverage.

Do not let E2E setup consume time better spent polishing core functionality.

---

# Linting / Formatting

Use lightweight tooling compatible with Bun and TypeScript.

Prefer:

- oxlint
- oxfmt or another straightforward formatter

Do not introduce a large configuration surface unless necessary.

---

# README

The README is part of the submission quality.

It should concisely cover:

## Setup

Include exact commands required to:

```text
install
configure
migrate
seed
run
test
build
```

Ideally local setup should be very close to:

```bash
bun install
bun run db:migrate
bun run db:seed
bun dev
```

or even simpler if startup can safely handle database initialization.

---

## Architecture

Explain:

```text
React/Vite
    ↓
REST
    ↓
Hono
    ↓
application/domain
    ↓
Drizzle
    ↓
libSQL
```

Explain why the frontend and API remain separate despite sharing a monorepo.

---

## Technology Decisions

Briefly explain why:

- Bun
- React/Vite
- Hono
- TanStack Query/Router/Form/Table where used
- Zod
- Drizzle
- libSQL

were selected.

Avoid marketing language.

Focus on concrete engineering trade-offs.

---

## Domain Decisions

Explain notable choices such as:

- integer cents
- snapshotting test pricing
- turnaround calculation
- transactions
- status modeling
- database constraints

---

## Trade-Offs

Explicitly document things intentionally not implemented.

Examples might include:

- authentication
- authorization
- multi-tenancy
- patient/provider accounts
- business-day turnaround calculations
- notifications
- audit logging
- advanced pagination
- full-text search
- billing
- external lab integrations

Explain that the project prioritizes a polished core over unfinished breadth.

---

# Authentication / Authorization

Authentication is **out of scope for the take-home unless required by the original assignment**.

Do not spend project time building login flows.

However, keep future identity requirements in mind.

Do not model:

```text
Patient = User
```

or:

```text
Provider = User
```

A patient/provider is a domain entity and may exist without an authenticated account.

If authentication were later introduced, the model should allow something conceptually like:

```text
User / Identity
      │
      ├── optional Patient relationship
      └── optional Provider relationship
```

Future roles may include:

```text
patient
provider
admin
```

Do not choose or integrate an authentication vendor for the current project unless required.

---

# Future API Consumers

The REST API should remain usable independently of React.

Potential future consumers include:

```text
CLI
MCP server
mobile application
external integration
```

Do not implement them now.

Their possibility is one reason the application uses a canonical HTTP API instead of frontend-specific server functions.

---

# Future Database Evolution

Do not design around hypothetical graph/database requirements today.

The current domain is straightforward relational CRUD and fits libSQL/Drizzle very well.

Keep persistence reasonably isolated from domain logic so a future change to another database does not require rewriting
the entire application.

Do not introduce excessive repository abstractions merely to prepare for a migration that may never happen.

---

# AI / Vector Features

Do not implement AI or vector functionality for the take-home.

If future requirements introduce:

- semantic lab-test search
- document retrieval
- result interpretation assistance
- embeddings

evaluate those requirements when they actually exist.

Do not select current architecture based primarily on hypothetical AI workloads.

---

# Explicit Non-Goals

Unless a requirement emerges, do not introduce:

- TanStack Start
- Next.js
- Elysia
- Prisma
- GraphQL
- Redux
- Zustand
- NestJS
- microservices
- Redis
- Kafka
- queues
- event buses
- Kubernetes
- dependency-injection frameworks
- generic enterprise repository frameworks
- external hosted infrastructure required for local development

The stack has already been selected.

Do not reopen framework selection during implementation unless there is a concrete blocker.

---

# Implementation Order

Build vertically rather than building every layer completely before seeing the application work.

## Phase 1 — Foundation

Set up:

```text
Bun workspace
apps/web
apps/api
shared packages
TypeScript
Vite
React
Hono
Drizzle
libSQL
Zod
development scripts
Vite proxy
```

Ensure:

```bash
bun dev
```

starts both frontend and API with hot reload.

---

## Phase 2 — Database

Define:

```text
Patient
LabTest
Order
OrderTest
```

Generate the initial migration.

Implement:

```text
migration
seed
database initialization
```

Seed realistic sample data.

---

## Phase 3 — First Vertical Slice

Implement **patients** end-to-end:

```text
Drizzle
→ service
→ Hono API
→ Zod contract
→ TanStack Query
→ React UI
```

Confirm the architecture feels simple before multiplying it across features.

---

## Phase 4 — Lab Test Catalog

Implement:

```text
list tests
create test
edit test
```

Add validation and appropriate tests.

---

## Phase 5 — Order Domain

Implement and test pure functionality first:

```text
calculateOrderTotal()
calculateEstimatedReadyAt()
```

Then implement:

```text
createOrder()
```

with correct transaction and snapshot behavior.

---

## Phase 6 — Order UI

Build the polished primary workflow:

```text
choose patient
choose tests
preview prices
preview total
preview estimated ready date
submit
```

Use TanStack Form and Query appropriately.

---

## Phase 7 — Orders List

Implement:

```text
order table
patient search/filter
status filter
order details
```

Use TanStack Table only if it meaningfully simplifies this experience.

---

## Phase 8 — Testing and Polish

Finish:

```text
domain unit tests
API integration tests
one E2E flow if practical
loading states
error states
empty states
accessibility
responsive polish
```

---

## Phase 9 — README / Final Review

Document:

```text
setup
architecture
decisions
trade-offs
limitations
future improvements
AI usage
```

Remove dead code and unnecessary dependencies.

Make sure a reviewer can understand the project quickly.

---

# AI Usage

AI tools are explicitly allowed by the assignment.

Keep implementation understandable enough that every significant piece of code can be explained confidently.

Do not accept generated abstractions blindly.

Prefer code that could reasonably have been written and maintained by the developer submitting the project.

The README may briefly mention that AI was used as an implementation/brainstorming accelerator and that generated work
was reviewed, modified, and understood.

---

# Engineering Principles

When choosing between two reasonable solutions, prefer the one that is:

1. easier to understand
2. easier to test
3. easier to modify
4. explicit about important behavior
5. lower in incidental complexity

Prefer:

```text
boring, understandable solutions
explicit boundaries
strong typing
database integrity
pure/testable business logic
small focused modules
clear naming
minimal dependencies
excellent local development
```

over:

```text
premature scaling
clever abstractions
framework magic
speculative infrastructure
excessive indirection
maximum technology usage
```

This application will be reviewed and later modified collaboratively during an in-person interview.

The final code should therefore optimize for:

> **An experienced engineer being able to understand the architecture quickly, identify where a change belongs, make
> that change confidently, and verify it with tests.**

When a decision is ambiguous, choose the simplest implementation that preserves correctness and these architectural
boundaries.

Do not silently introduce major technologies or architectural patterns outside this plan. If a genuine blocker requires
doing so, first identify the problem and explain the trade-off.
