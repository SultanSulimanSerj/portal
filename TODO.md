# TODO Progress Tracker

## Phases Status

- [x] Phase 0 — Repo & Tooling ✅
- [x] Phase 1 — Auth & Tenancy ✅
- [ ] Phase 2 — Objects & Members
- [ ] Phase 3 — Documents & Uploads
- [ ] Phase 4 — Tasks & Schedule
- [ ] Phase 5 — Finance
- [ ] Phase 6 — Approvals
- [ ] Phase 7 — Chat
- [ ] Phase 8 — Templates & Generation
- [ ] Phase 9 — Proposals, Contracts, Closing Docs
- [ ] Phase 10 — Numbering System
- [ ] Phase 11 — QA & Hardening

## Current Phase Details

### Phase 1 — Auth & Tenancy ⏳ Completed

- [x] Nest auth (login/register/refresh), JWT in httpOnly cookies
- [x] Company create on first login; Membership roles
- [x] Tenant guard and `app.company_id` session setter
- [x] RLS enablement and base policies

### Phase 0 — Repo & Tooling ✅ Completed
- [ ] Turborepo + PNPM workspaces (apps/api, apps/web, packages/*)
- [ ] ESLint/Prettier/Vitest/Jest/Playwright/Husky
- [ ] Shared tsconfig & path aliases
- [ ] Swagger & SDK generator script (pnpm generate:sdk)