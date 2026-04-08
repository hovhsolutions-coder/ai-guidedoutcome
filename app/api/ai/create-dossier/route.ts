import { NextRequest, NextResponse } from 'next/server';
import { runAIOrchestrator } from '@/src/lib/ai/orchestrator';
import { createStoredDossier } from '@/src/lib/dossiers/store';
import { buildGeneratedDossier } from '@/src/lib/dossiers/build-generated-dossier';
import { getDossierHref } from '@/src/lib/dossiers/routes';
import { getCurrentUserFromRequest } from '@/src/lib/auth/auth';
import { AIRequestInput } from '@/src/lib/ai/types';
import { CreateDossierResponse, IntakeData } from '@/src/types/ai';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sign in to create a dossier.' },
        { status: 401 }
      );
    }

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

    const intakeAnswers = buildIntakeAnswers(intake);

    const input: AIRequestInput = {
      action: 'create_dossier',
      situation: intake.situation,
      main_goal: intake.shortTermOutcome || intake.goal,
      phase: 'Understanding',
      tasks: [],
      user_input: buildCreateDossierIntakeNarrative(intake),
      intakeAnswers,
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
      titleSource: intake.firstPriority || intake.situation || intake.goal,
      situation: result.data.summary,
      mainGoal: intake.shortTermOutcome || intake.goal,
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
      const storedDossier = await createStoredDossier(draft, { ownerUserId: user.id });

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
            href: getDossierHref(storedDossier.id),
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

  // Additional enriched intake fields are optional for backward compatibility.

  return {
    valid: errors.length === 0,
    errors
  };
}

function buildCreateDossierIntakeNarrative(intake: IntakeData): string {
  const lines = [
    `Urgency: ${intake.urgency || 'Not provided'}`,
    `Timeline: ${intake.timeline || 'Not provided'}`,
    `Attention now: ${intake.attentionNow || 'Not provided'}`,
    `Pain points: ${intake.painPoints || 'Not provided'}`,
    `Biggest friction: ${intake.biggestFriction || 'Not provided'}`,
    `Cost signals: ${intake.costSignals?.join(', ') || 'Not provided'}`,
    `Impact if unresolved: ${intake.impactIfUnresolved || 'Not provided'}`,
    `Impact areas: ${intake.impactAreas?.join(', ') || 'Not provided'}`,
    `Short-term outcome: ${intake.shortTermOutcome || intake.goal || 'Not provided'}`,
    `Long-term outcome: ${intake.longTermOutcome || 'Not provided'}`,
    `Tried already: ${intake.triedAlready || 'Not provided'}`,
    `Support already used: ${intake.supportAlreadyUsed || 'Not provided'}`,
    `Involved: ${intake.involved || 'Not provided'}`,
    `Blocking: ${intake.blocking || 'Not provided'}`,
    `Constraints: ${intake.constraints || 'Not provided'}`,
    `Resources: ${intake.resources || 'Not provided'}`,
    `Emotional state: ${intake.emotionalState || 'Not provided'}`,
    `Support style: ${intake.supportStyle || 'Not provided'}`,
    `Coach style: ${intake.coachStyle || 'Not provided'}`,
    `First priority: ${intake.firstPriority || 'Not provided'}`,
    `Non-negotiable: ${intake.nonNegotiable || 'Not provided'}`,
  ];

  return lines.join('\n');
}

function buildIntakeAnswers(intake: IntakeData): Record<string, unknown> {
  return {
    category: intake.category ?? '',
    situation: intake.situation,
    goal: intake.goal,
    main_goal: intake.shortTermOutcome || intake.goal,
    urgency: intake.urgency ?? '',
    timeline: intake.timeline ?? '',
    attention_now: intake.attentionNow ?? '',
    pain_points: intake.painPoints ?? '',
    biggest_friction: intake.biggestFriction ?? '',
    cost_signals: intake.costSignals ?? [],
    impact_areas: intake.impactAreas ?? [],
    impact_if_unresolved: intake.impactIfUnresolved ?? '',
    short_term_outcome: intake.shortTermOutcome ?? '',
    long_term_outcome: intake.longTermOutcome ?? '',
    tried_already: intake.triedAlready ?? '',
    support_already_used: intake.supportAlreadyUsed ?? '',
    involved: intake.involved ?? '',
    blocker: intake.blocking ?? '',
    constraints: intake.constraints ?? '',
    resources: intake.resources ?? '',
    emotional_state: intake.emotionalState ?? '',
    support_style: intake.supportStyle ?? '',
    coach_style: intake.coachStyle ?? '',
    first_priority: intake.firstPriority ?? '',
    non_negotiable: intake.nonNegotiable ?? '',
    coach_name: intake.coachName ?? '',
  };
}
