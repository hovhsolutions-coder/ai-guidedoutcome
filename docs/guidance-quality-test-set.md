# Guidance Quality Test Set

This test set is designed to evaluate whether dossier guidance is decision-grade across realistic states without changing UI, backend architecture, or product scope.

## Where The Fixtures Live

Typed fixtures and rubric exports live in:

- `src/lib/ai/guidance-quality.ts`

## What To Evaluate

Use the rubric below for every scenario:

1. `decisiveness`
2. `actionability`
3. `taskAlignment`
4. `momentumPreservation`
5. `specificity`

Score each dimension on a simple scale:

- `2` = strong
- `1` = mixed
- `0` = weak

A high-quality guidance response should usually score at least `8/10` overall and should not fail `decisiveness` or `actionability`.

## Strong Output Patterns

- One clear next move, not several.
- Strong action verb at the start of `next_step`.
- Explicit reference to an existing task when that task is the right move.
- Suggested tasks that support, de-risk, or complete the next move.
- Continuation language when momentum already exists.

## Common Failure Patterns

- Vague verbs: `review`, `assess`, `consider`, `explore`.
- Hedging language: `could`, `might`, `may`, `try to`.
- More planning when the dossier is already in motion.
- Suggested tasks that open a new workstream instead of supporting the chosen move.
- Decision prompts that invite reflection instead of forcing clarity.

## Recommended Manual Evaluation Flow

1. Pick one fixture from `guidanceQualityScenarios`.
2. Send the `input` payload through the current guidance route or orchestrator.
3. Compare the output against:
   - `expected.situationRead`
   - `expected.nextStep`
   - `expected.suggestedTasks`
   - `expected.decisionPrompt`
4. Reject immediately if any listed `rejectIf` condition appears.
5. Score the output using the five-point rubric.

## Local Regression Runner

A lightweight local runner is available at:

- `scripts/run-guidance-quality.cjs`

Run all scenarios:

```bash
npm run guidance:check
```

Run in local mode without external API dependency:

```bash
npm run guidance:check -- --mode=local
```

Run one specific scenario:

```bash
npm run guidance:check -- --scenario=action-02
```

The runner:

- loads the fixtures from `src/lib/ai/guidance-quality-fixtures.json`
- sends them through `/api/ai/guidance`
- supports two explicit modes:
  - `live`: full end-to-end route + provider path
  - `local`: same route, but local deterministic guidance mode with no external API dependency
- prints the returned `summary`, `next_step`, and `suggested_tasks`
- adds simple `PASS`, `WARN`, or `FAIL` checks for guidance-quality regressions

Mode clarification:

- `local` mode is for structural and regression validation only.
- `live` mode is the real provider/model validation path.
- A `local` pass does not prove real model quality.

Before running it, make sure your local app is running, for example:

```bash
npm run dev
```

You can also point the runner at a different local base URL:

```bash
GUIDANCE_CHECK_BASE_URL=http://localhost:3001 npm run guidance:check
```

## Optional Regression Automation Later

Good next steps for automation, without changing product behavior:

- Add a lightweight script that iterates over `getGuidanceScenarioPayloads()` and stores raw outputs.
- Add heuristic assertions for:
  - strong leading verb in `next_step`
  - no weak phrases
  - no duplication between `next_step` and `suggested_tasks`
  - explicit task reference when a matching task exists
- Track score deltas across prompt or orchestrator changes before release.
