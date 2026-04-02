'use client';

import React from 'react';
import {
  type GuidanceContentDensity,
  type GuidanceMicrocopyIntent,
  type GuidanceSectionOutcome,
  type GuidanceSurfaceRhythm,
  type GuidanceTransitionContinuity,
  type GuidanceVisualWeight,
  type GuidanceUniversalIntakePresentation,
  type GuidanceZoneProfile,
} from '@/src/components/guidance/guidance-presentation-contracts';
import { GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME } from '@/src/components/guidance/guidance-semantic-feedback';

interface UniversalIntakeProps {
  rawInput: string;
  onRawInputChange: (value: string) => void;
  situation: string;
  onSituationChange: (value: string) => void;
  mainGoal: string;
  onMainGoalChange: (value: string) => void;
  zoneProfile: GuidanceZoneProfile;
  presentation: GuidanceUniversalIntakePresentation;
}

export function UniversalIntake({
  rawInput,
  onRawInputChange,
  situation,
  onSituationChange,
  mainGoal,
  onMainGoalChange,
  zoneProfile,
  presentation,
}: UniversalIntakeProps) {
  const density = zoneProfile.contentDensity ?? 'guided';
  const intent = zoneProfile.microcopyIntent ?? 'orient';
  const outcome = zoneProfile.sectionOutcome ?? 'capture';
  const rhythm = zoneProfile.surfaceRhythm ?? 'steady';
  const continuity = zoneProfile.transitionContinuity ?? 'persist';
  const weight = zoneProfile.visualWeight ?? 'balanced';
  const isMinimal = density === 'minimal';
  const inputHelper = intent === 'confirm'
    ? 'This same input remains the anchor for the current guidance thread.'
    : 'Start with raw context first. The system will structure it into a cleaner read.';
  const optionalSectionLabel = outcome === 'capture'
    ? presentation.optionalLabel
    : 'Optional support';
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
  const headingClass = weight === 'strong'
    ? 'text-[2rem] font-semibold tracking-[-0.04em]'
    : weight === 'subtle'
      ? 'text-[1.7rem] font-medium tracking-[-0.03em]'
      : 'text-2xl font-semibold tracking-[-0.035em]';

  return (
    <div className={`ui-surface-secondary border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] ${containerSpacing} ${continuityClass}`.trim()}>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          {presentation.eyebrow}
        </p>
        <h2 className={`${headingClass} text-[var(--text-primary)]`}>
          {presentation.title}
        </h2>
        {!isMinimal ? (
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            {presentation.description}
          </p>
        ) : null}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">Your situation</span>
        <textarea
          value={rawInput}
          onChange={(event) => onRawInputChange(event.target.value)}
          placeholder="Example: I need to decide whether to push back on a client scope change, but the relationship matters and the team is already overloaded."
          className={`ui-textarea min-h-[240px] text-[15px] leading-7 ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME}`.trim()}
        />
        {!isMinimal ? (
          <p className="text-xs leading-5 text-[var(--text-secondary)]">{inputHelper}</p>
        ) : null}
      </label>

      {/* Domain Insight - lightweight preview of what the system detected */}
      {presentation.domainInsight.hasInput && !isMinimal && (
        <div className="border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] rounded-[6px] px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex h-1 w-1 rounded-full bg-[var(--text-muted)] opacity-60" />
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Reading as
            </span>
            {presentation.domainInsight.confidence && presentation.domainInsight.confidence >= 0.75 && (
              <span className="text-[9px] text-[var(--text-muted)] opacity-50 ml-auto">
                {Math.round(presentation.domainInsight.confidence * 100)}% sure
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-primary)]">
            {presentation.domainInsight.insightLabel}
          </p>
          {presentation.domainInsight.insightDescription && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 opacity-70">
              {presentation.domainInsight.insightDescription}
            </p>
          )}
        </div>
      )}

      {/* Prompt to continue typing when input is minimal */}
      {!presentation.domainInsight.hasInput && !isMinimal && rawInput.length > 10 && rawInput.length < 30 && (
        <div className="text-xs text-[var(--text-secondary)] opacity-60 px-1">
          Continue describing your situation to see what the system detects...
        </div>
      )}

      <div className="ui-metadata-block space-y-4 border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.022)] px-4 py-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">{optionalSectionLabel}</p>
          {!isMinimal ? (
            <p className="text-xs leading-5 text-[var(--text-secondary)]">
              {presentation.optionalDescription}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Cleaner situation summary</span>
            <textarea
              value={situation}
              onChange={(event) => onSituationChange(event.target.value)}
              placeholder="Optional: one cleaner sentence if you already know the setup."
              className={`ui-textarea min-h-[120px] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME}`.trim()}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Desired outcome</span>
            <textarea
              value={mainGoal}
              onChange={(event) => onMainGoalChange(event.target.value)}
              placeholder="Optional: what outcome matters most here?"
              className={`ui-textarea min-h-[120px] ${GUIDANCE_INTERACTIVE_FOCUS_RING_CLASS_NAME}`.trim()}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
