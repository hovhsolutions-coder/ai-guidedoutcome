import { NextResponse } from 'next/server';
import { getCostSummary } from '@/src/lib/ai/cost';
import { getMetrics } from '@/src/lib/ai/metrics';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      metrics: getMetrics(),
      cost: getCostSummary(),
    },
  });
}
