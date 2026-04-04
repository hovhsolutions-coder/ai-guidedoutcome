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
        title: 'Draft ready',
        description: 'The first draft is ready to review and open.',
      });
      setStep('preview');
    } catch (error) {
      console.error('Failed to generate dossier:', error);
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
        title: 'Fallback draft',
        description: 'The live generation step was unavailable, so a safe draft was created so you can still continue.',
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
        description: 'The draft is ready, but saving the dossier failed. Please try again in a moment.',
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
            {step === 'intake' ? 'Step 1 of 2' : 'Step 2 of 2'}
          </span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-[-0.045em] text-[var(--text-primary)]">Capture the essentials</h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Add just enough context to shape a confident first draft.
          </p>
        </div>
      </div>

      {step === 'intake' && !isGenerating && (
        <div className="mx-auto max-w-2xl">
          <DossierIntakeForm onSubmit={handleIntakeSubmit} isSubmitting={isGenerating} />
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
              Shaping the draft
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              We are shaping the title, goal, and first tasks.
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
