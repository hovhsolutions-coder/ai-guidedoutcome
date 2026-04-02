import { createGuidancePresentationFixtureMatrix } from '@/tests/evals/guidance-presentation-fixtures';
import { createGuidanceInteractionFixtureMatrix } from '@/tests/evals/guidance-interaction-fixtures';
import { createGuidanceDegradedAuthorityFixtureMatrix } from '@/tests/evals/guidance-degraded-authority-fixtures';
import { type GuidanceSessionStoreState } from '@/src/components/guidance/guidance-session-store';

export interface GuidancePresenterContractSnapshotFixture {
  id:
    | 'fresh_ready'
    | 'fresh_submit_loading'
    | 'clarifying_ready'
    | 'clarifying_continue_loading'
    | 'refined_ready'
    | 'trainer_loading'
    | 'execution_ready'
    | 'dossier_conversion_loading'
    | 'degraded_result_fallback';
  state: GuidanceSessionStoreState;
  liveRawInput: string;
  progressOverride?: 'dossier_conversion_loading';
  expected: {
    progressMessage: {
      state: string;
      eyebrow: string;
      title: string;
      statusLine: string;
      tone: string;
    };
    activeFocus: {
      target: string;
      dominantZone: string;
      primaryCta: string;
    };
    sectionVisibility: Record<string, string>;
    zoneProfiles: Record<string, {
      zone: string;
      visibility: string;
      focusState: string;
      isDominant: boolean;
      primaryCta: string | null;
      contentDensity: string | null;
      microcopyIntent: string | null;
      sectionOutcome: string | null;
      surfaceRhythm: string | null;
      transitionContinuity: string | null;
      visualWeight: string | null;
    }>;
    surfaceVariant: string;
  };
}

