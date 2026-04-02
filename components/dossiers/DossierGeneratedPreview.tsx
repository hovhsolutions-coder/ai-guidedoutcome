import { GeneratedDossier } from '@/src/types/ai';
import { cn } from '../../lib/utils';

interface DossierGeneratedPreviewProps {
  dossier: GeneratedDossier;
  onOpenDossier: () => void | Promise<void>;
  statusNote?: {
    tone: 'success' | 'warning';
    title: string;
    description: string;
  } | null;
  isOpening?: boolean;
}

export function DossierGeneratedPreview({
  dossier,
  onOpenDossier,
  statusNote = null,
  isOpening = false,
}: DossierGeneratedPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="ui-surface-primary space-y-6 p-8">
        <div className="text-center">
          <div className="mb-4 inline-flex">
            <span className="ui-chip ui-chip-accent">Dossier Ready</span>
          </div>
          <h2 className="mb-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Your dossier is ready to review
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            The system has organized your situation into a clear starting structure so you can review it before opening the dossier workspace.
          </p>
        </div>

        {statusNote && (
          <div
            className={cn(
              'rounded-[16px] border px-5 py-4 text-left',
              statusNote.tone === 'success'
                ? 'border-[rgba(114,213,154,0.2)] bg-[var(--success-soft)]'
                : 'border-[rgba(242,202,115,0.2)] bg-[var(--warning-soft)]'
            )}
          >
            <p
              className={cn(
                'text-[11px] font-semibold uppercase tracking-[0.16em]',
                statusNote.tone === 'success' ? 'text-[var(--success-strong)]' : 'text-[var(--warning-strong)]'
              )}
            >
              {statusNote.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{statusNote.description}</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="ui-surface-secondary p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Title</p>
            <p className="mt-2 text-base font-medium text-[var(--text-primary)]">{dossier.title}</p>
          </div>

          <div className="ui-surface-secondary p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Starting Phase</p>
            <div className="mt-2">
              <span className="ui-chip ui-chip-understanding">{dossier.phase}</span>
            </div>
          </div>
        </div>

        <div className="ui-surface-secondary space-y-3 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Situation</p>
          <p className="text-sm leading-6 text-[var(--text-primary)]">{dossier.situation}</p>
        </div>

        <div className="ui-surface-accent space-y-3 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">Main Goal</p>
          <p className="text-sm leading-6 text-[var(--text-primary)]">{dossier.main_goal}</p>
        </div>

        <div className="ui-surface-secondary space-y-4 p-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Suggested Tasks</p>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              These are the first concrete actions the system recommends for getting momentum.
            </p>
          </div>

          {dossier.suggested_tasks.length > 0 ? (
            <ul className="space-y-2">
              {dossier.suggested_tasks.map((task, index) => (
                <li key={index} className="ui-surface-primary flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary-soft)] text-xs font-semibold text-[var(--accent-primary-strong)]">
                    {index + 1}
                  </span>
                  <span className="text-sm text-[var(--text-primary)]">{task}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="ui-surface-primary px-4 py-5">
              <p className="text-sm text-[var(--text-secondary)]">No suggested tasks yet.</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Open the dossier to refine the first action plan.</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button onClick={() => void onOpenDossier()} disabled={isOpening} className="ui-button-primary w-full">
            {isOpening ? 'Opening dossier...' : 'Open Dossier'}
          </button>
          <p className="text-center text-xs text-[var(--text-muted)]">
            You can review, refine, and add tasks after opening the dossier.
          </p>
        </div>
      </div>
    </div>
  );
}
