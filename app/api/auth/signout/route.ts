import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, deleteSessionByToken } from '@/src/lib/auth/auth';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('ago_session')?.value;
  await deleteSessionByToken(token);

  const response = NextResponse.json({
    success: true,
  });

  return clearSessionCookie(response);
}
