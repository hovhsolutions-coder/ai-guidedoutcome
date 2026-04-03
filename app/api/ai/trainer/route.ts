import { NextRequest, NextResponse } from 'next/server';
import { runTrainerPerspective } from '@/src/lib/ai/trainer';
import { AIExecutionMode, AITrainerId, AITrainerRequestInput } from '@/src/lib/ai/types';
import { checkRateLimit } from '../../../../src/lib/rate-limit';

// Maximum payload size for trainer requests (50KB)
const MAX_PAYLOAD_SIZE = 50 * 1024;

// Route-level safety timeout (30s - allows for AI timeout + processing overhead)
const ROUTE_TIMEOUT_MS = 30000;

function checkPayloadSize(request: NextRequest): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    return { valid: false, error: 'Payload too large. Maximum size is 50KB.' };
  }
  return { valid: true };
}

function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
}

// Generate or extract correlation ID for request tracing
function getCorrelationId(request: NextRequest): string {
  const existingId = request.headers.get('x-correlation-id');
  if (existingId && existingId.trim().length > 0) {
    return existingId.trim().slice(0, 64);
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request);

  try {
    // Payload size check
    const sizeCheck = checkPayloadSize(request);
    if (!sizeCheck.valid) {
      console.log(`[api:trainer:payload_too_large] cid:${correlationId}`);
      return NextResponse.json(
        { success: false, error: sizeCheck.error },
        {
          status: 413,
          headers: { 'X-Correlation-Id': correlationId },
        }
      );
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(request, { windowMs: 60 * 1000, maxRequests: 10 });
    if (!rateLimitResult.allowed) {
      console.log(`[api:trainer:rate_limit] cid:${correlationId} retry:${rateLimitResult.retryAfter}s`);
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetTime / 1000)),
            'X-Correlation-Id': correlationId,
          },
        }
      );
    }

    const requestedMode = request.headers.get('x-guidance-mode');
    const mode: AIExecutionMode = requestedMode === 'local' ? 'local' : 'live';

    if (mode === 'local' && process.env.NODE_ENV === 'production') {
      console.log(`[api:trainer:reject] cid:${correlationId} local_mode_denied`);
      return NextResponse.json(
        { success: false, error: 'Local trainer mode is not available in production.' },
        {
          status: 403,
          headers: { 'X-Correlation-Id': correlationId },
        }
      );
    }

    const body = await request.json() as AITrainerRequestInput;

    if (!isValidTrainer(body.trainer)) {
      console.log(`[api:trainer:reject] cid:${correlationId} invalid_trainer:${body.trainer}`);
      return NextResponse.json(
        { success: false, error: 'Unknown trainer requested.' },
        {
          status: 400,
          headers: { 'X-Correlation-Id': correlationId },
        }
      );
    }

    const result = await Promise.race([
      runTrainerPerspective(body, { mode }),
      createTimeoutPromise(ROUTE_TIMEOUT_MS),
    ]);

    if (result.rateLimited) {
      console.log(`[api:trainer:rate_limit] cid:${correlationId} upstream`);
      return NextResponse.json(
        { success: false, error: result.error || 'Rate limit exceeded' },
        {
          status: 429,
          headers: { 'X-Correlation-Id': correlationId },
        }
      );
    }

    if (!result.success || !result.data) {
      console.log(`[api:trainer:error] cid:${correlationId} ${result.error || 'unknown'}`);
      return NextResponse.json(
        { success: false, error: result.error || 'Unknown trainer error occurred' },
        {
          status: 500,
          headers: { 'X-Correlation-Id': correlationId },
        }
      );
    }

    console.log(`[api:trainer:success] cid:${correlationId} trainer:${body.trainer} mode:${mode}`);

    return NextResponse.json({
      success: true,
      data: result.data,
    }, {
      headers: { 'X-Correlation-Id': correlationId },
    });
  } catch (error) {
    console.error(`[api:trainer:error] cid:${correlationId}`, error);
    const message = error instanceof Error && error.message.trim().length > 0
      ? error.message
      : 'Internal server error';

    return NextResponse.json(
      { success: false, error: message },
      {
        status: 500,
        headers: { 'X-Correlation-Id': correlationId },
      }
    );
  }
}

function isValidTrainer(value: unknown): value is AITrainerId {
  return value === 'strategy' || value === 'execution' || value === 'risk' || value === 'communication';
}
