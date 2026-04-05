'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type AuthFormProps = {
  mode: 'sign-in' | 'sign-up';
  nextPath: string;
};

type AuthResponse = {
  success: boolean;
  data?: {
    nextPath: string;
  };
  error?: string;
};

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === 'sign-up';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          nextPath,
        }),
      });

      const result = (await response.json().catch(() => null)) as AuthResponse | null;

      if (!response.ok || !result?.success || !result.data?.nextPath) {
        throw new Error(result?.error || 'Unable to continue right now.');
      }

      router.push(result.data.nextPath);
      router.refresh();
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ui-surface-primary mx-auto w-full max-w-md space-y-6 p-8">
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          {isSignUp ? 'Create account' : 'Sign in'}
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          {isSignUp ? 'Start your dossier workspace' : 'Welcome back'}
        </h1>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {isSignUp
            ? 'Create an account to keep your dossiers personal, saved, and ready to continue.'
            : 'Sign in to open your dashboard, dossiers, and saved work.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="auth-name" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Name</label>
            <input
              id="auth-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="ui-input"
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="ui-input"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="auth-password" className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="ui-input"
            placeholder="At least 8 characters"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
          />
        </div>

        {error && (
          <div className="rounded-[16px] border border-[rgba(242,202,115,0.2)] bg-[var(--warning-soft)] px-4 py-3">
            <p className="text-sm text-[var(--text-primary)]">{error}</p>
          </div>
        )}

        <button type="submit" className="ui-button-primary w-full" disabled={isSubmitting}>
          {isSubmitting
            ? isSignUp
              ? 'Creating account...'
              : 'Signing in...'
            : isSignUp
              ? 'Create account'
              : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        {isSignUp ? 'Already have an account?' : 'Need an account?'}{' '}
        <Link href={isSignUp ? `/sign-in?next=${encodeURIComponent(nextPath)}` : `/sign-up?next=${encodeURIComponent(nextPath)}`} className="font-medium text-[var(--accent-primary-strong)]">
          {isSignUp ? 'Sign in' : 'Create one'}
        </Link>
      </p>
    </div>
  );
}
