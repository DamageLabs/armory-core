# Armory Core — Codebase Evaluation Report

**Date:** March 14, 2026
**Repo:** DamageLabs/armory-core
**Branch:** main

---

## 📋 Project Overview

Armory Core is an open-source inventory management system designed for tracking firearms, accessories, and ammunition. It's a full-stack web application in early alpha.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript, Vite 7, CoreUI (React Bootstrap), React Router v7, Recharts
- **Backend:** Express 4 + TypeScript (tsx), better-sqlite3 (SQLite)
- **Testing:** Vitest, Testing Library, Supertest
- **Other:** Zod validation, Resend (email), JsPDF, html5-qrcode, JsBarcode, Multer (uploads), Helmet + express-rate-limit (security)

**Codebase Size:**
- ~25,267 lines across 167 source files (105 non-test + 62 test files)
- Frontend: ~60 components, 15 services, 15 type definitions
- Backend: 14 route files, 2 services, DB layer with migrations

---

## 🏗️ Current State of Implementation

**What's Built & Working:**
- ✅ User auth (register, login, JWT, email verification via Resend)
- ✅ Role-based access (admin/user — basic level)
- ✅ Full CRUD for inventory items with custom fields per inventory type
- ✅ Inventory type system (Firearms, Accessories, Ammunition) with configurable field schemas
- ✅ Category management per inventory type
- ✅ Parent-child item relationships (e.g., optic mounted on rifle)
- ✅ Location management using gun safes as dropdown options
- ✅ Stock history tracking with movement logging
- ✅ Cost history with trend charts (Recharts)
- ✅ Bill of Materials (BOM) management
- ✅ Item templates for quick creation
- ✅ Photo gallery with multi-image upload
- ✅ Receipt/attachment management
- ✅ Item notes (markdown support)
- ✅ Maintenance/service log for firearms (recently added)
- ✅ Barcode/QR code generation and label printing
- ✅ Barcode scanner (html5-qrcode)
- ✅ CSV import/export + PDF export
- ✅ Saved filters and filter builder
- ✅ Reports: Dashboard, Valuation, Movement, Custom, Maintenance
- ✅ Reorder point alerts / low stock warnings
- ✅ Audit log (admin)
- ✅ Dark mode / theme toggle
- ✅ Keyboard shortcuts
- ✅ Security hardening (Helmet, rate limiting, password complexity)
- ✅ Bulk actions (select, delete)
- ✅ Pagination and sorting
- ✅ Quick stats bar on inventory list
- ✅ Vendor price card (mock lookups)
- ✅ DB migration system (idempotent)
- ✅ Breadcrumbs, sidebar navigation

---

## 📝 Open GitHub Issues Summary (40 open)

### Bugs (2)
- **#32** — Silent catch blocks swallowing errors without user feedback
- **#27** — Email sending failure during registration isn't handled gracefully

### Code Quality / Refactoring (11)
- **#38** — RBAC role system exists but is barely used — implement or remove
- **#37** — Magic numbers scattered throughout code need named constants
- **#36** — Missing React.memo on reusable components (perf)
- **#35** — Accessibility gaps across components
- **#33** — N+1-style parent item lookups in ItemList render loop
- **#31** — Duplicate CSV generation logic in export.ts
- **#30** — Duplicate `formatCurrency`/`formatDate` definitions (confirmed: VendorPriceCard has its own copy)
- **#29** — Large components need decomposition (ItemList is 737 lines, ItemForm is 582)
- **#28** — Deprecated `DEFAULT_CATEGORIES` still in Item.ts (confirmed present)
- **#26** — Seed data mixed into migration logic
- **#25** — N+1 query in BOM cost calculation
- **#23** — authService uses raw fetch instead of the api.ts wrapper (confirmed — duplicates auth header logic)

### UX/UI Enhancements (14)
- **#57** — Chart colors poor in dark mode
- **#56** — Item form fields should be grouped with tabs/sections
- **#55** — Drag-and-drop category reordering
- **#54** — Keyboard shortcut hint for search
- **#53** — Empty state illustration for card view
- **#52** — Toast notifications should use corner stack
- **#51** — Color coding for categories
- **#50** — Progress indicators for import/export
- **#49** — Recently viewed items section
- **#46** — Sticky table header
- **#45** — Search text highlighting in results
- **#34** — Add tests for key untested components

### Feature Requests (13)
- **#115, #114** — Evaluate migration to Angular (TailAdmin or ngx-admin)
- **#93** — Mobile-optimized quick scan mode
- **#92** — Email notification preferences
- **#89** — Import from common firearms databases
- **#88** — API keys & webhooks
- **#87** — Bulk edit for multiple fields
- **#86** — QR code deep links
- **#85** — Check-in/check-out system
- **#84** — Wishlist/shopping list
- **#82** — Customizable dashboard widgets
- **#81** — Expiration date tracking & alerts
- **#80** — Insurance & compliance report
- **#79** — Portfolio value tracking over time
- **#77** — Multi-location transfer workflow

---

## 🔍 Code Quality Observations

