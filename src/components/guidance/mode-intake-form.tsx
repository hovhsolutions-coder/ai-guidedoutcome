'use client';

import { getGuidanceModeConfig, guidanceModeConfig } from '@/src/lib/ai/modes/mode-config';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import {
  type GuidanceModeIntakePresentation,
  type GuidanceZoneProfile,
} from '@/src/components/guidance/guidance-presentation-contracts';
import {
  GUIDANCE_DISABLED_INTERACTION_CLASS_NAME,
  GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME,
} from '@/src/components/guidance/guidance-semantic-feedback';
import { cn } from '@/lib/utils';

type ModeSelection = 'auto' | GuidanceModeId;

interface ModeIntakeFormProps {
  selectedMode: ModeSelection;
  onModeChange: (mode: ModeSelection) => void;
  intakeAnswers: Record<string, string>;
  onIntakeAnswersChange: (answers: Record<string, string>) => void;
  zoneProfile: GuidanceZoneProfile;
  presentation: GuidanceModeIntakePresentation;
}

const MODE_FIELDS: Record<GuidanceModeId, Array<{ key: string; label: string; placeholder: string }>> = {
  decision: [
    { key: 'options', label: 'Options in play', placeholder: 'What are the main options or forks?' },
    { key: 'decision_deadline', label: 'Decision deadline', placeholder: 'When does this decision have to land?' },
    { key: 'main_constraint', label: 'Main constraint', placeholder: 'What cannot be compromised?' },
  ],
  problem_solver: [
    { key: 'blocker', label: 'Main blocker', placeholder: 'What is actually stopping progress?' },
    { key: 'attempted', label: 'What you tried', placeholder: 'What have you already tested or ruled out?' },
    { key: 'impact', label: 'Impact if unresolved', placeholder: 'What gets worse if this stays stuck?' },
  ],
  conflict: [
    { key: 'other_party', label: 'Other party', placeholder: 'Who is involved on the other side?' },
    { key: 'stakes', label: 'Stakes', placeholder: 'What matters if this goes badly or well?' },
    { key: 'desired_outcome', label: 'Desired outcome', placeholder: 'What would a good resolution look like?' },
  ],
  planning: [
    { key: 'timeline', label: 'Timeline', placeholder: 'What timing or milestones matter?' },
    { key: 'constraints', label: 'Constraints', placeholder: 'What limits shape the plan?' },
    { key: 'resources', label: 'Resources', placeholder: 'What people, time, or assets are available?' },
  ],
  quick_assist: [
    { key: 'needed_answer', label: 'Needed answer', placeholder: 'What answer would help most right now?' },
    { key: 'context_window', label: 'Useful context', placeholder: 'What small detail would sharpen the answer?' },
  ],
};

