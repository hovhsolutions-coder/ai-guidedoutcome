export const dynamic = 'force-dynamic';

import { DossierList } from '@/components/dossiers/DossierList';
import { getAllDossiers } from '@/src/lib/dossiers/store';

export default async function DossiersPage() {
  const dossiers = await getAllDossiers();
  return <DossierList dossiers={dossiers} />;
}
