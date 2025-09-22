
# SaaS Project Portal — Full Specification & Step‑by‑Step Build Guide

> **Goal:** Build a multi-tenant SaaS portal for managing company projects/objects with documents, schedules, tasks, finances (expenses/revenue/margin), approvals (with mandatory reason on reject), real‑time project chat, and document generation (contracts, proposals, closing docs: КС‑2, КС‑3, Акт выполненных работ, УПД) — ready for web and future mobile app.  
> **Approach:** Deliver in phases with explicit checklists so Cursor AI implements everything end‑to‑end without skipping controls or endpoints.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)  
2. [Tech Stack](#tech-stack)  
3. [Multi‑Tenancy (SaaS) & Security](#multi-tenancy-saas--security)  
4. [Domain Model](#domain-model)  
5. [Features by Area](#features-by-area)  
6. [Document Templates, Proposals & Closing Docs](#document-templates-proposals--closing-docs)  
7. [Numbering System (Masks & Sequences)](#numbering-system-masks--sequences)  
8. [API Surface (NestJS Controllers)](#api-surface-nestjs-controllers)  
9. [Frontend (Next.js) Pages & Components](#frontend-nextjs-pages--components)  
10. [Real‑Time Events](#real-time-events)  
11. [File Uploads (S3 Presigned)](#file-uploads-s3-presigned)  
12. [Validation, RBAC & RLS](#validation-rbac--rls)  
13. [Seeds & Test Plan](#seeds--test-plan)  
14. [.env & Config](#env--config)  
15. [Deployment & Ops](#deployment--ops)  
16. [Build Phases & Checklists for Cursor](#build-phases--checklists-for-cursor)  
17. [Definition of Done](#definition-of-done)  

---

## Architecture Overview

- **Monorepo** (Turborepo + PNPM workspaces)  
  ```
/apps
  /api     # NestJS (REST + WS), Drizzle, OpenAPI
  /web     # Next.js 14 (App Router)
  /mobile  # React Native (later)
/packages
  /shared  # DTOs/Zod, domain types
  /sdk     # OpenAPI-generated client
  /ui      # shared UI (shadcn/ui wrappers)
  /config  # eslint/tsconfig/prettier/jest
  ```
- **Backend**: NestJS (modules/services/guards) + Drizzle (PostgreSQL managed), Redis (BullMQ), Socket.IO gateway.
- **Frontend**: Next.js 14, Tailwind, shadcn/ui, TanStack Query, RHF+Zod.
- **Storage**: S3-compatible (AWS S3 / Backblaze / Wasabi / Yandex).
- **SaaS**: multi-tenant by `company_id`, RLS in Postgres, JWT with company scope.  
- **Contracts/SDK**: Nest OpenAPI → `/packages/sdk` for web/mobile.

---

## Tech Stack

**Backend**: NestJS (TS), Drizzle ORM, PostgreSQL (managed), Socket.IO, BullMQ + Redis, Zod, Swagger/OpenAPI, Nodemailer (dev), S3 SDK.  
**Frontend**: Next.js 14 (App Router), TailwindCSS, shadcn/ui, TanStack Query, React Hook Form + Zod, Zustand (light).  
**Mobile (later)**: React Native + generated SDK + Socket.IO client.  
**Tooling**: Turborepo, PNPM, ESLint, Prettier, Vitest/Jest, Playwright, Husky.  
**Observability**: Sentry (FE/BE), OpenTelemetry (traces), structured logs (JSON).

---

## Multi‑Tenancy (SaaS) & Security

- **Tenant boundary**: `company_id` on all rows.  
- **JWT**: includes `sub`, `company_id`, `roles`.  
- **RLS**: enabled for key tables (`objects, documents, tasks, expenses, revenues, approvals, chats, generated_documents, proposals, closings`).  
  - Policy example: `USING (company_id = current_setting('app.company_id')::uuid)`; set via `SET app.company_id = '<uuid>'` per request.
- **RBAC**: `OWNER|ADMIN|PM|WORKER|VIEWER` at company level; object-level roles `LEAD|ENGINEER|SUPERVISOR|VIEWER`.
- **Rate limit**: middleware for auth/public routes.  
- **Idempotency**: for numbering/creation endpoints (UUID key).

---

## Domain Model

> Notation: main entities only; see Drizzle schemas in code.

### Core
- **User**, **Company**, **Membership(role)**  
- **Object** (project), **ObjectMember(role, isResponsible)**  
- **Document** (versioned), **Task** (hierarchy), **Milestone**, **ScheduleItem**  
- **Comment**, **Notification**, **AuditLog**

### Finance
- **Expense** { objectId, category: MATERIALS|CONTRACTOR|RENT|LABOR|OTHER, amount, currency, date, vendor?, linkedTaskId? }  
- **Revenue** { objectId, amount, currency, date, invoiceNo? }  
- **BudgetLine** { costCode, planned, committed, actual, eac }  
- **FinanceSummary** (view/service): totals & **margin = revenue - expenses**

### Approvals
- **ApprovalRequest** { objectId, title, contextType: DOCUMENT|CHANGE|OTHER, contextId, status, dueDate, currentStep }  
- **ApprovalStep** { requestId, index, rule: ALL|ANY|QUORUM, quorumSize? }  
- **ApprovalAssignee** { stepId, userId, decision: PENDING|APPROVED|REJECTED, decidedAt?, comment }  
  - **Constraint**: `CHECK (decision <> 'REJECTED' OR (comment IS NOT NULL AND length(trim(comment))>0))`
- **ApprovalPolicy** (optional templating), **ApprovalEvent** (history)

### Chat
- **ChatThread** { objectId, title, isDefault }  
- **ChatMessage** { threadId, authorId, text, attachments?[], createdAt }  
- **ChatPresence** { threadId, userId, lastSeenAt }

### Document Templates, Proposals, Contracts, Closing Docs
- **DocTemplate(type: CONTRACT|PROPOSAL|ACT|UPD|OTHER, engine: DOCX|HTML, placeholders json)**  
- **DocTemplateVersion** { storageKey, version }  
- **GeneratedDocument(kind: CONTRACT|PROPOSAL|ACT|UPD|KS2|KS3|WORK_ACT, data json, fileKey, status, number, approvalRequestId? )**  
- **Counterparty** (legal details)  
- **Proposal** + **ProposalItem**  
- **ClosingDocument** { type: KS2|KS3|WORK_ACT|UPD, number, generatedDocumentId, totals... }

### Numbering
- **NumberingRule** { companyId, documentType, mask, periodScope: NONE|YEAR|MONTH, useProjectScope, useBranchScope }  
- **NumberingSequence** { companyId, documentType, periodKey, projectKey?, branchKey?, nextSeq }  
- **IdempotentRequest** { key, fingerprint, createdAt }

---

## Features by Area

### 1) Auth & Companies
- Register/Login/Refresh, create company on first login (OWNER).  
- Invite users by email with role.  
- White‑label subdomain `company.myapp.com`.

### 2) Projects (Objects)
- CRUD, status workflow, set single **responsible** member (`isResponsible = true` per object).  
- Tabs: Overview, Tasks, Documents, Schedule, Finance, Approvals, Chat.

### 3) Documents
- Upload via **presigned S3** (direct from browser), versioning, pdf/img preview.  
- Send to **Approvals**; link ApprovalRequest to Document via `contextType/contextId`.

### 4) Tasks & Schedule
- Tree (parentId), Kanban, filters; orderIndex drag.  
- Milestones + ScheduleItems → simple Gantt view (Recharts/divs).

### 5) Finance
- Expenses/Revenues CRUD, categories, currency; Budget lines.  
- FinanceSummary (totals & **margin**).  
- Dashboard charts (by month, by category).

### 6) Approvals
- Create request; steps with rule **ALL/ANY/QUORUM** and assignees.  
- **Reject requires reason** (backend validation + UI required input).  
- Auto‑advance between steps; notifications; timeline; escalation if overdue.  
- Policies: optional prebuilt routes by type/amount.

### 7) Chat
- Project **General** thread + extra threads; mentions @user; attachments; read receipts.  
- Real‑time via Socket.IO.

---

## Document Templates, Proposals & Closing Docs

### Templates
- Engines: **HTML+Handlebars** (→ PDF via headless Chrome) and **DOCX** (docx‑templates/docxtemplater).  
- Placeholders sample: `company.*`, `counterparty.*`, `object.*`, `proposal.*`, helpers: `formatDate`, `formatMoney`, `toUpper`, `nl2br`.

### Proposals (CPQ‑lite)
- Items with qty/unit/price, discount, tax, total, currency.  
- Generate **PDF/DOCX** from template; email SEND with expiring public link; optional online accept.

### Contracts
- Generate from template with counterparty/terms; submit to Approvals; **SIGNED** via image stamps (MVP) or provider adapters (DocuSign/Диадок).

### Closing Docs
- **КС‑2**: rows from tasks/schedule; qty/unit/price/sum.  
- **КС‑3**: aggregates КС‑2, tax.  
- **Акт выполненных работ**: from КС‑2 or tasks; template‑based.  
- **УПД**: legal details, items, taxes.  
- All with **numbering** and Approvals optional.

---

## Numbering System (Masks & Sequences)

**Defaults (configurable):**
- PROPOSAL → `PROP-{YYYY}-{SEQ:4}`  
- CONTRACT → `CON-{YYYY}-{SEQ:4}`  
- KS2 → `KS2-{YYYY}-{SEQ:3}`  
- KS3 → `KS3-{YYYY}-{SEQ:3}`  
- WORK_ACT → `ACT-{YYYY}-{SEQ:4}`  
- UPD → `UPD-{YYYY}-{SEQ:4}`

**Placeholders:** `{YY}`, `{YYYY}`, `{MM}`, `{DD}`, `{COMP}`, `{OBJ}`, `{SEQ:n}`, `{LOC}`.  
**Sequence scope:** `(companyId, type, periodScope, [OBJ], [LOC])`.  
**Reset:** YEAR (default) | MONTH | NONE.  
**Concurrency:** `SELECT ... FOR UPDATE` on `NumberingSequence` in one transaction.  
**API:**  
- `GET /numbering/rules`  
- `POST /numbering/rules`  
- `POST /numbering/preview` → `{ renderedNumber }` (no commit)  
- `POST /numbering/assign` with `idempotencyKey` → `{ number, assignedAt }`  
**UI:** preview button, generate number, admin override (audit), Settings → Numbering page.  
**Voids:** numbers never reused; document can be `VOIDED` with reason.

---

## API Surface (NestJS Controllers)

Auth/Company: `/auth/*`, `/companies`, `/memberships`  
Objects: `/objects`, `/objects/:id`, `/objects/:id/members`  
Documents: `/objects/:id/documents`, `/documents/:id`  
Tasks/Schedule: `/objects/:id/tasks`, `/objects/:id/milestones`, `/objects/:id/schedule`  
Finance: `/objects/:id/finance/expenses|revenues|summary`  
Approvals: `/objects/:id/approvals`, `/approvals/:id`, `/approvals/:id/steps`, `/approvals/:id/decision` (**`comment` required if `REJECTED`**)  
Chat: `/objects/:id/chat/threads`, `/chat/threads/:id/messages`, `/chat/threads/:id/read`  
Templates: `/doc-templates`, `/doc-templates/:id/versions`, `/templates/preview`  
Generation: `/documents/generate`, `/proposals/:id/generate`, `/contracts/:id/generate`, `/closings`  
Numbering: `/numbering/rules`, `/numbering/preview`, `/numbering/assign`  
Uploads: `/uploads/sign` (presigned POST/PUT), `/uploads/callback` (optional webhook)

All endpoints: JWT + tenant guard; Zod DTOs; OpenAPI documented.

---

## Frontend (Next.js) Pages & Components

**Pages**
- `/auth/*`  
- `/` Dashboard (my objects, deadlines, recent docs, **Finance KPI (margin)**, approvals to decide)  
- `/settings/company` (members, roles, **Numbering**, **Doc Templates**, Approval Policies)  
- `/objects` list (search/filter/tags)  
- `/objects/[id]` Overview (status, dates, responsible, progress, recent docs, **finance**, approvals, activity)  
- `/objects/[id]/tasks` (Kanban + tree)  
- `/objects/[id]/documents` (list/upload/version/preview) + **“Send to Approval”**  
- `/objects/[id]/schedule` (Gantt)  
- `/objects/[id]/finance` (expenses/revenues/budget, charts, **margin**, EAC)  
- `/objects/[id]/approvals` (list, **My decisions**, overdue, request builder, timeline)  
- `/objects/[id]/chat` (threads, messages)  
- `/objects/[id]/proposals` (list/editor/generate/send)  
- `/objects/[id]/contracts` (list/editor/generate/sign)  
- `/objects/[id]/closings` (KS‑2/KS‑3/ACT/UPD generate & list)

**Key Components**
- Form dialogs (create/edit) with RHF+Zod (required fields enforced).  
- Approvals: StepBuilder, AssigneesPicker, DecisionModal (**reject reason required**).  
- Finance: ExpenseForm, RevenueForm, CategoryPie, ByMonthChart, MarginKPI.  
- Docs: UploadButton (presigned), FilePreview (pdf/img).  
- Chat: ThreadList, MessageList (virtualized), Composer (attachments/mentions).  
- Numbering: MaskEditor (with placeholders), PreviewWidget, AdminOverrideDialog.

---

## Real‑Time Events

Namespace: `/objects/:id`  
- `chat:message.new`, `chat:message.read`  
- `approvals:request.updated`, `approvals:step.updated`  
- `notifications:new`

---

## File Uploads (S3 Presigned)

Flow:  
1) `POST /uploads/sign` → presigned POST/PUT for `key=companies/{companyId}/{uuid}/{filename}`  
2) Client uploads directly to S3.  
3) Client calls backend to save metadata to **Document** or **ChatMessage.attachments**.  
CORS on bucket; size limits set on client and bucket. No large bodies through API.

---

## Validation, RBAC & RLS

- Zod DTOs everywhere; FE disables submit if invalid.  
- Backend guards check `company_id` & role; object membership for object‑scoped actions.  
- **Approvals**: approve only if assigned in current step; ADMIN can escalate/cancel.  
- Postgres **RLS** enabled; policies per table; set `app.company_id` at connection.

---

## Seeds & Test Plan

**Seed**  
- 1 company, 5 users (OWNER, ADMIN, PM, ENGINEER, VIEWER)  
- 2 objects; 6 tasks/object; 3 docs/object; 4 schedule items; 2 milestones  
- Finance: expenses & revenues (to show **margin**)  
- Approvals: 2 requests (document & change), steps ALL & QUORUM  
- Chat: default thread & ~10 messages  
- Doc templates: CONTRACT, PROPOSAL, KS2, KS3, ACT, UPD  
- Numbering rules for all types

**API Tests (Vitest/Jest)**  
- Auth → CRUD company/object  
- Finance: add expense/revenue → summary.margin ok  
- Approvals: submit → approve/reject, **reject without comment → 400**  
- Numbering: preview vs assign (idempotent, concurrent 10x → unique seq)  
- Docs: presigned upload, metadata persisted  
- Chat: send/receive, permissions  
- RLS negative: cross‑company access denied

**E2E (Playwright)**  
- Login → create object from template → upload doc → send to approval → multi‑user approve with reason for reject  
- Add expense/revenue → Finance page shows **margin**  
- Generate Proposal → number masked, PDF rendered, send link  
- Generate KS‑2 → KS‑3 → Act → numbers assigned, totals correct  
- Realtime chat between two sessions

---

## .env & Config

```
# API
API_PORT=3001
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
APP_BASE_URL=https://api.myapp.com
APP_WEB_URL=https://app.myapp.com

# DB (managed Postgres)
DATABASE_URL=postgres://...

# Redis (BullMQ, cache)
REDIS_URL=rediss://...

# S3
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=eu-central-1
S3_BUCKET=myapp-prod
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# WebSockets
WS_ALLOWED_ORIGINS=https://app.myapp.com

# Sentry / OTEL
SENTRY_DSN=...
OTEL_EXPORTER_OTLP_ENDPOINT=...

# Email (dev)
SMTP_HOST=localhost
SMTP_PORT=1025
```

---

## Deployment & Ops

- **API (NestJS)**: Fly.io / Railway / AWS ECS/Fargate (WS friendly).  
- **Web (Next.js)**: Vercel / Cloudflare Pages.  
- **DB**: Managed Postgres (Neon/Supabase/RDS) with daily snapshots.  
- **Object Storage**: S3 (versioning on).  
- **Redis**: Upstash/Redis Cloud.  
- **CI/CD**: GitHub Actions → lint/test → drizzle migrate → deploy API → deploy Web.  
- **Monitoring**: Sentry, health endpoints, OTEL traces; JSON logs.  
- **Backups**: DB snapshots + S3 lifecycle/versions.  

---

## Build Phases & Checklists for Cursor

### Phase 0 — Repo & Tooling
- [ ] Turborepo + PNPM workspaces (`apps/api`, `apps/web`, `packages/*`)  
- [ ] ESLint/Prettier/Vitest/Jest/Playwright/Husky  
- [ ] Shared tsconfig & path aliases  
- [ ] Swagger & SDK generator script (`pnpm generate:sdk`)

### Phase 1 — Auth & Tenancy
- [ ] Nest auth (login/register/refresh), JWT in httpOnly cookies for web  
- [ ] Company create on first login; Membership roles  
- [ ] Tenant guard and `app.company_id` session setter  
- [ ] RLS enablement and base policies

### Phase 2 — Objects & Members
- [ ] CRUD Object + set **single responsible**  
- [ ] ObjectMember roles CRUD  
- [ ] Overview page widgets

### Phase 3 — Documents & Uploads
- [ ] `/uploads/sign` presigned; S3 direct upload; metadata save  
- [ ] Versioning & preview (pdf/img)  
- [ ] Link to Approvals

### Phase 4 — Tasks & Schedule
- [ ] Task tree + Kanban; filters; drag orderIndex  
- [ ] Milestones/ScheduleItems + Gantt

### Phase 5 — Finance
- [ ] Expense/Revenue CRUD; Budget lines  
- [ ] FinanceSummary service; charts; **margin KPI**

### Phase 6 — Approvals
- [ ] Request/Step/Assignee models & endpoints  
- [ ] Decision endpoint with **mandatory reject reason**  
- [ ] Timeline, notifications, escalation

### Phase 7 — Chat
- [ ] Threads, messages, read receipts  
- [ ] Socket.IO gateway & client

### Phase 8 — Templates & Generation
- [ ] DocTemplate & versions (HTML/DOCX)  
- [ ] Handlebars helpers; DOCX engine  
- [ ] `/documents/generate` return PDF/DOCX (S3)

### Phase 9 — Proposals, Contracts, Closing Docs
- [ ] Proposal editor (items, totals, currency)  
- [ ] Contracts from template  
- [ ] Closing docs (КС‑2/КС‑3/ACT/UPD) generation

### Phase 10 — Numbering System
- [ ] NumberingRule/Sequence tables  
- [ ] `preview` & `assign` (transactional, idempotent)  
- [ ] UI: Settings → Numbering; per‑type masks; admin override

### Phase 11 — QA & Hardening
- [ ] Seeds complete; API & E2E tests green  
- [ ] Rate limits; error pages; Sentry events  
- [ ] README with launch screenshots

---

## Definition of Done

- SaaS multi‑tenant with RLS; all core tabs work (Tasks, Documents, Schedule, **Finance with margin**, Approvals, Chat).  
- **Reject** path enforces reason (API + UI), visible in history & notifications.  
- Templates render **contracts**, **proposals**, **closing docs** to PDF/DOCX; numbers assigned per masks; sequences safe under concurrency.  
- Web & API deployed; SDK generated; seeds & tests included; monitoring & backups configured.

---