export function ModeIntakeForm({
  selectedMode,
  onModeChange,
  intakeAnswers,
  onIntakeAnswersChange,
  zoneProfile,
  presentation,
}: ModeIntakeFormProps) {
  const density = zoneProfile.contentDensity ?? 'guided';
  const intent = zoneProfile.microcopyIntent ?? 'orient';
  const outcome = zoneProfile.sectionOutcome ?? 'capture';
  const rhythm = zoneProfile.surfaceRhythm ?? 'steady';
  const continuity = zoneProfile.transitionContinuity ?? 'persist';
  const weight = zoneProfile.visualWeight ?? 'balanced';
  const hasPrimaryInput = presentation.hasPrimaryInput;
  const recommendedMode = presentation.recommendedMode;
  const visibleMode = selectedMode === 'auto' ? recommendedMode : selectedMode;
  const fields = visibleMode ? MODE_FIELDS[visibleMode] : [];
  const isMinimal = density === 'minimal';
  
  // Mode suggestion state extraction
  const { modeSuggestion } = presentation;
  const hasSuggestion = Boolean(modeSuggestion.suggestedMode);
  const isOverridden = selectedMode !== 'auto' && selectedMode !== modeSuggestion.suggestedMode;
  const effectiveActiveMode = selectedMode === 'auto' ? modeSuggestion.activeMode : selectedMode;
  
  const helperDescription = intent === 'confirm'
    ? 'The mode hint is holding steady and can keep shaping the same guidance thread.'
    : presentation.description;
  const structuredDescription = intent === 'confirm'
    ? 'Add only the detail that sharpens the current path. The rest of the thread can stay as-is.'
    : presentation.structuredDescription;
  const overrideTitle = outcome === 'capture'
    ? presentation.overrideTitle
    : 'Alternative mode angles';
  const containerSpacing = rhythm === 'spacious'
    ? 'space-y-6 p-6 sm:p-7'
    : rhythm === 'compact'
      ? 'space-y-4 p-4 sm:p-5'
      : 'space-y-5 p-5 sm:p-6';
  const continuityClass = continuity === 'settle'
    ? 'opacity-90 ring-1 ring-[rgba(255,255,255,0.04)]'
    : continuity === 'advance'
      ? 'shadow-[0_10px_22px_rgba(5,12,22,0.08)]'
      : 'ring-1 ring-[rgba(255,255,255,0.03)]';
  const metadataClass = weight === 'strong'
    ? 'text-[var(--text-primary)]'
    : weight === 'subtle'
      ? 'text-[var(--text-secondary)]'
      : 'text-[var(--text-primary)]';

  return (
    <div className={`ui-surface-secondary border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] ${containerSpacing} ${continuityClass}`.trim()}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {presentation.eyebrow}
          </p>
          {!isMinimal ? (
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              {helperDescription}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-2 xl:min-w-[320px]">
          <div className="ui-metadata-block px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{presentation.domainLabel}</p>
            <p className={`mt-2 text-sm ${metadataClass}`}>{presentation.domainValue}</p>
          </div>
          <div className="ui-metadata-block px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{presentation.dossierLabel}</p>
            <p className={`mt-2 text-sm ${metadataClass}`}>{presentation.dossierValue}</p>
          </div>
        </div>
      </div>

      {!hasPrimaryInput ? (
        <div className="ui-metadata-block px-4 py-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">{presentation.waitingTitle}</p>
          {!isMinimal ? (
            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              {presentation.waitingDescription}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {/* Mode Suggestion Surface */}
          {hasSuggestion && (
            <div className={cn(
              'ui-metadata-block flex flex-col gap-3 px-4 py-4',
              isOverridden ? 'border-[rgba(242,202,115,0.16)]' : 'border-[rgba(94,142,242,0.16)]'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'inline-flex h-2 w-2 rounded-full',
                    isOverridden ? 'bg-[var(--warning-soft)]' : 'bg-[var(--accent-primary-strong)]'
                  )} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                    {isOverridden ? modeSuggestion.overrideLabel : modeSuggestion.systemLabel}
                  </span>
                </div>
                {isOverridden && (
                  <button
                    type="button"
                    onClick={() => onModeChange('auto')}
                    className="text-[10px] uppercase tracking-[0.12em] text-[var(--accent-primary-strong)] hover:text-[var(--accent-primary)] motion-safe:transition-colors"
                  >
                    Reset to suggested
                  </button>
                )}
              </div>
              
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {effectiveActiveMode ? getGuidanceModeConfig(effectiveActiveMode).label : 'Auto mode'}
                  </p>
                  {!isMinimal && modeSuggestion.rationale && !isOverridden && (
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      {modeSuggestion.rationale}
                    </p>
                  )}
                  {isOverridden && modeSuggestion.suggestedMode && (
                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                      Suggested: {getGuidanceModeConfig(modeSuggestion.suggestedMode).label}
                    </p>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => onModeChange('auto')}
                  disabled={!hasPrimaryInput || selectedMode === 'auto'}
                  aria-disabled={!hasPrimaryInput || selectedMode === 'auto'}
                  aria-pressed={selectedMode === 'auto'}
                  className={cn(
                    `ui-button-secondary min-h-0 shrink-0 px-3 py-2 text-[11px] uppercase tracking-[0.12em] motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME} ${GUIDANCE_DISABLED_INTERACTION_CLASS_NAME}`,
                    selectedMode === 'auto' 
                      ? 'border-[rgba(94,142,242,0.26)] text-[var(--accent-primary-strong)]' 
                      : ''
                  )}
                >
                  {selectedMode === 'auto' ? 'Auto active' : 'Use auto'}
                </button>
              </div>
            </div>
          )}

          {/* Mode Override Selection */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {hasSuggestion ? 'Or choose a different mode:' : overrideTitle}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {(Object.keys(guidanceModeConfig) as GuidanceModeId[]).map((mode) => {
                const config = getGuidanceModeConfig(mode);
                const isSuggested = mode === modeSuggestion.suggestedMode;
                return (
                  <ModeButton
                    key={mode}
                    label={config.label}
                    description={isMinimal ? '' : `${formatLabel(config.toneProfile)} tone${config.prefersShortFlow ? ', shorter flow.' : ', fuller guidance.'}`}
                    selected={selectedMode === mode}
                    suggested={isSuggested}
                    onClick={() => onModeChange(mode)}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {hasPrimaryInput && fields.length > 0 && selectedMode !== 'auto' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Structured intake for {visibleMode ? getGuidanceModeConfig(visibleMode).label : 'this mode'}
              </p>
              {!isMinimal ? (
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {structuredDescription}
                </p>
              ) : null}
            </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">{field.label}</span>
                <textarea
                  value={intakeAnswers[field.key] ?? ''}
                  onChange={(event) =>
                    onIntakeAnswersChange({
                      ...intakeAnswers,
                      [field.key]: event.target.value,
                    })
                  }
                  placeholder={field.placeholder}
                  className={`ui-textarea min-h-[108px] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME}`.trim()}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ModeButtonProps {
  label: string;
  description: string;
  selected: boolean;
  suggested?: boolean;
  onClick: () => void;
}

function ModeButton({ label, description, selected, suggested, onClick }: ModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        `rounded-[18px] border px-4 py-4 text-left motion-safe:transition-[transform,opacity,background-color,border-color,box-shadow] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] hover:enabled:-translate-y-[1px] active:enabled:translate-y-0 active:enabled:scale-[0.99] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME}`,
        selected
          ? 'ui-objective-highlight border-[rgba(94,142,242,0.26)] bg-[rgba(94,142,242,0.1)]'
          : suggested
            ? 'border-[rgba(94,142,242,0.14)] bg-[rgba(94,142,242,0.06)] hover:border-[rgba(109,156,255,0.22)] hover:bg-[rgba(94,142,242,0.1)]'
            : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(109,156,255,0.16)] hover:bg-[rgba(255,255,255,0.04)] focus-visible:border-[rgba(109,156,255,0.2)]'
      )}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        {suggested && !selected && (
          <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[var(--accent-primary-strong)]">
            Suggested
          </span>
        )}
      </div>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      ) : null}
    </button>
  );
}

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ');
}
