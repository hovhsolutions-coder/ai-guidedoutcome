# Trainer Quality Test Set

This test set validates whether dossier-detail trainers stay meaningfully differentiated and decision-useful over time.

## Where The Fixtures Live

- `src/lib/ai/trainer-quality-fixtures.json`
- `src/lib/ai/trainer-quality.ts`

## Current Fixture Set

Start with 8 practical fixtures:

- `strategy`: 2
- `execution`: 2
- `risk`: 2
- `communication`: 2

The fixtures are organized into 2 shared dossier contexts so similarity drift can be checked across trainers without overbuilding:

- `launch-alignment`
- `sensitive-response`

## What The Checks Validate

The runner checks functional differentiation first, not just vocabulary.

- `strategy`
  - narrows direction
  - frames tradeoffs
  - identifies leverage or sequencing
- `execution`
  - produces an operational move
  - reduces friction
  - translates the mission into immediate action
- `risk`
  - identifies a watchpoint or exposure
  - pairs it with verification or a protective adjustment
- `communication`
  - shapes a dossier-aware message or positioning move
  - improves clarity, tone fit, or alignment
  - avoids generic writing-assistant drift

The runner also warns when:

- outputs become too generic
- `next_move` becomes vague
- trainers sound too similar in angle or structure
- risk becomes alarmist
- execution becomes motivational instead of operational
- strategy stays abstract without narrowing
- communication drifts into generic writing help

## Local Regression Runner

A lightweight local runner is available at:

- `scripts/run-trainer-quality.cjs`

Run all fixtures:

```bash
npm run trainer:check
```

Run in local mode:

```bash
npm run trainer:check -- --mode=local
```

Run one fixture:

```bash
npm run trainer:check -- --mode=local --scenario=launch-alignment-strategy
```

## Mode Clarification

- `local` mode is structural and differentiation validation only.
- `live` mode is the real provider/model validation path.
- A `local` pass does not prove real model quality.
