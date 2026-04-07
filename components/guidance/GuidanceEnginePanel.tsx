import React, { useMemo } from 'react';
import { type DossierPhase } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { ChatInput } from '@/components/chat/ChatInput';
import { type AIResponseContent, type ChatMessageData } from '@/components/chat/ChatMessage';
import { GuidanceEmptyState } from '@/components/guidance/GuidanceEmptyState';
import { GuidanceErrorCard } from '@/components/guidance/GuidanceErrorCard';
import { GuidanceNextMove } from '@/components/guidance/GuidanceNextMove';
import { TrainerResponseBlock } from '@/components/guidance/TrainerResponseBlock';
import { getTrainerRecommendations } from '@/components/guidance/trainerRecommendations';
import { detectDomain } from '@/src/lib/ai/domain/detect-domain';
import { resolveGuidanceModeId } from '@/src/lib/ai/modes/resolve-mode';
import { AITrainerId, AITrainerResponseOutput } from '@/src/lib/ai/types';

interface GuidanceEnginePanelProps {
  phase: string;
  currentGuidance: AIResponseContent | null;
  currentGuidanceLabel?: string;
  currentObjective: string;
  focusBadge: string;
  statusLine: string;
  historyMessages: ChatMessageData[];
  error: string | null;
  isLoading: boolean;
  primaryCtaLabel: string;
  decisionPrompt: string;
  totalTasks: number;
  completedCount: number;
  onAddAction: (action: string) => void;
  isActionAdded: (action: string) => boolean;
  onPrimaryAction: () => void;
  onReviewTasks: () => void;
  onDecisionPrimary: () => void;
  onDecisionSecondary: () => void;
  onQuickPrompt: (prompt: string) => void;
  onRefineSubmit: (message: string) => void;
  activeTrainer: AITrainerId | null;
  trainerResponse: AITrainerResponseOutput | null;
  trainerError: string | null;
  trainerLoading: AITrainerId | null;
  onSelectTrainer: (trainer: AITrainerId) => void;
}

