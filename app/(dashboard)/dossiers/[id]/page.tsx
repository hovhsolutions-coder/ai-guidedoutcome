import Link from 'next/link';
import { DossierDetailClient } from '@/components/dossiers/DossierDetailClient';
import { requireCurrentUser } from '@/src/lib/auth/auth';
import { getStoredDossierById } from '@/src/lib/dossiers/store';

export default async function DossierDetailPage(props: PageProps<'/dossiers/[id]'>) {
  const { id } = await props.params;
  const user = await requireCurrentUser(`/dossiers/${id}`);
  const dossier = await getStoredDossierById(id, user.id);

  if (!dossier) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/dossiers"
            className="ui-button-ghost mb-4 inline-flex min-h-0 items-center gap-2 px-0 py-0 text-[var(--accent-primary-strong)] hover:bg-transparent"
          >
            Back to Dossiers
          </Link>
        </div>
        <div className="ui-surface-primary py-12 text-center">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Dossier not found</h1>
          <p className="mt-2 text-[var(--text-secondary)]">This dossier is unavailable for your account.</p>
          <Link href="/dossiers" className="ui-button-secondary mt-4 inline-flex">
            Return to My Dossiers
          </Link>
        </div>
      </div>
    );
  }

  return <DossierDetailClient dossier={dossier} />;
}
