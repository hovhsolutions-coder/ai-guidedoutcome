import { NextRequest, NextResponse } from 'next/server';
import { runAIOrchestrator } from '@/src/lib/ai/orchestrator';
import { createStoredDossier } from '@/src/lib/dossiers/store';
import { AIRequestInput } from '@/src/lib/ai/types';
import { IntakeData } from '@/src/types/ai';

export async function POST(request: NextRequest) {
  try {
    console.info('[api:ai:create-dossier:start]', {
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

    const result = await runAIOrchestrator(input);

    if (result.rateLimited) {
      return NextResponse.json(
        { success: false, error: result.error || 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate dossier' },
        { status: 500 }
      );
    }

    const storedDossier = await createStoredDossier({
      title: buildDossierTitle(intake),
      situation: result.data.summary,
      main_goal: intake.goal,
      phase: 'Understanding',
      suggested_tasks: result.data.suggested_tasks,
    });

    return NextResponse.json({
      success: true,
      id: storedDossier.id,
      title: storedDossier.title,
      situation: storedDossier.situation,
      main_goal: storedDossier.main_goal,
      phase: storedDossier.phase,
      suggested_tasks: storedDossier.tasks,
    });
  } catch (error) {
    console.error('[api:ai:create-dossier:error]', {
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

function buildDossierTitle(intake: IntakeData): string {
  const titleSource = intake.situation || intake.goal || 'New Dossier';
  return titleSource.length > 40 ? `${titleSource.slice(0, 37)}...` : titleSource;
}