### Strengths
- Clean project structure — well-organized frontend (components/services/types/contexts) and backend (routes/schemas/db/services)
- Zod validation on all API endpoints with dedicated schema files
- Proper snake_case ↔ camelCase mapping layer in DB with JSON field auto-serialization
- JWT auth with middleware, email verification flow
- Idempotent migration system with FK constraint checks
- Decent test coverage: 62 test files covering backend routes, middleware, schemas, frontend services, types, contexts, and common components
- Security hardening recently added (Helmet, rate limiting, password complexity rules)
- Well-maintained CLAUDE.md with comprehensive project documentation
- Consistent error handling pattern in API routes (try/catch → console.error → 500 response)
- Audit logging service for admin visibility

### Concerns

- **authService bypasses api.ts wrapper** — duplicates auth header logic with raw `fetch()` calls instead of using the shared `api` module. Every other service uses `api.ts`. This is a consistency issue and means the 401 unauthorized event dispatch is missing.

- **Duplicate utility functions** — `formatCurrency` is defined in both `src/utils/formatters.ts` (canonical) and `src/components/items/VendorPriceCard.tsx` (local copy). Issue #30 tracks this.

- **Oversized components** — `ItemList.tsx` (737 lines), `ItemForm.tsx` (582 lines), `ItemDetail.tsx` (304 lines) are candidates for decomposition. These are the most complex UI surfaces and would benefit from being broken into sub-components.

- **RBAC is shallow** — The role system only distinguishes admin vs user in one middleware check. There's no granular permission model (e.g., can-edit, can-delete, viewer-only). Issue #38 correctly flags this as "implement or remove."

- **`DEFAULT_CATEGORIES` still exported from Item.ts** — This is dead code since categories are now dynamic and DB-driven. Should be removed (issue #28).

- **N+1 query patterns** — BOM cost calculation (issue #25) and parent item lookups during ItemList render (issue #33) could cause performance issues at scale.

- **Tests can't run** — `npm run test:run` fails because `vitest` isn't installed locally (it's resolved from a global npx cache with version mismatch). Running `npm install` should fix this, but it means CI might also be broken if not configured correctly.

- **Seed data in migration path** — `server/db/seed.ts` runs on startup alongside migrations. For a production system, seed data should be separate from schema migrations (issue #26).

- **Email failure on registration** — If Resend API call fails, the user is created but unverified with no error surfaced. The email service silently logs when no API key is configured, which is fine for dev but the actual send failure path needs handling (issue #27).

- **`.env.example` shows DATABASE_PATH as `./data/rims.db`** — But the README and project name suggest "armory". This looks like a leftover from a rename that wasn't fully updated.

---

## 📊 Recent Git Activity (last 30 commits)

Active development is ongoing. Recent work focused on:
- **Maintenance/service logging** — Full CRUD for firearm maintenance records + fleet-wide report
- **Location management** — Gun safe locations as dropdown, cascade rename, parent-child location sync
- **Security hardening** — Helmet headers, rate limiting, password complexity rules
- **UI polish** — Quick stats bar, action button wrapping fix, Recharts tooltip types
- **Cleanup** — Removed unused sql.js dependency, fixed client IP tracking for login

---

## 💡 Recommendations

### High Priority
1. **Fix the test runner** — Ensure `npm install` includes vitest locally and tests pass in CI. A project with 62 test files that can't run them has a fragile safety net.
2. **Fix authService to use api.ts** — Quick win, eliminates code duplication and ensures consistent 401 handling (issue #23).
3. **Handle email send failures** — Wrap the Resend call in try/catch during registration, surface error to user or queue for retry (issue #27).
4. **Fix the DATABASE_PATH in .env.example** — Change `rims.db` → `armory.db` for consistency.

### Medium Priority
5. **Break up large components** — ItemList (737 LOC) and ItemForm (582 LOC) are ripe for decomposition. Extract table rendering, filter bar, bulk action bar, etc. into sub-components.
6. **Remove dead code** — `DEFAULT_CATEGORIES` in Item.ts, duplicate `formatCurrency` in VendorPriceCard.
7. **Decide on RBAC** — Either build a real permission model or simplify to just admin checks. The current half-implementation creates false expectations.
8. **Fix N+1 queries** — Pre-compute parent lookups in ItemList, batch BOM cost queries.

### Low Priority / Strategic
9. **Re-evaluate Angular migration** — Issues #114 and #115 suggest evaluating a framework migration. This is a big decision. The current React codebase is functional and reasonably well-structured. Migration would be costly. Recommend deciding quickly so effort isn't wasted on the React version if migrating.
10. **Add E2E tests** — Puppeteer is in devDependencies (used for screenshots), could be leveraged for basic E2E coverage of critical flows (login, add item, search).
11. **PWA support** — `vite-plugin-pwa` is in dependencies and `manifest.json` exists. Worth completing for offline/mobile use cases.
12. **Separate seed from migrations** — Create a dedicated `seed` command vs. auto-seeding on startup.

---

## Overall Assessment

This is a surprisingly feature-rich early alpha. The core inventory management, reporting, and admin features are solid. The architecture is clean and conventional. The main risks are: test infrastructure that doesn't run, some code quality debt (large components, duplicated code, shallow RBAC), and a strategic question about whether to continue with React or migrate to Angular. The 40 open issues are well-organized and most are genuine improvements rather than critical bugs — only 2 are labeled as bugs, and both are manageable fixes.
