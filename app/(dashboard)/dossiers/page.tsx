export const dynamic = 'force-dynamic';

import { Fragment } from 'react';
import { DossierList } from '@/components/dossiers/DossierList';
import { requireCurrentUser } from '@/src/lib/auth/auth';
import { getAllDossiers } from '@/src/lib/dossiers/store';

export default async function DossiersPage() {
  const user = await requireCurrentUser('/dossiers');
  const dossiers = await getAllDossiers(user.id);
  return (
    <Fragment>
      <h1 className="sr-only">My Dossiers</h1>
      <DossierList dossiers={dossiers} />
    </Fragment>
  );
}
