/**
 * DOSSIER STORE - LEGACY FILE-BASED STORAGE (DEPRECATED)
 * 
 * This file is kept for backward compatibility. It re-exports from the new
 * Prisma-based storage layer at @/src/lib/db/dossier-store
 * 
 * The new storage layer uses SQLite via Prisma and provides:
 * - Better data integrity
 * - ACID transactions
 * - Proper relationships
 * - Query optimization
 * 
 * Migration path:
 *   npm run db:import  - Import legacy JSON data into SQLite
 * 
 * The exports below maintain the same interface as the original file-based store,
 * ensuring existing code continues to work without modification.
 */

// Re-export everything from the new Prisma-based store
export {
  getAllDossiers,
  getStoredDossierById,
  createStoredDossier,
  updateStoredDossier,
  deleteStoredDossier,
  importDossierFromLegacy,
} from '@/src/lib/db/dossier-store';

// Re-export types
export type { MockDossier } from '@/lib/mockData';