export function GuidanceEnginePanel({
  phase,
  currentGuidance,
  currentGuidanceLabel,
  currentObjective,
  focusBadge,
  statusLine,
  historyMessages,
  error,
  isLoading,
  primaryCtaLabel,
  decisionPrompt,
  totalTasks,
  completedCount,
  onAddAction,
  isActionAdded,
  onPrimaryAction,
  onReviewTasks,
  onDecisionPrimary,
  onDecisionSecondary,
  onQuickPrompt,
  onRefineSubmit,
  activeTrainer,
  trainerResponse,
  trainerError,
  trainerLoading,
  onSelectTrainer,
}: GuidanceEnginePanelProps) {
  const trainerRecommendations = useMemo(() => {
    const contextInput = buildTrainerContextInput({
      currentObjective,
      currentGuidanceSummary: currentGuidance?.summary,
      currentGuidanceNextStep: currentGuidance?.next_step,
      focusBadge,
      statusLine,
      phase,
    });
    const detectedDomain = contextInput ? detectDomain(contextInput) : null;

    return getTrainerRecommendations({
      phase,
      totalTasks,
      completedCount,
      currentObjective,
      currentGuidanceSummary: currentGuidance?.summary,
      currentGuidanceNextStep: currentGuidance?.next_step,
      activeMode: detectedDomain ? resolveGuidanceModeId(detectedDomain) : undefined,
      detectedDomain: detectedDomain?.primaryDomain,
    });
  }, [
    completedCount,
    currentGuidance?.next_step,
    currentGuidance?.summary,
    currentObjective,
    focusBadge,
    phase,
    statusLine,
    totalTasks,
  ]);

  return (
    <div className="ui-surface-primary flex h-full flex-col overflow-hidden">
      <div className="border-b border-[var(--border-subtle)] bg-[linear-gradient(90deg,rgba(255,255,255,0.03),transparent)] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Coach guidance</h3>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              {getGuidanceSubtitle(phase)}
            </p>
          </div>
          <div className="hidden sm:flex">
            <span className={cn(
              'ui-chip',
              phase === 'Understanding' && 'ui-chip-understanding',
              phase === 'Structuring' && 'ui-chip-structuring',
              phase === 'Executing' && 'ui-chip-action',
              phase === 'Completed' && 'ui-chip-success',
              !['Understanding', 'Structuring', 'Executing', 'Completed'].includes(phase) && 'ui-chip-accent'
            )}>{phase} phase</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        {error && <GuidanceErrorCard error={error} />}

        {!currentGuidance && !isLoading ? (
          <GuidanceEmptyState onPrompt={onQuickPrompt} />
        ) : (
          <>
            {currentGuidance && (
              <div className="space-y-5">
                <div className="ui-surface-secondary space-y-3 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                    {currentGuidanceLabel ?? 'Current read'}
                  </p>
                  <p className="text-sm leading-6 text-[var(--text-primary)]">{currentGuidance.summary}</p>
                </div>

                <GuidanceNextMove
                  nextStep={currentObjective}
                  focusBadge={focusBadge}
                  statusLine={statusLine}
                  primaryLabel={primaryCtaLabel}
                  phase={phase as DossierPhase}
                  onPrimaryAction={onPrimaryAction}
                  onReviewTasks={onReviewTasks}
                />

                {currentGuidance.suggested_tasks.length > 0 && (
                  <div className="ui-surface-secondary space-y-3 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                      Quick supporting moves
                    </p>
                    <div className="space-y-2">
                      {currentGuidance.suggested_tasks.slice(0, 2).map((task) => (
                        <button
                          key={task}
                          type="button"
                          onClick={() => onAddAction(task)}
                          disabled={isActionAdded(task)}
                          className={cn(
                            'w-full rounded-[12px] border px-3 py-2.5 text-left text-sm transition-colors',
                            isActionAdded(task)
                              ? 'border-[rgba(114,213,154,0.26)] bg-[var(--success-soft)] text-[var(--success-strong)]'
                              : 'border-[var(--border-subtle)] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                          )}
                        >
                          {isActionAdded(task) ? `Added: ${task}` : task}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ui-surface-secondary space-y-3 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                    Decision support
                  </p>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{decisionPrompt}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onDecisionPrimary}
                      className="ui-button-secondary min-h-0 px-3 py-2 text-[11px] uppercase tracking-[0.12em]"
                    >
                      Clarify next move
                    </button>
                    <button
                      type="button"
                      onClick={onDecisionSecondary}
                      className="ui-button-secondary min-h-0 px-3 py-2 text-[11px] uppercase tracking-[0.12em]"
                    >
                      Surface blind spots
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="ui-surface-secondary space-y-4 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[var(--text-primary)]">Refreshing guidance...</span>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Syncing focus
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="ui-skeleton h-3 w-28" />
                  <div className="ui-skeleton h-6 w-4/5" />
                  <div className="ui-skeleton h-5 w-full" />
                </div>
              </div>
            )}

            {(historyMessages.length > 0 || trainerRecommendations.inlineActions.length > 0 || trainerResponse || trainerError) && (
              <details className="ui-surface-secondary p-5">
                <summary className="cursor-pointer text-sm font-medium text-[var(--text-primary)]">
                  Advanced coach tools
                </summary>
                <div className="mt-4 space-y-4">
                  {trainerRecommendations.inlineActions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {trainerRecommendations.inlineActions.slice(0, 3).map((action) => (
                        <button
                          key={action.trainer}
                          type="button"
                          onClick={() => onSelectTrainer(action.trainer)}
                          disabled={trainerLoading !== null}
                          className={cn(
                            'ui-button-secondary min-h-0 px-3 py-2 text-[11px] uppercase tracking-[0.12em] sm:px-4',
                            action.emphasized && 'ui-objective-highlight border-[rgba(94,142,242,0.24)] bg-[rgba(94,142,242,0.08)]'
                          )}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <TrainerResponseBlock
                    response={trainerResponse}
                    error={trainerError}
                    isLoading={trainerLoading !== null}
                    loadingTrainer={trainerLoading}
                    onAddAction={onAddAction}
                  />

                  {historyMessages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                        Recent coach notes
                      </p>
                      <div className="space-y-2">
                        {historyMessages.slice(-3).map((message) => (
                          <div key={message.id} className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-2.5">
                            <p className="text-xs text-[var(--text-secondary)]">{getMessagePreview(message)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            )}
          </>
        )}
      </div>

      <div className="space-y-4 border-t border-[var(--border-subtle)] bg-[color:var(--surface-secondary)]/78 px-6 py-4 backdrop-blur-sm">
        <div className="flex flex-wrap gap-2">
          {getIntentQuickPrompts(phase).slice(0, 2).map(({ label, prompt }) => (
            <button
              key={label}
              onClick={() => onQuickPrompt(prompt)}
              disabled={isLoading}
              className="ui-button-secondary min-h-0 px-3 py-2 text-[11px] uppercase tracking-[0.12em]"
            >
              {label}
            </button>
          ))}
        </div>

        <ChatInput
          onSubmit={onRefineSubmit}
          isLoading={isLoading}
          placeholder={getIntentPlaceholder(phase)}
        />
      </div>
    </div>
  );
}

function getMessagePreview(message: ChatMessageData): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  if (message.content.next_step?.trim()) {
    return `Next step: ${message.content.next_step}`;
  }

  return message.content.summary || 'Coach note';
}

function buildTrainerContextInput(input: {
  currentObjective: string;
  currentGuidanceSummary?: string;
  currentGuidanceNextStep?: string;
  focusBadge: string;
  statusLine: string;
  phase: string;
}): string {
  return [
    input.currentObjective,
    input.currentGuidanceSummary,
    input.currentGuidanceNextStep,
    input.focusBadge,
    input.statusLine,
    input.phase,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('\n');
}

// Phase-aware guidance panel subtitle
function getGuidanceSubtitle(phase: string): string {
  switch (phase) {
    case 'Understanding':
      return 'Exploring the situation to build clarity';
    case 'Structuring':
      return 'Planning approach and making decisions';
    case 'Executing':
      return 'Strategic direction for execution';
    case 'Completed':
      return 'Review and capture learnings';
    default:
      return 'Strategic direction for this dossier';
  }
}

// Intent-aware quick prompts based on phase
function getIntentQuickPrompts(phase: string): Array<{ label: string; prompt: string }> {
  switch (phase) {
    case 'Understanding':
      return [
        { label: 'Clarify situation', prompt: 'Help me understand the situation better.' },
        { label: 'Surface unknowns', prompt: 'What am I missing or not seeing clearly?' },
        { label: 'Ask questions', prompt: 'What questions should I be asking right now?' },
      ];
    case 'Structuring':
      return [
        { label: 'Define approach', prompt: 'What approach should I take?' },
        { label: 'Evaluate options', prompt: 'What are my options and tradeoffs?' },
        { label: 'Plan the work', prompt: 'Help me break this down into steps.' },
      ];
    case 'Executing':
      return [
        { label: 'Next action', prompt: 'What should I do next?' },
        { label: 'Break down task', prompt: 'Break this down into smaller actions.' },
        { label: 'Identify blockers', prompt: 'What might block me and how do I handle it?' },
      ];
    case 'Completed':
      return [
        { label: 'Review outcome', prompt: 'Help me review what was accomplished.' },
        { label: 'Capture learnings', prompt: 'What did we learn from this work?' },
        { label: 'Reflect', prompt: 'What insights should I carry forward?' },
      ];
    default:
      return [
        { label: 'Clarify focus', prompt: 'What should I do next?' },
        { label: 'Refine next move', prompt: 'Break this down into steps.' },
        { label: 'Surface risks', prompt: 'What am I missing?' },
      ];
  }
}

// Intent-aware chat input placeholder
function getIntentPlaceholder(phase: string): string {
  switch (phase) {
    case 'Understanding':
      return 'Describe what you are trying to understand, ask questions, or explore the situation...';
    case 'Structuring':
      return 'Define your approach, evaluate options, or plan the work...';
    case 'Executing':
      return 'Ask about next actions, get help with blockers, or refine tasks...';
    case 'Completed':
      return 'Review outcomes, capture learnings, or reflect on what was accomplished...';
    default:
      return 'Refine the plan, pressure-test the next move, or ask for sharper guidance...';
  }
}
