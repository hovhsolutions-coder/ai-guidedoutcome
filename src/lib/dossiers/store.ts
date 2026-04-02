/**
 * DOSSIER STORE - Re-export from Prisma-based storage
 * 
 * This file re-exports from the new Prisma-based storage layer
 * at @/src/lib/db/dossier-store for backward compatibility.
 * 
 * The new storage uses SQLite via Prisma and provides better data integrity,
 * ACID transactions, proper relationships, and query optimization.
 * 
 * To migrate legacy JSON data:
 *   npm run db:import
 */

export {
  getAllDossiers,
  getStoredDossierById,
  createStoredDossier,
  updateStoredDossier,
  deleteStoredDossier,
  importDossierFromLegacy,
  getCompletedDossiers,
} from '@/src/lib/db/dossier-store';

export type { MockDossier } from '@/lib/mockData';