export function createGuidancePresenterContractSnapshotMatrix(): GuidancePresenterContractSnapshotFixture[] {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const degradedFixtures = createGuidanceDegradedAuthorityFixtureMatrix();

  const fresh = requireFixture(presentationFixtures.find((fixture) => fixture.id === 'fresh'), 'fresh');
  const clarifying = requireFixture(presentationFixtures.find((fixture) => fixture.id === 'clarifying'), 'clarifying');
  const refined = requireFixture(presentationFixtures.find((fixture) => fixture.id === 'refined_direction'), 'refined_direction');
  const execution = requireFixture(presentationFixtures.find((fixture) => fixture.id === 'execution_ready'), 'execution_ready');
  const freshLoading = requireFixture(interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading'), 'fresh_submit_loading');
  const clarifyingLoading = requireFixture(interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading'), 'clarifying_follow_up_loading');
  const trainerLoading = requireFixture(interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading'), 'trainer_request_loading');
  const dossierLoading = requireFixture(interactionFixtures.find((fixture) => fixture.id === 'execution_ready_dossier_loading'), 'execution_ready_dossier_loading');
  const degraded = requireFixture(degradedFixtures.find((fixture) => fixture.id === 'result_without_guidance_session'), 'result_without_guidance_session');

  return [
    {
      id: 'fresh_ready',
      state: fresh.state,
      liveRawInput: fresh.liveRawInput,
      expected: {
        progressMessage: {
          state: 'fresh_ready',
          eyebrow: 'Ready to begin',
          title: 'The first read will stay simple and controlled.',
          statusLine: 'Start with one raw situation and the page will turn it into a calm summary, one next step, and the first visible sign of progress.',
          tone: 'neutral',
        },
        activeFocus: {
          target: 'intake',
          dominantZone: 'intake',
          primaryCta: 'submit',
        },
        sectionVisibility: {
          intake: 'visible',
          onboarding: 'suppressed',
          result: 'visible',
          trainer: 'suppressed',
          execution: 'suppressed',
        },
        zoneProfiles: {
          intake: buildZone('intake', 'visible', 'dominant', true, 'submit', 'guided', 'orient', 'capture', 'steady', 'advance', 'strong'),
          onboarding: buildSuppressedZone('onboarding'),
          result: buildZone('result', 'visible', 'secondary', false, null, 'minimal', 'confirm', 'understand', 'compact', 'settle', 'subtle'),
          trainer: buildSuppressedZone('trainer'),
          execution: buildSuppressedZone('execution'),
        },
        surfaceVariant: 'capture_surface',
      },
    },
    {
      id: 'fresh_submit_loading',
      state: freshLoading.state,
      liveRawInput: freshLoading.liveRawInput,
      expected: {
        progressMessage: {
          state: 'fresh_submit_loading',
          eyebrow: 'Building the first read',
          title: 'The route is shaping a controlled guidance pass.',
          statusLine: 'We are turning this into one clear summary, one next step, and the first proof that a more executable next move can start to emerge from what is already in the intake.',
          tone: 'progress',
        },
        activeFocus: {
          target: 'result',
          dominantZone: 'result',
          primaryCta: 'none',
        },
        sectionVisibility: {
          intake: 'soft_hidden',
          onboarding: 'suppressed',
          result: 'visible',
          trainer: 'suppressed',
          execution: 'suppressed',
        },
        zoneProfiles: {
          intake: buildZone('intake', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'capture', 'compact', 'persist', 'subtle'),
          onboarding: buildSuppressedZone('onboarding'),
          result: buildZone('result', 'visible', 'dominant', true, null, 'guided', 'confirm', 'understand', 'steady', 'advance', 'strong'),
          trainer: buildSuppressedZone('trainer'),
          execution: buildSuppressedZone('execution'),
        },
        surfaceVariant: 'understand_surface',
      },
    },
    {
      id: 'clarifying_ready',
      state: clarifying.state,
      liveRawInput: clarifying.liveRawInput,
      expected: {
        progressMessage: {
          state: 'clarifying_ready',
          eyebrow: 'Clarifying the direction',
          title: 'You already have the shape of the route; one missing point is still keeping it light.',
          statusLine: 'The page is holding the current thread steady until that last detail is clear enough to confirm the position, based on what is already clear.',
          tone: 'steady',
        },
        activeFocus: {
          target: 'follow_up',
          dominantZone: 'onboarding',
          primaryCta: 'follow_up',
        },
        sectionVisibility: {
          intake: 'soft_hidden',
          onboarding: 'visible',
          result: 'visible',
          trainer: 'soft_hidden',
          execution: 'suppressed',
        },
        zoneProfiles: {
          intake: buildZone('intake', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'capture', 'compact', 'settle', 'subtle'),
          onboarding: buildZone('onboarding', 'visible', 'dominant', true, 'follow_up', 'guided', 'orient', 'clarify', 'steady', 'advance', 'strong'),
          result: buildZone('result', 'visible', 'secondary', false, null, 'guided', 'confirm', 'understand', 'steady', 'persist', 'balanced'),
          trainer: buildZone('trainer', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'explore', 'compact', 'settle', 'subtle'),
          execution: buildSuppressedZone('execution'),
        },
        surfaceVariant: 'clarify_surface',
      },
    },
    {
      id: 'clarifying_continue_loading',
      state: clarifyingLoading.state,
      liveRawInput: clarifyingLoading.liveRawInput,
      expected: {
        progressMessage: {
          state: 'clarifying_continue_loading',
          eyebrow: 'Tightening the read',
          title: 'Your answer is being folded into the same guidance thread.',
          statusLine: 'The read is being refined without resetting the work you already shaped, so the next pass can show what became clearer about how to confirm the position from what is already clear.',
          tone: 'progress',
        },
        activeFocus: {
          target: 'follow_up',
          dominantZone: 'onboarding',
          primaryCta: 'follow_up',
        },
        sectionVisibility: {
          intake: 'soft_hidden',
          onboarding: 'visible',
          result: 'soft_hidden',
          trainer: 'suppressed',
          execution: 'suppressed',
        },
        zoneProfiles: {
          intake: buildZone('intake', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'capture', 'compact', 'settle', 'subtle'),
          onboarding: buildZone('onboarding', 'visible', 'dominant', true, 'follow_up', 'guided', 'orient', 'clarify', 'steady', 'persist', 'strong'),
          result: buildZone('result', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'understand', 'compact', 'settle', 'subtle'),
          trainer: buildSuppressedZone('trainer'),
          execution: buildSuppressedZone('execution'),
        },
        surfaceVariant: 'clarify_surface',
      },
    },
    {
      id: 'refined_ready',
      state: refined.state,
      liveRawInput: refined.liveRawInput,
      expected: {
        progressMessage: {
          state: 'refined_ready',
          eyebrow: 'Direction confirmed',
          title: 'The position is clearer, tighter, and easier to act on now.',
          statusLine: 'You now know what changed from what you already clarified: the current read is strong enough to guide the safer next move while still leaving room to pressure-test the position, based on the strongest signals already confirmed here.',
          tone: 'steady',
        },
        activeFocus: {
          target: 'result',
          dominantZone: 'result',
          primaryCta: 'none',
        },
        sectionVisibility: {
          intake: 'soft_hidden',
          onboarding: 'soft_hidden',
          result: 'visible',
          trainer: 'soft_hidden',
          execution: 'suppressed',
        },
        zoneProfiles: {
          intake: buildZone('intake', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'capture', 'compact', 'settle', 'subtle'),
          onboarding: buildZone('onboarding', 'soft_hidden', 'secondary', false, null, 'guided', 'confirm', 'understand', 'compact', 'persist', 'balanced'),
          result: buildZone('result', 'visible', 'dominant', true, null, 'expanded', 'deepen', 'understand', 'spacious', 'advance', 'strong'),
          trainer: buildZone('trainer', 'soft_hidden', 'secondary', false, null, 'guided', 'deepen', 'explore', 'steady', 'settle', 'balanced'),
          execution: buildSuppressedZone('execution'),
        },
        surfaceVariant: 'understand_surface',
      },
    },
    {
      id: 'trainer_loading',
      state: trainerLoading.state,
      liveRawInput: trainerLoading.liveRawInput,
      expected: {
        progressMessage: {
          state: 'trainer_request_loading',
          eyebrow: 'Specialist pass',
          title: 'A narrower trainer read is being added on top of the same direction.',
          statusLine: 'The main guidance read stays stable while the specialist angle prepares to pressure-test the position and keep building without losing the thread, based on the direction already confirmed here.',
          tone: 'progress',
        },
        activeFocus: {
          target: 'trainer',
          dominantZone: 'trainer',
          primaryCta: 'trainer',
        },
        sectionVisibility: {
          intake: 'soft_hidden',
          onboarding: 'soft_hidden',
          result: 'soft_hidden',
          trainer: 'visible',
          execution: 'suppressed',
        },
        zoneProfiles: {
          intake: buildZone('intake', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'capture', 'compact', 'settle', 'subtle'),
          onboarding: buildZone('onboarding', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'understand', 'compact', 'settle', 'subtle'),
          result: buildZone('result', 'soft_hidden', 'secondary', false, null, 'guided', 'confirm', 'understand', 'compact', 'persist', 'subtle'),
          trainer: buildZone('trainer', 'visible', 'dominant', true, 'trainer', 'guided', 'deepen', 'explore', 'spacious', 'advance', 'strong'),
          execution: buildSuppressedZone('execution'),
        },
        surfaceVariant: 'explore_surface',
      },
    },
    {
      id: 'execution_ready',
      state: execution.state,
      liveRawInput: execution.liveRawInput,
      expected: {
        progressMessage: {
          state: 'execution_ready',
          eyebrow: 'Plan ready',
          title: 'The plan is confirmed and ready to move.',
          statusLine: 'Clarification is complete, so the page is holding one clean bridge to carry the plan into action, based on the route already confirmed here.',
          tone: 'steady',
        },
        activeFocus: {
          target: 'execution_transition',
          dominantZone: 'execution',
          primaryCta: 'dossier_convert',
        },
        sectionVisibility: {
          intake: 'soft_hidden',
          onboarding: 'soft_hidden',
          result: 'soft_hidden',
          trainer: 'suppressed',
          execution: 'visible',
        },
        zoneProfiles: {
          intake: buildZone('intake', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'capture', 'compact', 'settle', 'subtle'),
          onboarding: buildZone('onboarding', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'understand', 'compact', 'settle', 'subtle'),
          result: buildZone('result', 'soft_hidden', 'secondary', false, null, 'guided', 'confirm', 'understand', 'steady', 'persist', 'balanced'),
          trainer: buildSuppressedZone('trainer'),
          execution: buildZone('execution', 'visible', 'dominant', true, 'dossier_convert', 'expanded', 'activate', 'commit', 'spacious', 'advance', 'strong'),
        },
        surfaceVariant: 'commit_surface',
      },
    },
    {
      id: 'dossier_conversion_loading',
      state: dossierLoading.state,
      liveRawInput: dossierLoading.liveRawInput,
      progressOverride: 'dossier_conversion_loading',
      expected: {
        progressMessage: {
          state: 'dossier_conversion_loading',
          eyebrow: 'Opening mission control',
          title: 'The current guidance read is being carried into a dossier workspace.',
          statusLine: 'The current route is packaging "Define the final owner sequence for launch week" into a persistent workspace so the page can carry the plan into action without losing the guidance thread you already clarified.',
          tone: 'progress',
        },
        activeFocus: {
          target: 'execution_transition',
          dominantZone: 'execution',
          primaryCta: 'dossier_convert',
        },
        sectionVisibility: {
          intake: 'soft_hidden',
          onboarding: 'soft_hidden',
          result: 'soft_hidden',
          trainer: 'suppressed',
          execution: 'visible',
        },
        zoneProfiles: {
          intake: buildZone('intake', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'capture', 'compact', 'settle', 'subtle'),
          onboarding: buildZone('onboarding', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'understand', 'compact', 'settle', 'subtle'),
          result: buildZone('result', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'understand', 'compact', 'settle', 'subtle'),
          trainer: buildSuppressedZone('trainer'),
          execution: buildZone('execution', 'visible', 'dominant', true, 'dossier_convert', 'expanded', 'activate', 'commit', 'spacious', 'persist', 'strong'),
        },
        surfaceVariant: 'commit_surface',
      },
    },
    {
      id: 'degraded_result_fallback',
      state: degraded.state,
      liveRawInput: degraded.liveRawInput,
      expected: {
        progressMessage: {
          state: 'degraded_result_fallback',
          eyebrow: 'Stable fallback',
          title: 'The core guidance read is still here and safe to use.',
          statusLine: 'Nothing important was lost. The page is only showing the sections that still have enough authority to keep the next move trustworthy, so the result stays usable and safe.',
          tone: 'neutral',
        },
        activeFocus: {
          target: 'degraded_result',
          dominantZone: 'result',
          primaryCta: 'none',
        },
        sectionVisibility: {
          intake: 'soft_hidden',
          onboarding: 'suppressed',
          result: 'visible',
          trainer: 'suppressed',
          execution: 'suppressed',
        },
        zoneProfiles: {
          intake: buildZone('intake', 'soft_hidden', 'secondary', false, null, 'minimal', 'confirm', 'capture', 'compact', 'settle', 'subtle'),
          onboarding: buildSuppressedZone('onboarding'),
          result: buildZone('result', 'visible', 'dominant', true, null, 'guided', 'confirm', 'understand', 'steady', 'persist', 'balanced'),
          trainer: buildSuppressedZone('trainer'),
          execution: buildSuppressedZone('execution'),
        },
        surfaceVariant: 'degraded_understand_surface',
      },
    },
  ];
}

function requireFixture<T>(fixture: T | undefined, label: string): T {
  if (!fixture) {
    throw new Error(`Missing guidance presenter snapshot fixture: ${label}`);
  }

  return fixture;
}

function buildZone(
  zone: string,
  visibility: string,
  focusState: string,
  isDominant: boolean,
  primaryCta: string | null,
  contentDensity: string | null,
  microcopyIntent: string | null,
  sectionOutcome: string | null,
  surfaceRhythm: string | null,
  transitionContinuity: string | null,
  visualWeight: string | null
) {
  return {
    zone,
    visibility,
    focusState,
    isDominant,
    primaryCta,
    contentDensity,
    microcopyIntent,
    sectionOutcome,
    surfaceRhythm,
    transitionContinuity,
    visualWeight,
  };
}

function buildSuppressedZone(zone: string) {
  return buildZone(zone, 'suppressed', 'hidden', false, null, null, null, null, null, null, null);
}
