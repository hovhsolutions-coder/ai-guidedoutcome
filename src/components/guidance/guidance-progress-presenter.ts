import {
  type GuidanceProgressMessageState,
  type GuidanceProgressMessagePresentation,
  type GuidanceRightRailViewModel,
} from '@/src/components/guidance/guidance-presentation-contracts';
import {
  buildGuidanceCopyProfile,
  getGuidanceDomainLexicon,
  getGuidanceIntentPromise,
  getGuidancePersonalizedPrefix,
} from '@/src/components/guidance/guidance-copy-personalization';
import { type GuidanceSessionStoreState } from '@/src/components/guidance/guidance-session-store';
import {
  getGuidanceDecisionAuthority,
  getGuidanceSessionPhase,
} from '@/src/lib/guidance-session/guidance-decision-envelope';

interface PresentGuidanceProgressMessageInput {
  state: GuidanceSessionStoreState;
  rightRailView: GuidanceRightRailViewModel;
}

interface PresentGuidanceProgressMessageOverrideInput {
  state: GuidanceProgressMessageState;
  rightRailView: GuidanceRightRailViewModel;
  copyProfile?: ReturnType<typeof buildGuidanceCopyProfile>;
}

export function presentGuidanceProgressMessage(
  input: PresentGuidanceProgressMessageInput
): GuidanceProgressMessagePresentation {
  return presentGuidanceProgressMessageForState({
    state: resolveGuidanceProgressMessageState(input),
    rightRailView: input.rightRailView,
    copyProfile: buildGuidanceCopyProfile({
      rawInput: input.state.input.rawInput,
      detectedDomain: input.state.session.resultMeta?.detectedDomain ?? input.rightRailView.result.panel.detectedDomain,
      activeMode: input.state.session.resultMeta?.activeMode ?? input.rightRailView.result.panel.activeMode,
      intakeAnswers: input.state.input.intakeAnswers,
    }),
  });
}

export function presentGuidanceProgressMessageForState(
  input: PresentGuidanceProgressMessageOverrideInput
): GuidanceProgressMessagePresentation {
  const copyProfile = input.copyProfile ?? buildGuidanceCopyProfile({
    detectedDomain: input.rightRailView.result.panel.detectedDomain,
    activeMode: input.rightRailView.result.panel.activeMode,
  });
  const lexicon = getGuidanceDomainLexicon(copyProfile);
  const prefix = getGuidancePersonalizedPrefix(copyProfile);
  const intentPromise = getGuidanceIntentPromise(copyProfile);

  switch (input.state) {
    case 'fresh_submit_loading':
      return {
        state: 'fresh_submit_loading',
        eyebrow: 'Building the first read',
        title: 'The route is shaping a controlled guidance pass.',
        statusLine: `${prefix} into one clear summary, one next step, and the first proof that a ${lexicon.nextMove} can start to emerge from what is already in the intake.`,
        tone: 'progress',
      };
    case 'clarifying_continue_loading':
      return {
        state: 'clarifying_continue_loading',
        eyebrow: 'Tightening the read',
        title: 'Your answer is being folded into the same guidance thread.',
        statusLine: copyProfile.hasPriorAnswers
          ? `The read is being refined without resetting what you already clarified, so the next pass can show what became clearer about how to ${lexicon.refinedTarget} from what is already confirmed.`
          : `The read is being refined without resetting the work you already shaped, so the next pass can show what became clearer about how to ${lexicon.refinedTarget} from what is already clear.`,
        tone: 'progress',
      };
    case 'trainer_request_loading':
      return {
        state: 'trainer_request_loading',
        eyebrow: 'Specialist pass',
        title: 'A narrower trainer read is being added on top of the same direction.',
        statusLine: `The main guidance read stays stable while the specialist angle prepares to ${lexicon.trainerGain} and ${intentPromise}, based on the direction already confirmed here.`,
        tone: 'progress',
      };
    case 'trainer_retry_ready':
      return {
        state: 'trainer_retry_ready',
        eyebrow: 'Specialist layer',
        title: 'The main read is still intact and the trainer path can be retried.',
        statusLine: 'The core direction remains usable even if the last specialist request did not land. Nothing from the main read was lost.',
        tone: 'steady',
      };
    case 'fresh_retry_ready':
      return {
        state: 'fresh_retry_ready',
        eyebrow: 'Ready to retry',
        title: 'The input is still intact and ready for another pass.',
        statusLine: `Nothing was lost. The previous input is still here, so you can refine the wording and run the same guidance flow again until the read on ${lexicon.readout} comes through more cleanly.`,
        tone: 'steady',
      };
    case 'dossier_conversion_loading':
      return {
        state: 'dossier_conversion_loading',
        eyebrow: 'Opening mission control',
        title: 'The current guidance read is being carried into a dossier workspace.',
        statusLine: buildDossierConversionStatusLine(input.rightRailView),
        tone: 'progress',
      };
    case 'execution_ready':
      return {
        state: 'execution_ready',
        eyebrow: 'Plan ready',
        title: copyProfile.domainFamily === 'structure'
          ? 'The plan is confirmed and ready to move.'
          : 'The direction is confirmed and ready to move.',
        statusLine: `Clarification is complete, so the page is holding one clean bridge to ${lexicon.executionBridge}, based on the route already confirmed here.`,
        tone: 'steady',
      };
    case 'clarifying_ready':
      return {
        state: 'clarifying_ready',
        eyebrow: 'Clarifying the direction',
        title: 'You already have the shape of the route; one missing point is still keeping it light.',
        statusLine: `The page is holding the current thread steady until that last detail is clear enough to ${lexicon.refinedTarget}, based on what is already clear.`,
        tone: 'steady',
      };
    case 'refined_ready':
      return {
        state: 'refined_ready',
        eyebrow: 'Direction confirmed',
        title: `The ${lexicon.coreNoun} is clearer, tighter, and easier to act on now.`,
        statusLine: copyProfile.hasPriorAnswers
          ? `You now know what changed from what you already clarified: the current read is strong enough to guide the ${lexicon.nextMove} while still leaving room to ${lexicon.trainerGain}, based on the strongest signals already confirmed here.`
          : `You now know what changed: the current read is strong enough to guide the ${lexicon.nextMove} while still leaving room to ${lexicon.trainerGain}, based on the strongest signals already on the page.`,
        tone: 'steady',
      };
    case 'degraded_result_fallback':
      return {
        state: 'degraded_result_fallback',
        eyebrow: 'Stable fallback',
        title: 'The core guidance read is still here and safe to use.',
        statusLine: `Nothing important was lost. The page is only showing the sections that still have enough authority to ${lexicon.trustFrame}, so the result stays usable and safe.`,
        tone: 'neutral',
      };
    case 'fresh_ready':
    default:
      return {
        state: 'fresh_ready',
        eyebrow: 'Ready to begin',
        title: 'The first read will stay simple and controlled.',
        statusLine: input.rightRailView.result.panel.detectedDomain
          ? `Start with one raw situation and the page will turn it into a calm read on ${lexicon.readout}, plus the first visible sign of progress.`
          : 'Start with one raw situation and the page will turn it into a calm summary, one next step, and the first visible sign of progress.',
        tone: 'neutral',
      };
  }
}

