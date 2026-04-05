import { NextRequest, NextResponse } from 'next/server';
import {
  applySessionCookie,
  authenticateUser,
  createSessionForUser,
  getSafeNextPath,
} from '@/src/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          email?: string;
          password?: string;
          nextPath?: string;
        }
      | null;

    const user = await authenticateUser(body?.email ?? '', body?.password ?? '');

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email or password is incorrect.',
        },
        { status: 401 }
      );
    }

    const session = await createSessionForUser(user.id);
    const response = NextResponse.json({
      success: true,
      data: {
        nextPath: getSafeNextPath(body?.nextPath),
      },
    });

    return applySessionCookie(response, session);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to sign in right now.',
      },
      { status: 500 }
    );
  }
}
