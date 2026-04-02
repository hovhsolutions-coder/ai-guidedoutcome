import { NextRequest, NextResponse } from 'next/server';
import { runAIOrchestrator } from '@/src/lib/ai/orchestrator';
import { AIRequestInput } from '@/src/lib/ai/types';
import { DossierContext } from '@/src/types/ai';
import { detectDomain } from '@/src/lib/ai/domain/detect-domain';
import { resolveGuidanceModeId } from '@/src/lib/ai/modes/resolve-mode';
import { createGuidanceSession } from '@/src/lib/guidance-session/create-session';
import { buildFirstPassGuidanceSession, toGuidanceContinuation } from '@/src/lib/guidance-session/build-first-pass-guidance-session';
import { buildStructuredContracts } from '@/src/lib/guidance-session/build-structured-contracts';

export async function POST(request: NextRequest) {
  try {
    const requestedMode = request.headers.get('x-guidance-mode');
    const guidanceMode = requestedMode === 'local' ? 'local' : 'live';
    if (guidanceMode === 'local' && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Local guidance mode is not available in production.' },
        { status: 403 }
      );
    }

    const context: DossierContext & { triggerType?: AIRequestInput['triggerType']; raw_input?: string; intakeAnswers?: Record<string, unknown>; activeMode?: AIRequestInput['activeMode'] } = await request.json();

    // Derive the best text to run domain detection on. Use the richest available
    // context (user_input / raw_input / situation) and include main_goal so the
    // domain detector sees the user's stated purpose.
    const detectionParts = [
      context.user_input,
      (context as any).raw_input,
      context.situation,
      context.main_goal,
    ].filter((p) => typeof p === 'string' && p.trim().length > 0);
    const detectionSource = detectionParts.join(' ').trim();
    const detected = detectDomain(detectionSource);

    // Preserve explicit client override for activeMode; otherwise resolve server-side from detected domain
    const activeMode = context.activeMode ?? resolveGuidanceModeId(detected);

    const input: AIRequestInput = {
      action: 'guidance',
      situation: context.situation,
      main_goal: context.main_goal,
      phase: context.phase,
      tasks: context.tasks,
      user_input: context.user_input ?? (context as any).raw_input,
      triggerType: context.triggerType,
      // authoritative metadata included for the orchestrator/prompt
      detectedDomain: detected.primaryDomain,
      activeMode,
      intakeAnswers: context.intakeAnswers ?? {},
      shouldOfferDossier: detected.shouldOfferDossier,
    };

    const result = await runAIOrchestrator(input, { mode: guidanceMode });

    if (result.rateLimited) {
      return NextResponse.json(
        { success: false, error: result.error || 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Unknown error occurred' },
        { status: 500 }
      );
    }

    // Build a full first-pass session and authoritative continuation so the
    // client can hydrate from a server-first authoritative decision envelope.
    const sessionBase = createGuidanceSession({
      initialInput: input.user_input ?? '',
      intakeAnswers: input.intakeAnswers ?? {},
      detectedDomain: detected.primaryDomain,
      domainConfidence: detected.confidence,
      activeMode,
      shouldOfferDossier: detected.shouldOfferDossier,
    });

    const structuredContracts = buildStructuredContracts({
      situation: input.situation,
      main_goal: input.main_goal,
      user_input: input.user_input,
      intakeAnswers: input.intakeAnswers,
      detectedDomain: detected.primaryDomain,
      activeMode,
      summary: result.data.summary,
      nextStep: result.data.next_step,
      suggestedTasks: result.data.suggested_tasks,
    });

    const firstPassWithContracts = buildFirstPassGuidanceSession(sessionBase, {
      summary: result.data.summary,
      nextStep: result.data.next_step,
      suggestedTasks: result.data.suggested_tasks,
      narrative: structuredContracts.narrative,
      systemPlan: structuredContracts.systemPlan,
      executionPlan: structuredContracts.executionPlan,
    });

    const continuationWithContracts = toGuidanceContinuation(firstPassWithContracts);

    return NextResponse.json({
      success: true,
      data: {
        summary: result.data.summary,
        next_step: result.data.next_step,
        suggested_tasks: result.data.suggested_tasks,
        narrative: structuredContracts.narrative,
        systemPlan: structuredContracts.systemPlan,
        executionPlan: structuredContracts.executionPlan,
        continuation: continuationWithContracts,
      }
    });
  } catch (error) {
    console.error('AI guidance API error:', error);
    const message = error instanceof Error && error.message.trim().length > 0
      ? error.message
      : 'Internal server error';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
