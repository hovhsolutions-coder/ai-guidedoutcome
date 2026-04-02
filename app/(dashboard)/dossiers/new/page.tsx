'use client';

import { useState } from 'react';
import { DossierIntakeForm } from '@/components/dossiers/DossierIntakeForm';
import { DossierGeneratedPreview } from '@/components/dossiers/DossierGeneratedPreview';
import { useRouter } from 'next/navigation';
import { IntakeData, GeneratedDossier } from '@/src/types/ai';

export default function NewDossierPage() {
  const [step, setStep] = useState<'intake' | 'preview'>('intake');
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [generatedDossier, setGeneratedDossier] = useState<GeneratedDossier | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpeningDossier, setIsOpeningDossier] = useState(false);
  const [statusNote, setStatusNote] = useState<{
    tone: 'success' | 'warning';
    title: string;
    description: string;
  } | null>(null);
  const router = useRouter();

  const handleIntakeSubmit = async (data: IntakeData) => {
    setIntakeData(data);
    setIsGenerating(true);
    setStatusNote(null);

    // Call AI to generate dossier
    try {
      const response = await fetch('/api/ai/create-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Unable to generate dossier right now.');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Unable to generate dossier right now.');
      }

      setGeneratedDossier(result);
      setStatusNote({
        tone: 'success',
        title: 'Structured successfully',
        description: 'The dossier was generated from the current AI workflow and is ready for review.',
      });
      setStep('preview');
    } catch (error) {
      console.error('Failed to generate dossier:', error);
      // Fallback mock
      const mockDossier: GeneratedDossier = {
        title: `${data.situation} - ${data.goal}`,
        situation: data.situation,
        main_goal: data.goal,
        phase: 'Understanding',
        suggested_tasks: [
          'Research options',
          'Gather information',
          'Consult experts',
          'Create action plan',
        ],
      };
      setGeneratedDossier(mockDossier);
      setStatusNote({
        tone: 'warning',
        title: 'Fallback preview',
        description: 'The live generation step was unavailable, so a safe draft preview was created so you can still continue.',
      });
      setStep('preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenDossier = async () => {
    if (!generatedDossier) {
      return;
    }

    if (generatedDossier.id) {
      router.push(`/dossiers/${generatedDossier.id}`);
      return;
    }

    setIsOpeningDossier(true);
    try {
      const response = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedDossier),
      });

      if (!response.ok) {
        throw new Error('Unable to open dossier right now.');
      }

      const result = await response.json();
      if (!result.success || !result.data?.id) {
        throw new Error(result.error || 'Unable to open dossier right now.');
      }

      setGeneratedDossier((prev) => (prev ? { ...prev, id: result.data.id } : prev));
      router.push(`/dossiers/${result.data.id}`);
    } catch (error) {
      console.error('Failed to persist preview dossier:', error);
      setStatusNote({
        tone: 'warning',
        title: 'Unable to open dossier',
        description: 'The preview is ready, but saving the dossier failed. Please try again in a moment.',
      });
    } finally {
      setIsOpeningDossier(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-4 text-center">
        <div className="inline-flex">
          <span className="ui-chip ui-chip-accent">
            {step === 'intake' ? 'Step 1 · Intake' : 'Step 2 · Review'}
          </span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-[-0.045em] text-[var(--text-primary)]">Create New Dossier</h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Turn a messy situation into a structured starting point with clear context, a primary goal, and actionable next steps.
          </p>
        </div>
      </div>

      {step === 'intake' && !isGenerating && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <DossierIntakeForm onSubmit={handleIntakeSubmit} isSubmitting={isGenerating} />

          <div className="ui-surface-primary space-y-5 p-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Outcome
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                A calmer starting point
              </h2>
            </div>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              The preview helps you validate the structure before you enter the dossier workspace. It is designed to make the next move clearer, not overwhelm you with options.
            </p>
            <div className="space-y-3">
              <div className="ui-surface-secondary px-4 py-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">Clear summary</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">A concise read on the situation and where to focus first.</p>
              </div>
              <div className="ui-surface-secondary px-4 py-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">Focused goal</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">A stable anchor for planning, sequencing, and task selection.</p>
              </div>
              <div className="ui-surface-secondary px-4 py-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">Practical first tasks</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Early actions that reduce ambiguity and create forward momentum.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="ui-surface-primary space-y-6 p-10 text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-primary-strong)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Generating
            </span>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              Building your dossier preview
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              We are organizing the situation, framing the initial goal, and shaping the first recommended actions.
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-3">
            <div className="ui-surface-secondary h-24 animate-pulse" />
            <div className="ui-surface-secondary h-24 animate-pulse" />
            <div className="ui-surface-secondary h-24 animate-pulse" />
          </div>
        </div>
      )}

      {step === 'preview' && generatedDossier && (
        <DossierGeneratedPreview
          dossier={generatedDossier}
          onOpenDossier={handleOpenDossier}
          statusNote={statusNote}
          isOpening={isOpeningDossier}
        />
      )}
    </div>
  );
}
