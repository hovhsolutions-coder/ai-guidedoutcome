import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db/prisma';

const SESSION_COOKIE_NAME = 'ago_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const PASSWORD_KEY_LENGTH = 64;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type SessionRecord = {
  token: string;
  expiresAt: Date;
};

type AccountInput = {
  email: string;
  name: string;
  password: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizeAccountName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, 80);
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return 'Email is required.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return 'Enter a valid email address.';
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password.trim()) {
    return 'Password is required.';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  return null;
}

export async function createUserAccount(input: AccountInput): Promise<AuthUser> {
  const email = normalizeEmail(input.email);
  const name = sanitizeAccountName(input.name);
  const emailError = validateEmail(email);
  const passwordError = validatePassword(input.password);

  if (emailError) {
    throw new Error(emailError);
  }

  if (!name) {
    throw new Error('Name is required.');
  }

  if (passwordError) {
    throw new Error(passwordError);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hashPassword(input.password),
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return user;
}

export async function authenticateUser(emailInput: string, password: string): Promise<AuthUser | null> {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function createSessionForUser(userId: string): Promise<SessionRecord> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      expiresAt,
      userId,
    },
  });

  return { token, expiresAt };
}

export function applySessionCookie(response: NextResponse, session: SessionRecord): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: session.token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: session.expiresAt,
  });

  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getUserFromSessionToken(token);
}

export async function requireCurrentUser(nextPath = '/dashboard'): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (user) {
    return user;
  }

  redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
}

export async function getCurrentUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return getUserFromSessionToken(token);
}

export async function deleteSessionByToken(token: string | null | undefined): Promise<void> {
  if (!token) {
    return;
  }

  await prisma.session.deleteMany({
    where: { tokenHash: hashSessionToken(token) },
  });
}

export function getSafeNextPath(input: string | null | undefined, fallback = '/dashboard'): string {
  if (!input || !input.startsWith('/') || input.startsWith('//')) {
    return fallback;
  }

  if (input.startsWith('/sign-in') || input.startsWith('/sign-up')) {
    return fallback;
  }

  return input;
}

async function getUserFromSessionToken(token: string | null | undefined): Promise<AuthUser | null> {
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await deleteSessionByToken(token);
    return null;
  }

  return session.user;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }

  const derived = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const stored = Buffer.from(hash, 'hex');

  if (stored.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(stored, derived);
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
