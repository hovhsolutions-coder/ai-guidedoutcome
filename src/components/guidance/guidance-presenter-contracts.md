# Guidance Presenter Contracts

This note documents the final `/guidance` presenter contracts that feed the shell.
It is intentionally narrow: it describes the current composition pipeline, the final shell-safe fields, the state reference covered by the snapshot suite, and the invariant rules that keep the output coherent.

## Why This Exists

- `zoneProfiles` exists so every visible zone can be consumed as one coherent surface instead of as a bag of independent flags.
- `surfaceVariant` exists so the whole page can communicate one dominant mode at a glance instead of inferring page mood from scattered zone state.
- `rightRailProfile` exists so the shell can frame the entire right rail as one calm support/context/deepen/handoff surface instead of stitching that mood together from scattered wrapper rules.
- `finalInvariantNormalization` exists so contradictory combinations can be calmed in one last slot before the shell sees them.
- The snapshot contract scope exists so total presenter drift is caught at the final shape level, not only through smaller matrix assertions.

## Pipeline Order

The presenter pipeline order is fixed:

1. `baseState`
2. `progressContract`
3. `focusVisibility`
4. `zoneLevelContracts`
5. `unifiedZoneProfiles`
6. `surfaceVariant`
7. `rightRailProfile`
8. `finalInvariantNormalization`

### Step Inputs And Outputs

| Step | Reads | Enriches |
| --- | --- | --- |
| `baseState` | store state, `liveRawInput` | `intake`, `rightRailView` |
| `progressContract` | store state plus `rightRailView`, or explicit override state | `progressMessage` |
| `focusVisibility` | `progressMessage.state`, `rightRailView` | `activeFocus`, `sectionVisibility` |
| `zoneLevelContracts` | `progressMessage.state`, `sectionVisibility` | `contentDensity`, `microcopyIntent`, `sectionOutcome`, `surfaceRhythm`, `transitionContinuity`, `visualWeight` |
| `unifiedZoneProfiles` | `activeFocus`, `sectionVisibility`, all zone-level contracts | `zoneProfiles` |
| `surfaceVariant` | `progressMessage.state` | `surfaceVariant` |
| `rightRailProfile` | `progressMessage`, `surfaceVariant`, `zoneProfiles` | `rightRailProfile` |
| `finalInvariantNormalization` | all previous step outputs | final `GuidanceSessionPresentation` |

## Zone Contracts

The unified zone keys are fixed:

- `intake`
- `onboarding`
- `result`
- `trainer`
- `execution`

Each `zoneProfiles.<zone>` entry currently combines:

- `visibility`
- `focusState`
- `isDominant`
- `primaryCta`
- `contentDensity`
- `microcopyIntent`
- `sectionOutcome`
- `surfaceRhythm`
- `transitionContinuity`
- `visualWeight`

## Surface Variants

The page-level surface variants are fixed:

- `capture_surface`
- `clarify_surface`
- `understand_surface`
- `explore_surface`
- `commit_surface`
- `degraded_understand_surface`

### Surface Variant Mapping

| Progress State | Surface Variant |
| --- | --- |
| `fresh_ready` | `capture_surface` |
| `fresh_retry_ready` | `capture_surface` |
| `fresh_submit_loading` | `understand_surface` |
| `clarifying_ready` | `clarify_surface` |
| `clarifying_continue_loading` | `clarify_surface` |
| `refined_ready` | `understand_surface` |
| `trainer_request_loading` | `explore_surface` |
| `trainer_retry_ready` | `explore_surface` |
| `execution_ready` | `commit_surface` |
| `dossier_conversion_loading` | `commit_surface` |
| `degraded_result_fallback` | `degraded_understand_surface` |

## Right-Rail Profile

The page-level right-rail contract currently combines:

- `visibility`
- `role`
- `emphasis`
- `density`
- `continuity`

The rail roles are fixed:

- `support`
- `context`
- `deepen`
- `handoff`

## Invariants

The final presenter output preserves these invariants:

- Suppressed zones are null-safe:
  - `visibility: suppressed`
  - `focusState: hidden`
  - no density, intent, outcome, rhythm, continuity, weight, or CTA
- `commit` is only valid on `execution`
- `activate` is only valid when the effective zone outcome is `commit`
- `advance` cannot remain on a suppressed zone
- A dominant zone cannot end weaker than a visible secondary `strong` zone
- The final `surfaceVariant` is normalized against the final dominant zone from `zoneProfiles`
- The final `rightRailProfile` is normalized against the final dominant zone and degraded surface mode

## Dossier Conversion Override

The dossier conversion override does not bypass composition.

It reuses the same presenter pipeline by:

1. reusing the `baseState`
2. applying `progressState = dossier_conversion_loading`
3. re-running:
   - `progressContract`
   - `focusVisibility`
   - `zoneLevelContracts`
   - `unifiedZoneProfiles`
   - `surfaceVariant`
   - `rightRailProfile`
   - `finalInvariantNormalization`

## State Reference Table

This table matches the snapshot suite exactly.

| Snapshot State | Authority Meaning | Dominant Zone | Primary CTA | Surface Variant |
| --- | --- | --- | --- | --- |
| `fresh_ready` | no authoritative result yet; capture-first | `intake` | `submit` | `capture_surface` |
| `fresh_submit_loading` | first structured read is in flight | `result` | `none` | `understand_surface` |
| `clarifying_ready` | authoritative clarification loop is active | `onboarding` | `follow_up` | `clarify_surface` |
| `clarifying_continue_loading` | clarifying answer is being folded back into the same thread | `onboarding` | `follow_up` | `clarify_surface` |
| `refined_ready` | authoritative refined direction is available | `result` | `none` | `understand_surface` |
| `trainer_loading` | specialist continuation is actively loading | `trainer` | `trainer` | `explore_surface` |
| `execution_ready` | authoritative handoff into action is ready | `execution` | `dossier_convert` | `commit_surface` |
| `dossier_conversion_loading` | the same execution handoff is being moved into dossier form | `execution` | `dossier_convert` | `commit_surface` |
| `degraded_result_fallback` | result-led fallback; authority is valid but thinner than full phase rendering | `result` | `none` | `degraded_understand_surface` |

## Shell Consumption Boundary

Preferred shell consumer path:

- `intake`
- `progressMessage`
- `surfaceVariant`
- `rightRailProfile`
- `zoneProfiles`
- `rightRailView`

Within `rightRailView`, the trusted carrier split is intentional:

- `onboardingSession` is only for onboarding-capable phase UI
- `executionSession` is only for execution-capable handoff UI

That keeps onboarding suppression and execution readiness from sharing one ambiguous session carrier.

The shell should prefer zone-level selectors over legacy field reads when it needs:

- the dominant zone
- the CTA-owning zone
- the progress context that corresponds to the dominant zone

Compatibility-only or test-facing fields that may still exist on the final presenter shape:

- `activeFocus`
- `sectionVisibility`
- `contentDensity`
- `microcopyIntent`
- `sectionOutcome`
- `surfaceRhythm`
- `transitionContinuity`
- `visualWeight`

Those fields should stay available for contract tests, snapshot stability, and presenter-internal composition checks, but shell and section consumers should prefer `zoneProfiles` and `rightRailProfile` wherever the same decision already exists there.

The shell should not depend on presenter-internal pipeline step objects:

- `baseState`
- `progressContract`
- `focusVisibility`
- `zoneLevelContracts`
- `unifiedZoneProfiles`
- `surfaceVariant` step object
- `finalInvariantNormalization`

Those step objects are presenter-internal composition artifacts and are only meant for debugging and tests.

## Snapshot Contract Scope

The stabilized snapshot contract covers only:

- `progressMessage`
- `activeFocus`
- `sectionVisibility`
- `zoneProfiles`
- `surfaceVariant`

It deliberately excludes richer content payloads such as `intake` and `rightRailView` because those are already protected by narrower behavior and render tests, while the snapshot suite is meant to guard the final presentation coordination layer.
