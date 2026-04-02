import { type MockDossier } from '@/lib/mockData';

/**
 * Check if dossier is meaningfully initialized and ready for execution.
 * Can be used on both server and client.
 */
export function isDossierReady(dossier: MockDossier): boolean {
  const hasTasks = !!(dossier.tasks && dossier.tasks.length > 0);
  const hasChatHistory = !!(dossier.chatHistory && dossier.chatHistory.length > 0);
  const hasStructuredContracts = !!(dossier.narrative || dossier.systemPlan || dossier.executionPlan);
  const hasActivity = !!(dossier.activityHistory && dossier.activityHistory.length > 0);
  const isNewlyCreated = dossier.progress === 0 && !hasTasks && !hasActivity && dossier.lastActivity === 'Dossier created';

  // Dossier is ready if it has tasks OR meaningful guidance history OR structured contracts
  // Dossier is NOT ready if it's newly created with no setup
  return !isNewlyCreated && (hasTasks || hasChatHistory || hasStructuredContracts || hasActivity);
}
