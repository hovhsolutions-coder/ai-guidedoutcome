import { convertGuidanceSessionToDossier } from '@/src/lib/guidance-session/convert-to-dossier';
import { type GuidanceSession } from '@/src/lib/guidance-session/types';

export async function submitGuidanceSessionDossierConversion(session: GuidanceSession): Promise<{ id: string }> {
  const dossierPayload = convertGuidanceSessionToDossier(session);
  const response = await fetch('/api/dossiers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dossierPayload),
  });

  if (!response.ok) {
    throw new Error(await getGuidanceDossierResponseErrorMessage(response));
  }

  const data = (await response.json()) as {
    success: boolean;
    error?: string;
    data?: { id?: string };
  };

  if (!data.success || !data.data?.id) {
    throw new Error(data.error || 'The dossier could not be created.');
  }

  return { id: data.data.id };
}

async function getGuidanceDossierResponseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === 'string' && body.error.trim().length > 0) {
      return body.error;
    }
  } catch {
    // Fall back to the default message.
  }

  return 'The dossier could not be created right now.';
}
