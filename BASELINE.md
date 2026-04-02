# Stable Baseline Summary

**Date:** 2024-03-30  
**Status:** Verified, protected, documented (all 24 E2E active; 0 skipped)

## Quality Gate Surface

### Primary Gate: `npm run auto`

The standard verification path now runs:

1. **Build** - Next.js production build without TypeScript errors
2. **Integrated Evals** (`npm run test`) - 40 deterministic eval scenarios in ~10ms
3. **E2E Tests** (`npm run e2e`) - 24 Playwright browser tests (persistence suite runs serially for deterministic DB state)

### Integrated Eval Protections

| Suite | Scenarios | Type | Protects |
|-------|-----------|------|----------|
| Completed-phase presenter | 9 | Deterministic | UI copy logic for Completed dossiers (getCurrentObjective, getPrimaryCtaLabel) |
| Cross-dossier data-shaping | 13 | Deterministic | Relevance scoring, outcome derivation, task patterns |
| Cross-dossier precedent-quality | 4 | Deterministic | Prompt-layer usage rules and restrictions |
| Cross-dossier usefulness | 4 | Deterministic | Guidance enrichment with strong vs weak precedent |
| Cross-dossier observability | 10 | Deterministic | Metrics calculation contract |
| **Total integrated** | **40** | - | **Fast regression protection in standard gate** |

### E2E Coverage

- 24 Playwright tests across Chromium (0 skipped)
- Persistence flows active: edit task name, add subtask, complete task, refresh verification
- Suite is serialized within persistence spec to keep SQLite state deterministic
- Covers mode-aware UI, close-out flow, readiness/setup
- Includes post-close-out "Review record" state verification

## Green Command

```powershell
npm run auto
```

**Must pass:**
- Build (no TypeScript errors)
- 40 integrated eval scenarios
- 24 Playwright E2E tests

### Legacy Gate (still available)

```powershell
npm run test:quality
```

Runs build → 13 recommendation tests → E2E. This is the older gate that predates integrated evals.

## What Changed

This baseline established and now fully activates the verification and persistence layer:

1. **Prisma/SQLite Migration** - Dossiers now persist to SQLite via Prisma ORM
2. **Deterministic E2E Seed** - `scripts/seed-e2e.cjs` creates isolated test data
3. **Quality Gate** - `npm run test:quality` runs build → recommendations → e2e
4. **CI Pipeline** - GitHub Actions runs quality gate on every PR/push
5. **Regression Safeguards** - Seed verification, persistence contract tests, and fully active persistence E2E flows
6. **Documentation** - QUALITY_GATE.md and operator checklist

## Cross-Dossier Guidance System (Shipped)

Active dossiers now receive reference context from completed dossiers for more informed guidance:

### Capability
- **Relevance-based selection** - Completed dossiers scored by title/mainGoal keyword overlap (70/30 ratio)
- **Outcome summaries** - Task completion stats, time invested, and key results from completed work
- **Task patterns** - Representative task names extracted from completed dossiers
- **Restrictive usage rules** - >50% match threshold required for precedent references; generic references prohibited

### Data Flow
1. `getCompletedDossiers()` in `src/lib/db/dossier-store.ts` selects and shapes precedent context
2. `buildGuidancePrompt()` in `src/lib/ai/prompt-builder.ts` includes cross-dossier context with usage rules
3. `app/api/ai/guidance/route.ts` orchestrates and logs observability metrics

### Regression Protection
| Test File | Scenarios | Purpose |
|-----------|-----------|---------|
| `cross-dossier-data-shaping.test.cjs` | 13 | Relevance scoring, outcome derivation, task pattern extraction |
| `cross-dossier-precedent-quality.test.cjs` | 4 | Prompt-layer usage rules and restrictions |
| `cross-dossier-usefulness.test.cjs` | 4 | Guidance enrichment with strong vs weak precedent |
| `cross-dossier-observability.test.cjs` | 10 | Metric calculation contract (strong matches, richness flags, phase) |

### Observability Signals
Guidance API logs precedent metrics on success:
```
[api:guidance:success] cid:xxx ... precedents:3 strong:2 maxScore:87 outcomes:true tasks:true phase:Executing
```

- `precedents:N` - count of completed dossiers in context
- `strong:N` - count with relevanceScore > 50
- `maxScore:N` - highest relevance score in set
- `outcomes:true/false` - whether outcome summaries present
- `tasks:true/false` - whether task patterns present
- `phase:X` - active dossier phase when guidance requested

## Protected Areas

Do not casually change:

- `npm run auto` script chain in `scripts/auto-run.cjs`
- `npm run test` script in package.json (now runs `tests/evals/run-integrated-evals.cjs`)
- `scripts/seed-e2e.cjs` field names (must match Prisma schema)
- `e2e/webServer` in playwright.config.ts (uses production build)
- `.github/workflows/quality-gate.yml` without verifying CI still passes
- Prisma schema dossier fields without updating seed/contract tests
- **Completed-phase presenter tests** in `completed-phase-presenter.test.cjs` - 9 UI copy contracts
- **Cross-dossier data-shaping functions** in `dossier-store.ts` (exported for testing)
  - `calculateRelevanceScore()` - relevance scoring algorithm
  - `deriveOutcomeSummary()` - outcome summary generation
  - `extractTaskPatterns()` - task pattern extraction
- **Cross-dossier eval tests** - all 4 test files must remain green
- **Precedent usage rules** in `prompt-builder.ts` (>50% threshold, generic reference prohibition)

## Safe Next Work

Now safe to proceed with:

- **Product features:** New UI, guidance flows, dossier capabilities
- **UX refinement:** Layouts, styling, interaction polish
- **Data layer evolution:** PostgreSQL migration (with schema migration path)
- **Auth:** User accounts, session management (add to CI later)
- **Deployment:** Production hosting, environment configs

## Verification Layer

| Component | Status |
|-----------|--------|
| Primary Gate | `npm run auto` - build → 40 integrated evals → 24 E2E tests |
| Legacy Gate | `npm run test:quality` - build → 13 recommendations → 24 E2E |
| Integrated Evals | 40 deterministic scenarios in ~10ms |
| Cross-Dossier | 31 scenarios (13 data-shaping + 4 precedent + 4 usefulness + 10 observability) |
| Completed Phase | 9 presenter contracts for post-close-out UI |
| Persistence | Prisma/SQLite, contract tests pass |
| Seed | Deterministic, idempotent, verified |
| E2E | 24 tests, Chromium, production build |
| CI | GitHub Actions, `npm run auto`, 15min timeout |
| Docs | Aligned with actual gate surface |
