'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type MockDossier, type Task, type ActivityEntry } from '@/lib/mockData';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { isDossierReady } from '@/src/lib/dossiers/dossier-state';

interface DossierSetupShellProps {
  dossier: MockDossier;
}

// Get setup step for incomplete dossiers
function getSetupStep(dossier: MockDossier): 'intake_review' | 'guidance' | 'first_task' {
  const hasChatHistory = dossier.chatHistory && dossier.chatHistory.length > 0;
  const hasStructuredContracts = !!(dossier.narrative || dossier.systemPlan || dossier.executionPlan);

  if (!hasChatHistory && !hasStructuredContracts) {
    return 'intake_review';
  }
  if (!dossier.tasks || dossier.tasks.length === 0) {
    return 'first_task';
  }
  return 'guidance';
}

export function DossierSetupShell({ dossier }: DossierSetupShellProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityEntry[]>(dossier.activityHistory || []);
  const [setupStep, setSetupStep] = useState(getSetupStep(dossier));
  const [isCompleting, setIsCompleting] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleAddTask = useCallback((taskName: string) => {
    const newTask: Task = { name: taskName };
    setTasks((prev) => [...prev, newTask]);

    const newActivity: ActivityEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type: 'task_added',
      description: `Added first task "${taskName}" during setup`,
      timestamp: new Date().toISOString(),
      taskName,
    };
    setActivityHistory((prev) => [...prev, newActivity]);
  }, []);

  const persistSetupCompletion = useCallback(async (finalTasks: Task[], finalActivityHistory: ActivityEntry[]) => {
    try {
      const response = await fetch(`/api/dossiers/${dossier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: finalTasks,
          activityHistory: finalActivityHistory,
          lastActivity: 'Setup completed - dossier ready for execution',
          progress: finalTasks.length > 0 ? Math.round((finalTasks.filter(t => false).length / finalTasks.length) * 100) : 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save setup');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to persist setup:', error);
      return { success: false };
    }
  }, [dossier.id]);

  const handleCompleteSetup = useCallback(async () => {
    if (tasks.length === 0) return;
    setIsCompleting(true);
    setSaveError(null);

    const result = await persistSetupCompletion(tasks, activityHistory);

    if (result.success) {
      // Refresh the page to show the full dossier
      router.refresh();
    } else {
      setSaveError('Failed to save setup. Please try again.');
      setIsCompleting(false);
    }
  }, [tasks, activityHistory, persistSetupCompletion, router]);

  const handleSkipToExecution = useCallback(async () => {
    setIsCompleting(true);
    setSaveError(null);

    const result = await persistSetupCompletion(tasks, activityHistory);

    if (result.success) {
      router.refresh();
    } else {
      setSaveError('Failed to save setup. Please try again.');
      setIsCompleting(false);
    }
  }, [tasks, activityHistory, persistSetupCompletion, router]);

  // AI Unavailable fallback state
  if (aiUnavailable) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/dossiers"
            className="ui-button-ghost inline-flex min-h-0 items-center gap-2 px-0 py-0 text-[var(--accent-primary-strong)] hover:bg-transparent"
          >
            Back to Dossiers
          </Link>
        </div>

        <div className="ui-surface-primary p-8 text-center">
          <div className="mx-auto max-w-md space-y-6">
            <div className="inline-flex">
              <span className="ui-chip ui-chip-warning">Guidance Temporarily Unavailable</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                You can still continue
              </h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                AI guidance is experiencing high demand right now. Your dossier is ready—add tasks manually or try again shortly.
              </p>
            </div>

            <div className="ui-surface-secondary p-5 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-3">
                Quick start options
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                  <span>Add your first task below to start tracking progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                  <span>Refresh to retry AI guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                  <span>Use the chat panel when guidance becomes available</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 justify-center">
                <input
                  type="text"
                  placeholder="Enter your first task..."
                  className="ui-input flex-1 max-w-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleAddTask(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Enter your first task..."]') as HTMLInputElement;
                    if (input?.value.trim()) {
                      handleAddTask(input.value.trim());
                      input.value = '';
                    }
                  }}
                  className="ui-button-primary px-4 py-2"
                >
                  Add
                </button>
              </div>

              {tasks.length > 0 && (
                <div className="ui-surface-secondary p-4 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-2">
                    Tasks to add ({tasks.length})
                  </p>
                  <ul className="space-y-1">
                    {tasks.map((task, i) => (
                      <li key={i} className="text-sm text-[var(--text-primary)] flex items-center gap-2">
                        <span className="text-[var(--accent-primary)]">{i + 1}.</span>
                        {task.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleCompleteSetup}
                disabled={tasks.length === 0 || isCompleting}
                className="ui-button-primary w-full px-6 py-3 disabled:opacity-50"
              >
                {isCompleting ? 'Setting up...' : tasks.length > 0 ? 'Continue to Execution' : 'Add a task to continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/dossiers"
          className="ui-button-ghost inline-flex min-h-0 items-center gap-2 px-0 py-0 text-[var(--accent-primary-strong)] hover:bg-transparent"
        >
          Back to Dossiers
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-secondary)]">Setup progress:</span>
          <div className="flex gap-1">
            <span className={`h-2 w-2 rounded-full ${setupStep === 'intake_review' ? 'bg-[var(--accent-primary)]' : 'bg-[var(--color-green)]'}`} />
            <span className={`h-2 w-2 rounded-full ${setupStep === 'guidance' ? 'bg-[var(--accent-primary)]' : setupStep === 'first_task' ? 'bg-[var(--color-green)]' : 'bg-[var(--border-subtle)]'}`} />
            <span className={`h-2 w-2 rounded-full ${setupStep === 'first_task' ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-subtle)]'}`} />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="ui-surface-secondary border border-[rgba(255,107,107,0.4)] px-4 py-3 rounded-[14px]">
          <div className="flex items-center gap-3">
            <span className="text-[var(--color-red)]">⚠</span>
            <p className="text-sm text-[var(--text-secondary)]">{saveError}</p>
            <button
              onClick={() => setSaveError(null)}
              className="ml-auto text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Setup Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex">
          <span className="ui-chip ui-chip-understanding">Quick Setup</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          {setupStep === 'intake_review' && 'Ready to launch'}
          {setupStep === 'guidance' && 'Get guidance'}
          {setupStep === 'first_task' && 'Define your first move'}
        </h1>
        <p className="mx-auto max-w-xl text-[var(--text-secondary)]">
          {setupStep === 'intake_review' &&
            'Your dossier is created. Two minutes of setup, then straight into execution.'}
          {setupStep === 'guidance' &&
            'Get AI suggestions for your approach, or skip ahead to add tasks directly.'}
          {setupStep === 'first_task' &&
            'Add one concrete action you can start today. The workspace opens immediately after.'}
        </p>
      </div>

      {/* Intake Review Step */}
      {setupStep === 'intake_review' && (
        <div className="space-y-6">
          <div className="ui-surface-primary p-6 space-y-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Dossier Summary
              </p>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">{dossier.title}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="ui-surface-secondary p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-2">
                  Situation
                </p>
                <p className="text-sm text-[var(--text-primary)]">{dossier.situation}</p>
              </div>

              <div className="ui-surface-accent p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary-strong)] mb-2">
                  Goal
                </p>
                <p className="text-sm text-[var(--text-primary)]">{dossier.main_goal}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="ui-chip ui-chip-understanding">{dossier.phase} phase</span>
              <span className="text-sm text-[var(--text-muted)]">
                Created {dossier.createdAt}
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setSetupStep('guidance')}
              className="ui-button-primary px-10 py-5 text-lg font-semibold shadow-[0_8px_30px_rgba(94,142,242,0.25)] hover:shadow-[0_12px_40px_rgba(94,142,242,0.35)] transition-all flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get AI Guidance
            </button>
          </div>

          <div className="flex justify-center gap-4 text-sm">
            <button
              onClick={() => setSetupStep('first_task')}
              className="text-[var(--accent-primary-strong)] hover:underline"
            >
              I know what to do — add tasks now →
            </button>
          </div>
        </div>
      )}

      {/* Guidance Step */}
      {setupStep === 'guidance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="ui-surface-primary p-1">
              <ChatPanel
                dossier={{ ...dossier, phase: dossier.phase, tasks }}
                onAddTask={handleAddTask}
                completedTasks={new Set()}
                totalTasks={tasks.length}
                onTaskCompleted={() => {}}
                onGuidanceChange={() => {}}
                currentObjective={{
                  title: dossier.main_goal,
                  focusBadge: 'Setup',
                  statusLine: 'Getting initial guidance',
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="ui-surface-primary p-5 border border-[rgba(94,142,242,0.15)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)] mb-3">
                Quick start prompts
              </p>
              <ul className="space-y-2.5">
                {[
                  'What should I do first?',
                  'Break this into 3-5 concrete tasks',
                  'What might block me?',
                  'Help me prioritize',
                ].map((prompt) => (
                  <li
                    key={prompt}
                    className="flex items-center gap-2 text-sm text-[var(--text-primary)] hover:text-[var(--accent-primary-strong)] cursor-pointer group"
                    onClick={() => {
                      console.log('Would send:', prompt);
                    }}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary-soft)] text-[10px] font-semibold text-[var(--accent-primary-strong)] group-hover:scale-110 transition-transform">
                      ?
                    </span>
                    <span className="group-hover:underline">&quot;{prompt}&quot;</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ui-surface-secondary p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] mb-3">
                Tasks added ({tasks.length})
              </p>
              {tasks.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  No tasks yet. Ask the AI for suggestions, or type tasks directly in the chat.
                </p>
              ) : (
                <ul className="space-y-2">
                  {tasks.map((task, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--text-primary)]"
                    >
                      <span className="text-[var(--accent-primary)] font-medium">{i + 1}.</span>
                      {task.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={() => setSetupStep('first_task')}
              className="ui-button-secondary w-full"
            >
              {tasks.length > 0 ? 'Review tasks →' : 'Add tasks manually →'}
            </button>

            {/* AI Unavailable Toggle (for testing/demo) */}
            <button
              onClick={() => setAiUnavailable(true)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] w-full text-center"
            >
              (Simulate AI unavailable)
            </button>
          </div>
        </div>
      )}

      {/* First Task Step */}
      {setupStep === 'first_task' && (
        <div className="space-y-6">
          <div className="ui-surface-primary p-6 space-y-6 border border-[rgba(94,142,242,0.15)]">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
                Add your first task
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Start with one small, concrete action you can complete today.
              </p>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="e.g., Write the first draft of the proposal"
                className="ui-input flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleAddTask(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="e.g., Write the first draft of the proposal"]') as HTMLInputElement;
                  if (input?.value.trim()) {
                    handleAddTask(input.value.trim());
                    input.value = '';
                  }
                }}
                className="ui-button-primary px-6"
              >
                Add Task
              </button>
            </div>

            {tasks.length > 0 && (
              <div className="ui-surface-secondary p-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary-strong)]">
                  Tasks to be added ({tasks.length})
                </p>
                <ul className="space-y-2">
                  {tasks.map((task, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm text-[var(--text-primary)]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary-soft)] text-xs font-medium text-[var(--accent-primary-strong)]">
                          {i + 1}
                        </span>
                        {task.name}
                      </span>
                      <button
                        onClick={() => {
                          setTasks((prev) => prev.filter((_, idx) => idx !== i));
                        }}
                        className="text-[var(--text-muted)] hover:text-[var(--accent-error)] text-xs"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCompleteSetup}
              disabled={tasks.length === 0 || isCompleting}
              className="ui-button-primary px-8 py-4 text-lg font-semibold disabled:opacity-50 shadow-[0_8px_30px_rgba(94,142,242,0.25)] hover:shadow-[0_12px_40px_rgba(94,142,242,0.35)] transition-all flex items-center justify-center gap-2"
            >
              {isCompleting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Opening...
                </>
              ) : tasks.length > 0 ? (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Open Workspace ({tasks.length} task{tasks.length === 1 ? '' : 's'})
                </>
              ) : (
                'Add a task to continue'
              )}
            </button>

            {tasks.length === 0 && (
              <button onClick={handleSkipToExecution} className="ui-button-ghost">
                Start with empty workspace →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DossierSetupShell;
