import { NextRequest, NextResponse } from 'next/server';
import { runAIOrchestrator } from '@/src/lib/ai/orchestrator';
import { createStoredDossier } from '@/src/lib/dossiers/store';
import { buildGeneratedDossier } from '@/src/lib/dossiers/build-generated-dossier';
import { AIRequestInput } from '@/src/lib/ai/types';
import { CreateDossierResponse, IntakeData } from '@/src/types/ai';

export async function POST(request: NextRequest) {
  try {
    const correlationId = crypto.randomUUID();

    console.info('[api:ai:create-dossier:start]', {
      correlationId,
      dbProvider: process.env.DATABASE_URL?.split(':')[0],
      prismaSchema: process.env.PRISMA_SCHEMA,
    });

    const intake: IntakeData = await request.json();

    // Validate intake data
    const validation = validateIntakeData(intake);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: `Validation failed: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    const input: AIRequestInput = {
      action: 'create_dossier',
      situation: intake.situation,
      main_goal: intake.goal,
      phase: 'Understanding',
      tasks: [],
      user_input: [
        `Urgency: ${intake.urgency || 'Not provided'}`,
        `Involved: ${intake.involved || 'Not provided'}`,
        `Blocking: ${intake.blocking || 'Not provided'}`,
      ].join('\n'),
    };

    let result = await runAIOrchestrator(input);

    console.info('[api:ai:create-dossier:ai:complete]', {
      correlationId,
      success: result.success,
      rateLimited: result.rateLimited,
      hasData: Boolean(result.data),
      error: result.error,
    });

    if (result.rateLimited) {
      return NextResponse.json(
        { success: false, error: result.error || 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    let usedFallback = false;

    if (!result.success || !result.data) {
      console.warn('[api:ai:create-dossier:ai:fallback]', {
        correlationId,
        error: result.error,
      });

      result = await runAIOrchestrator(input, { mode: 'local' });
      usedFallback = true;

      console.info('[api:ai:create-dossier:ai:fallback-complete]', {
        correlationId,
        success: result.success,
        hasData: Boolean(result.data),
        error: result.error,
      });

      if (!result.success || !result.data) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to generate dossier' },
          { status: 500 }
        );
      }
    }

    const draft = buildGeneratedDossier({
      titleSource: intake.situation || intake.goal,
      situation: result.data.summary,
      mainGoal: intake.goal,
      suggestedTasks: result.data.suggested_tasks,
      phase: 'Understanding',
    });

    let responseBody: CreateDossierResponse = {
      success: true,
      data: {
        dossier: draft,
        persistence: {
          status: 'save_failed',
          error: 'The draft is ready, but saving the dossier failed.',
        },
        usedFallback,
      },
    };

    try {
      const storedDossier = await createStoredDossier(draft);

      console.info('[api:ai:create-dossier:success]', {
        correlationId,
        usedFallback,
        id: storedDossier.id,
      });

      responseBody = {
        success: true,
        data: {
          dossier: { ...draft, id: storedDossier.id },
          persistence: {
            status: 'saved',
            id: storedDossier.id,
          },
          usedFallback,
        },
      };
    } catch (persistError) {
      console.error('[api:ai:create-dossier:persist:error]', {
        correlationId,
        message: (persistError as Error)?.message,
        dbProvider: process.env.DATABASE_URL?.split(':')[0],
        prismaSchema: process.env.PRISMA_SCHEMA,
        stack: (persistError as Error)?.stack,
      });
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('[api:ai:create-dossier:error]', {
      correlationId: (error as any)?.correlationId,
      message: (error as Error)?.message,
      dbProvider: process.env.DATABASE_URL?.split(':')[0],
      prismaSchema: process.env.PRISMA_SCHEMA,
      stack: (error as Error)?.stack,
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate intake data
 */
function validateIntakeData(intake: IntakeData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!intake.situation || typeof intake.situation !== 'string' || intake.situation.trim().length === 0) {
    errors.push('situation must be a non-empty string');
  }

  if (!intake.goal || typeof intake.goal !== 'string' || intake.goal.trim().length === 0) {
    errors.push('goal must be a non-empty string');
  }

  // urgency, involved, blocking are optional

  return {
    valid: errors.length === 0,
    errors
  };
}
