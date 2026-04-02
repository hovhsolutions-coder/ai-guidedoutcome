# Project Setup Summary

## Status

Foundation is ready and aligned with the current AI architecture.

## Current Architecture

- Next.js App Router under `app/`
- Reusable UI under `components/`
- General utilities under `lib/`
- AI orchestration under `src/lib/ai/`
- Shared dossier and intake types in `src/types/ai.ts`

## Important Files

- `app/layout.tsx`
- `src/lib/ai/orchestrator.ts`
- `src/lib/ai/runner.ts`
- `src/lib/ai/providers/openai.ts`
- `src/lib/ai/policy.ts`
- `src/lib/ai/types.ts`
- `src/types/ai.ts`

## Quality Checks

- [ ] Run the quality gate: `npm run test:quality`
  - This runs: build → recommendation tests → e2e tests
  - All should pass (15 Playwright tests, 13 recommendation evals)
  - See QUALITY_GATE.md for details

## Notes

- Keep AI logic in `src/lib/ai`.
- Keep dossier-related shared types in `src/types/ai.ts`.
- Do not reintroduce the removed top-level service-layer AI pattern.
