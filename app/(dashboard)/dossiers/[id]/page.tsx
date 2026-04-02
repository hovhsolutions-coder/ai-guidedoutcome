import Link from 'next/link';
import { DossierDetailClient } from '@/components/dossiers/DossierDetailClient';
import { getStoredDossierById } from '@/src/lib/dossiers/store';

export default async function DossierDetailPage(props: PageProps<'/dossiers/[id]'>) {
  const { id } = await props.params;
  const dossier = await getStoredDossierById(id);

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
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Dossier Not Found</h1>
          <p className="mt-2 text-[var(--text-secondary)]">The dossier you're looking for doesn't exist.</p>
          <Link href="/dossiers" className="ui-button-secondary mt-4 inline-flex">
            Return to Dossiers
          </Link>
        </div>
      </div>
    );
  }

  return <DossierDetailClient dossier={dossier} />;
}
