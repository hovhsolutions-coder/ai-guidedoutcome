import { detectDomain } from '@/src/lib/ai/domain/detect-domain';
import { getGuidanceModeConfig } from '@/src/lib/ai/modes/mode-config';
import { resolveGuidanceModeId } from '@/src/lib/ai/modes/resolve-mode';
import {
  buildGuidanceCopyProfile,
  getGuidanceCtaPromise,
  getGuidanceDomainLexicon,
  getGuidancePersonalizedPrefix,
} from '@/src/components/guidance/guidance-copy-personalization';
import { type GuidanceIntakePresentation } from '@/src/components/guidance/guidance-presentation-contracts';
import { type GuidanceSessionStoreState } from '@/src/components/guidance/guidance-session-store';

interface PresentGuidanceIntakeInput {
  state: GuidanceSessionStoreState;
  liveRawInput: string;
}

export function presentGuidanceIntake(
  input: PresentGuidanceIntakeInput
): GuidanceIntakePresentation {
  const hasPrimaryInput = input.liveRawInput.trim().length > 0;
  const detectedDomainResult = hasPrimaryInput ? detectDomain(input.liveRawInput) : null;
  const authoritativeDetectedDomain = input.state.session.resultMeta?.detectedDomain ?? null;
  const authoritativeActiveMode = input.state.session.resultMeta?.activeMode ?? null;
  const liveRecommendedMode = detectedDomainResult ? resolveGuidanceModeId(detectedDomainResult) : null;
  const recommendedMode = authoritativeActiveMode ?? liveRecommendedMode;
  const shouldOfferDossier = input.state.session.resultMeta?.shouldOfferDossier
    ?? detectedDomainResult?.shouldOfferDossier
    ?? false;
  const displayedDomain = authoritativeDetectedDomain ?? detectedDomainResult?.primaryDomain ?? null;
  
  // Mode suggestion: determine suggested vs active and whether user has overridden
  const suggestedMode = liveRecommendedMode ?? authoritativeActiveMode ?? null;
  const activeMode = authoritativeActiveMode ?? liveRecommendedMode ?? null;
  const hasUserOverride = Boolean(authoritativeActiveMode && liveRecommendedMode && authoritativeActiveMode !== liveRecommendedMode);
  
  const copyProfile = buildGuidanceCopyProfile({
    rawInput: input.liveRawInput,
    detectedDomain: displayedDomain,
    activeMode: recommendedMode,
    intakeAnswers: input.state.input.intakeAnswers,
  });
  const lexicon = getGuidanceDomainLexicon(copyProfile);
  const submitPrefix = getGuidancePersonalizedPrefix(copyProfile);

  return {
    universal: {
      eyebrow: 'Start here',
      title: 'What do you need help with right now?',
      description: 'Write it the messy way first. We will detect the shape, choose the guidance mode, and only ask for extra structure if it helps the next move land more cleanly.',
      optionalLabel: 'Optional: sharpen the intake',
      optionalDescription: 'Add these only if you already know them. The flow still works without them.',
      domainInsight: {
        detectedDomain: displayedDomain,
        confidence: detectedDomainResult?.confidence ?? null,
        hasInput: hasPrimaryInput,
        insightLabel: hasPrimaryInput && displayedDomain ? formatLabel(displayedDomain) : 'Waiting for input',
        insightDescription: hasPrimaryInput && displayedDomain
          ? `System detected this looks like a ${formatLabel(displayedDomain)} situation. This shapes how the guidance will read.`
          : null,
      },
    },
    mode: {
      hasPrimaryInput,
      detectedDomain: displayedDomain,
      recommendedMode,
      shouldOfferDossier,
      eyebrow: 'Guided shaping',
      description: hasPrimaryInput
        ? `Auto mode is shaping this around ${lexicon.readout}. Only step in manually when you want to push the read toward a different framing.`
        : 'Auto mode is the default. Only step in manually when you want to push the read toward a different framing.',
      domainLabel: 'Domain',
      domainValue: displayedDomain ? formatLabel(displayedDomain) : 'Waiting for input',
      dossierLabel: 'Dossier signal',
      dossierValue: shouldOfferDossier ? 'Likely useful later' : 'Probably not needed yet',
      waitingTitle: 'Mode will appear after the first input',
      waitingDescription: 'Once there is enough context, we will confirm the detected domain and recommended mode here.',
      autoModeTitle: 'Auto mode is active',
      autoModeDescription: recommendedMode
        ? `Current recommendation: ${getGuidanceModeConfig(recommendedMode).label}.`
        : 'The recommended mode will appear as soon as the input is clear enough.',
      overrideTitle: 'Override only if you want a different angle',
      structuredDescription: 'These answers stay optional. They just give the existing guidance route a cleaner shape to work with.',
      modeSuggestion: {
        suggestedMode,
        activeMode,
        hasUserOverride,
        rationale: suggestedMode
          ? `System detected ${displayedDomain ?? 'your input'} and recommends ${getGuidanceModeConfig(suggestedMode).label} mode.`
          : null,
        systemLabel: 'System suggestion',
        overrideLabel: hasUserOverride ? 'Manual override active' : 'Manual override available',
      },
    },
    submit: {
      label: input.state.feedback.isLoading
        ? 'Generating guidance...'
        : input.state.session.result
          ? 'Regenerate guidance'
          : 'Generate guidance',
      helperText: input.state.feedback.isLoading
        ? `${submitPrefix} into a fresh structured read that keeps ${lexicon.readout} aligned.`
        : `${submitPrefix} into one summary, one next step, and supporting tasks that ${getGuidanceCtaPromise(copyProfile)}.`,
      disabled:
        input.state.feedback.isLoading
        || input.state.feedback.isSubmittingFollowUp
        || input.state.session.trainerLoading !== null
        || !input.state.input.rawInput.trim(),
    },
  };
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ');
}