function resolveGuidanceProgressMessageState(
  input: PresentGuidanceProgressMessageInput
): GuidanceProgressMessageState {
  const hasResult = input.state.session.result !== null;
  const guidanceSession = input.state.session.guidanceSession;
  const decisionAuthority = getGuidanceDecisionAuthority(guidanceSession);
  const guidancePhase = getGuidanceSessionPhase(guidanceSession);
  const hasExecutionReadySection = input.rightRailView.executionReadySection !== null;
  const hasRenderableOnboarding = input.rightRailView.onboardingSession !== null;
  const hasDegradedAuthority = hasResult && (
    !guidanceSession
    || decisionAuthority?.level === 'degraded'
    || (guidancePhase === 'execution_ready' && !hasExecutionReadySection)
    || (guidancePhase && guidancePhase !== 'execution_ready' && !hasRenderableOnboarding)
  );

  if (input.state.feedback.isLoading) {
    return 'fresh_submit_loading';
  }

  if (input.state.feedback.isSubmittingFollowUp) {
    return 'clarifying_continue_loading';
  }

  if (input.state.session.trainerLoading) {
    return 'trainer_request_loading';
  }

  if (input.state.session.trainerError) {
    return 'trainer_retry_ready';
  }

  if (input.state.feedback.error && !hasResult) {
    return 'fresh_retry_ready';
  }

  if (hasExecutionReadySection) {
    return 'execution_ready';
  }

  if (hasRenderableOnboarding && guidancePhase === 'clarifying') {
    return 'clarifying_ready';
  }

  if (hasRenderableOnboarding && guidancePhase === 'refined_direction') {
    return 'refined_ready';
  }

  if (hasDegradedAuthority) {
    return 'degraded_result_fallback';
  }

  return 'fresh_ready';
}
function buildDossierConversionStatusLine(
  rightRailView: GuidanceRightRailViewModel
): string {
  const nextStep = rightRailView.executionReadySection?.transition.nextStep ?? rightRailView.result.panel.result?.next_step ?? 'the current next step';
  const copyProfile = buildGuidanceCopyProfile({
    detectedDomain: rightRailView.result.panel.detectedDomain,
    activeMode: rightRailView.result.panel.activeMode,
  });
  const lexicon = getGuidanceDomainLexicon(copyProfile);
  return `The current route is packaging "${nextStep}" into a persistent workspace so the page can ${lexicon.executionBridge} without losing the guidance thread you already clarified.`;
}
