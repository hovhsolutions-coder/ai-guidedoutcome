import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db/prisma';
import { filterVisibleDossiers } from '@/src/lib/db/dossier-store';
import { type GeneratedDossier } from '@/src/types/ai';
import { checkRateLimit } from '../../../src/lib/rate-limit';

// Maximum payload size for dossier creation (100KB)
const MAX_PAYLOAD_SIZE = 100 * 1024;

// Input validation limits
const MAX_STRING_LENGTH = 5000;
const MAX_TASKS = 100;
const MAX_TASK_LENGTH = 500;

function checkPayloadSize(request: NextRequest): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    return { valid: false, error: 'Payload too large. Maximum size is 100KB.' };
  }
  return { valid: true };
}

function sanitizeString(input: unknown, defaultValue: string): string {
  if (typeof input !== 'string') return defaultValue;
  const trimmed = input.trim();
  if (trimmed.length === 0) return defaultValue;
  if (trimmed.length > MAX_STRING_LENGTH) return trimmed.slice(0, MAX_STRING_LENGTH);
  return trimmed;
}

function sanitizeTasks(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t) => (t.length > MAX_TASK_LENGTH ? t.slice(0, MAX_TASK_LENGTH) : t))
    .slice(0, MAX_TASKS);
}

function sanitizeGeneratedDossier(input: unknown): GeneratedDossier | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null;
  }

  const d = input as Partial<GeneratedDossier>;

  // Required fields must be present and non-empty after sanitization
  const title = sanitizeString(d.title, '');
  const situation = sanitizeString(d.situation, '');
  const main_goal = sanitizeString(d.main_goal, '');

  if (!title || !situation || !main_goal) {
    return null;
  }

  return {
    title,
    situation,
    main_goal,
    phase: sanitizeString(d.phase, 'Understanding'),
    suggested_tasks: sanitizeTasks(d.suggested_tasks),
    narrative: d.narrative ?? undefined,
    systemPlan: d.systemPlan ?? undefined,
    executionPlan: d.executionPlan ?? undefined,
    characterProfile: d.characterProfile ?? undefined,
    progressionState: d.progressionState ?? undefined,
  };
}

// GET /api/dossiers - List all dossiers
export async function GET() {
  try {
    const dossiers = await prisma.dossier.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        tasks: {
          select: { id: true }
        }
      }
    });

    const visible = filterVisibleDossiers(dossiers);

    return NextResponse.json({
      success: true,
      data: visible.map(d => ({
        id: d.id,
        title: d.title,
        situation: d.situation,
        main_goal: d.mainGoal,
        phase: d.phase,
        progress: d.progress,
        taskCount: d.tasks.length,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }))
    });
  } catch (error) {
    console.error('List dossiers API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/dossiers - Create new dossier
export async function POST(request: NextRequest) {
  try {
    // Payload size check
    const sizeCheck = checkPayloadSize(request);
    if (!sizeCheck.valid) {
      console.log('[api:dossiers:create:payload_too_large] rejected');
      return NextResponse.json(
        { success: false, error: sizeCheck.error },
        { status: 413 }
      );
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(request, { windowMs: 60 * 1000, maxRequests: 20 });
    if (!rateLimitResult.allowed) {
      console.log(`[api:dossiers:create:rate_limit] blocked, retry after ${rateLimitResult.retryAfter}s`);
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetTime / 1000)),
          },
        }
      );
    }

    const rawBody = await request.json();
    const dossier = sanitizeGeneratedDossier(rawBody);

    if (!dossier) {
      console.log('[api:dossiers:create:reject] invalid_payload');
      return NextResponse.json(
        { success: false, error: 'Invalid dossier payload' },
        { status: 400 }
      );
    }

    // Create dossier in database
    const storedDossier = await prisma.dossier.create({
      data: {
        title: dossier.title,
        situation: dossier.situation,
        mainGoal: dossier.main_goal,
        phase: dossier.phase,
        lastActivity: 'Dossier created',
        narrative: dossier.narrative ? JSON.stringify(dossier.narrative) : null,
        systemPlan: dossier.systemPlan ? JSON.stringify(dossier.systemPlan) : null,
        executionPlan: dossier.executionPlan ? JSON.stringify(dossier.executionPlan) : null,
        characterProfile: dossier.characterProfile ? JSON.stringify(dossier.characterProfile) : null,
        progressionState: dossier.progressionState ? JSON.stringify(dossier.progressionState) : null,
      }
    });

    // Create suggested tasks if provided
    if (dossier.suggested_tasks && dossier.suggested_tasks.length > 0) {
      await prisma.task.createMany({
        data: dossier.suggested_tasks.map((name, index) => ({
          name,
          dossierId: storedDossier.id,
          priority: index < 3 ? 'high' : index < 6 ? 'medium' : 'low',
        }))
      });
    }

    // Create initial activity entry
    await prisma.activityEntry.create({
      data: {
        type: 'dossier_created',
        description: `Created dossier "${dossier.title}"`,
        dossierId: storedDossier.id,
      }
    });

    return NextResponse.json({
      success: true,
      data: storedDossier,
    });
  } catch (error) {
    console.error('Persist dossier API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
