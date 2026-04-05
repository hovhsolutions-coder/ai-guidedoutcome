import { requireCurrentUser } from '@/src/lib/auth/auth';
import { NewDossierWorkspace } from '@/components/dossiers/NewDossierWorkspace';

export default async function NewDossierPage() {
  await requireCurrentUser('/dossiers/new');
  return <NewDossierWorkspace />;
}
