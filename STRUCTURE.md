# Project Structure And Architecture

## Overview

AI Guided Outcome is a Next.js app using the App Router, with AI behavior organized under `src/lib/ai` and shared dossier types in `src/types/ai.ts`.

## Current Structure

```text
app/                    # Next.js routes and route handlers
components/             # Reusable UI
config/                 # App configuration
hooks/                  # Custom hooks
lib/                    # General utilities
public/                 # Static assets
src/lib/ai/             # AI orchestration, policy, providers, validation
src/lib/dossiers/       # Dossier persistence and server helpers
src/types/ai.ts         # Shared dossier and intake types
types/                  # Legacy non-AI shared types
```

## AI Architecture

### `src/lib/ai`

The AI layer is intentionally centralized here.

```text
src/lib/ai/
cache.ts
cost.ts
hash.ts
metrics.ts
orchestrator.ts
policy.ts
prompt-builder.ts
runner.ts
types.ts
validators.ts
providers/openai.ts
```

Responsibilities:
- `orchestrator.ts` coordinates AI workflows.
- `runner.ts` executes provider calls.
- `providers/openai.ts` contains the OpenAI provider implementation.
- `policy.ts` defines action policy and runtime settings.
- `types.ts` defines AI request and response contracts.

### `src/types/ai.ts`

Shared dossier-facing types live here:
- `DossierContext`
- `IntakeData`
- `GeneratedDossier`

## Development Workflow

1. Define or extend shared types in `src/types/ai.ts` when the change is dossier-related.
2. Add AI logic in `src/lib/ai/` when the change affects orchestration, providers, policy, or validation.
3. Keep route handlers in `app/api/**/route.ts`.
4. Keep rendering logic in `components/` and `app/`.

## Conventions

- Use `@/` imports.
- Keep AI modules focused and typed.
- Do not reintroduce a top-level legacy service layer for AI.
- Prefer server-only helpers under `src/lib/**` when code should not run on the client.

## Commands

```bash
npm run dev
npm run build
npx tsc --noEmit --pretty false
```
