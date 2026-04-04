'use client';

import { useState } from 'react';
import { DossierIntakeForm } from '@/components/dossiers/DossierIntakeForm';
import { DossierGeneratedPreview } from '@/components/dossiers/DossierGeneratedPreview';
import { useRouter } from 'next/navigation';
import { buildGeneratedDossier } from '@/src/lib/dossiers/build-generated-dossier';
import { getDossierHref } from '@/src/lib/dossiers/routes';
import {
  CreateDossierResponse,
  GeneratedDossier,
  IntakeData,
  IntakeFormValues,
  PersistedDossierIdentity,
  SaveDossierResponse,
} from '@/src/types/ai';

type PreviewState = 'saved' | 'unsaved' | 'save_failed';

export default function NewDossierPage() {
  const [step, setStep] = useState<'intake' | 'preview'>('intake');
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [intakeFormValues, setIntakeFormValues] = useState<IntakeFormValues | null>(null);
  const [generatedDossier, setGeneratedDossier] = useState<GeneratedDossier | null>(null);
  const [persistedDossier, setPersistedDossier] = useState<PersistedDossierIdentity | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpeningDossier, setIsOpeningDossier] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>('unsaved');
  const [statusNote, setStatusNote] = useState<{
    tone: 'success' | 'warning';
    title: string;
    description: string;
  } | null>(null);
  const router = useRouter();

  const hasPersistedDossier = Boolean(persistedDossier?.id ?? generatedDossier?.id);

  const handleIntakeSubmit = async (data: IntakeData, values: IntakeFormValues) => {
    setIntakeData(data);
    setIntakeFormValues(values);
    setIsGenerating(true);
    setStatusNote(null);
    setPersistedDossier(null);

    try {
      const response = await fetch('/api/ai/create-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = (await response.json().catch(() => null)) as CreateDossierResponse | null;

      if (!response.ok || !result?.success || !result.data?.dossier) {
        throw new Error(result?.error || 'Unable to generate dossier right now.');
      }

      const persistedId = result.data.persistence.id ?? result.data.dossier.id;
      const persistedHref = result.data.persistence.href ?? (persistedId ? getDossierHref(persistedId) : undefined);
      setGeneratedDossier({
        ...result.data.dossier,
        ...(persistedId ? { id: persistedId } : {}),
      });
      setPersistedDossier(
        persistedId && persistedHref
          ? {
              id: persistedId,
              href: persistedHref,
            }
          : null
      );

      if (result.data.persistence.status === 'saved' && persistedId) {
        setPreviewState('saved');
        setStatusNote({
          tone: 'success',
          title: 'Draft ready',
          description: result.data.usedFallback
            ? 'A safe fallback shaped this draft, and the dossier is saved and ready to open.'
            : 'The first draft is ready to review and open.',
        });
      } else {
        setPreviewState('save_failed');
        setStatusNote({
          tone: 'warning',
          title: 'Not saved yet',
          description: 'The draft is ready. Save it to continue into the live dossier.',
        });
      }

      setStep('preview');
    } catch (error) {
      console.error('Failed to generate dossier:', error);
      const mockDossier: GeneratedDossier = buildGeneratedDossier({
        titleSource: data.situation || data.goal,
        situation: data.situation,
        mainGoal: data.goal,
        suggestedTasks: [
          'Research options',
          'Gather information',
          'Consult experts',
          'Create action plan',
        ],
      });
      setGeneratedDossier(mockDossier);
      setPersistedDossier(null);
      setPreviewState('unsaved');
      setStatusNote({
        tone: 'warning',
        title: 'Draft only',
        description: 'The draft is ready. Save it when you are ready to continue.',
      });
      setStep('preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!generatedDossier) {
      return;
    }

    if (persistedDossier?.href) {
      router.push(persistedDossier.href);
      return;
    }

    if (generatedDossier.id) {
      const href = getDossierHref(generatedDossier.id);
      setPersistedDossier({ id: generatedDossier.id, href });
      router.push(href);
      return;
    }

    setIsOpeningDossier(true);
    try {
      const response = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedDossier),
      });

      const result = (await response.json().catch(() => null)) as SaveDossierResponse | null;

      const persistedIdentity = result?.data;

      if (!response.ok || !result?.success || !persistedIdentity?.id || !persistedIdentity.href) {
        throw new Error(result?.error || 'Unable to save dossier right now.');
      }

      setGeneratedDossier((prev) => (prev ? { ...prev, id: persistedIdentity.id } : prev));
      setPersistedDossier(persistedIdentity);
      setPreviewState('saved');
      setStatusNote({
        tone: 'success',
        title: 'Saved and ready',
        description: 'The dossier is saved. Opening the workspace now.',
      });
      router.push(persistedIdentity.href);
    } catch (error) {
      console.error('Failed to persist preview dossier:', error);
      setPersistedDossier(null);
      setPreviewState('save_failed');
      setStatusNote({
        tone: 'warning',
        title: 'Save paused',
        description: 'The draft is still here. Try save again or return to edit.',
      });
    } finally {
      setIsOpeningDossier(false);
    }
  };

  const handleBackToEdit = () => {
    setStep('intake');
    setStatusNote(null);
  };

  const primaryActionLabel = previewState === 'saved' && hasPersistedDossier
    ? isOpeningDossier
      ? 'Opening dossier...'
      : 'Open dossier'
    : isOpeningDossier
      ? 'Saving dossier...'
      : previewState === 'save_failed'
        ? 'Retry save'
        : 'Save and open dossier';

  const actionHint = previewState === 'saved' && hasPersistedDossier
    ? 'You can refine everything inside the dossier.'
    : previewState === 'save_failed'
      ? 'Your draft stays here while you recover the save.'
      : 'We will save the draft before opening the live dossier.';

  const secondaryActionLabel = previewState === 'saved' ? null : 'Back to edit';

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
          <DossierIntakeForm
            onSubmit={handleIntakeSubmit}
            isSubmitting={isGenerating}
            initialValues={intakeFormValues}
          />
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
          onPrimaryAction={handlePrimaryAction}
          primaryActionLabel={primaryActionLabel}
          actionHint={actionHint}
          onSecondaryAction={secondaryActionLabel ? handleBackToEdit : null}
          secondaryActionLabel={secondaryActionLabel}
          statusNote={statusNote}
          isOpening={isOpeningDossier}
        />
      )}
    </div>
  );
}
