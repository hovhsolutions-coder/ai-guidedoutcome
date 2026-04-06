import { NextRequest, NextResponse } from 'next/server';
import {
  applySessionCookie,
  createSessionForUser,
  createUserAccount,
  getSafeNextPath,
} from '@/src/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          name?: string;
          email?: string;
          password?: string;
          nextPath?: string;
        }
      | null;

    const user = await createUserAccount({
      name: body?.name ?? '',
      email: body?.email ?? '',
      password: body?.password ?? '',
    });

    const session = await createSessionForUser(user.id);

    const response = NextResponse.json({
      success: true,
      data: {
        nextPath: getSafeNextPath(body?.nextPath),
      },
    });

    return applySessionCookie(response, session);
  } catch (error) {
    console.error('Sign-up error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to create account. Please try again or contact support if the problem continues.',
      },
      { status: 500 }
    );
  }
}
