# Local Quality Gate

## Pre-Merge Checklist

Before merging, run:

```powershell
npm run auto
```

**Green means:**
- Build compiles without TypeScript errors
- Integrated eval protections pass (40 eval scenarios)
- All 24 Playwright E2E tests pass against Chromium (persistence flows fully active)

**If red, check:**
1. Build stage - TypeScript errors in changed files
2. Integrated evals - Presenter or cross-dossier eval regression
3. E2E - Browser didn't start (check webserver) or selector mismatch

---

## Quick Start

Run the full quality gate with one command:

```powershell
npm run auto
```

This runs in sequence:
1. `npm run build` - Production build
2. `npm run test` - Integrated eval protections (40 scenarios)
3. `npm run e2e` - Playwright browser tests (24 tests; persistence suite runs serially for deterministic DB state)

### Alternative: Legacy Quality Gate

```powershell
npm run test:quality
```

This runs the older gate:
1. `npm run build` - Production build
2. `npm run test:recommendations` - AI recommendation tests (13 evals)
3. `npm run e2e` - Playwright browser tests (24 tests)

## What It Proves

### Build
- Next.js compiles without errors

### Integrated Eval Protections (`npm run test`)
Deterministic evals that run in ~10ms:

| Suite | Scenarios | Protects |
|-------|-----------|----------|
| Completed-phase presenter | 9 | UI copy logic for Completed dossiers |
| Cross-dossier data-shaping | 13 | Relevance scoring, outcome derivation |
| Cross-dossier precedent-quality | 4 | Prompt-layer usage rules |
| Cross-dossier usefulness | 4 | Guidance enrichment behavior |
| Cross-dossier observability | 10 | Metrics calculation contract |
| **Total** | **40** | **Fast deterministic regression protection** |

### E2E Tests (`npm run e2e`)
Critical user flows verified end-to-end (24 tests, 0 skipped):
- App loads and renders
- Dossier list displays from SQLite
- Dossier creation through UI
- Task persistence: edit task name, add subtask, complete task, refresh verification
- Readiness/setup indicators appear
- Mode-aware UI behavior (phase chips, labels, actions)
- Close-out flow for completed dossiers
- Post-close-out "Review record" state

### API Contract Tests (`npm run test:api`)

HTTP-level contract verification below the E2E layer. Runs deterministically from cold start via `npm run build` → `npm run start` → test execution.

| Test | Endpoint | Contract Protected |
|------|----------|-------------------|
| GET /api/dossiers | List | Returns array with required fields |
| POST /api/dossiers | Create | Returns created dossier with id |
| GET /api/dossiers/[id] | Read | Returns dossier by id |
| PATCH /api/dossiers/[id] | Update | Persists title, situation, mainGoal, phase |
| PATCH /api/dossiers/[id] | Tasks | **Persists tasks array** |
| PATCH /api/dossiers/[id] | completedTasks | **Persists completedTasks array** |

**Runtime:** ~45-60s (includes build + production server start)
**When to run:** After any API route changes, especially PATCH persistence logic
**Why separate from `npm run auto`:** Adds ~45-60s to gate time; E2E already covers user-facing persistence paths. API contract tests provide faster failure detection for backend-only changes.

---

Before each e2e run, `scripts/seed-e2e.cjs` creates:
- `E2E Test: Execution Mode` (active, with tasks) — primary persistence/execution path
- `E2E Test: Structuring Mode` — planning path
- `E2E Test: Completed Mode` — post-close-out reference path

These are cleaned up and recreated idempotently on each run.

## Interpreting Failures

| Failure Location | Likely Cause |
|------------------|--------------|
| Build | TypeScript errors or import issues |
| Integrated Evals | Presenter copy regression or cross-dossier logic drift |
| E2E | Browser timeout (app didn't start) or selector mismatch |

## Running Individual Parts

```powershell
# Full quality gate (recommended)
npm run auto

# Just build
npm run build

# Just integrated evals
npm run test

# Just e2e (auto-seeds first)
npm run e2e

# API contract tests (deterministic cold-start)
npm run test:api

# Legacy recommendation tests
npm run test:recommendations

# Reset e2e data only
npm run db:seed:e2e

# Interactive e2e debugging
npm run e2e:ui
```

## CI Pipeline

GitHub Actions runs the quality gate on every PR and push to main:

- **Workflow:** `.github/workflows/quality-gate.yml`
- **Command:** `npm run auto` (primary gate)
- **Environment:** Ubuntu + Node 20 + Chromium

### Local vs CI

| Aspect | Local | CI |
|--------|-------|-----|
| Trigger | Manual (`npm run auto`) | PR/push to main |
| Command | `npm run auto` | `npm run auto` |
| Browser | Your installed browsers | Chromium (fresh install) |
| Database | Your SQLite file | Fresh SQLite each run |
| Setup | `npx playwright install` | `npx playwright install --with-deps chromium` |

**Key:** Both run the exact same `npm run auto` command. If it passes locally, it should pass in CI.

### Interpreting a Red Pipeline

| Stage Failure | Likely Cause |
|---------------|--------------|
| Install | Dependency conflict or npm registry issue |
| Migrate | Prisma schema/DB mismatch |
| Playwright Install | Network or storage issue in CI |
| Build | TypeScript error introduced by changes |
| Integrated Evals | Presenter or cross-dossier eval regression |
| E2E | App didn't start, selector broken, or timing issue |
