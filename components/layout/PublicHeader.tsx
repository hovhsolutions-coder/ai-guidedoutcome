import Link from 'next/link';
import { type AuthUser } from '@/src/lib/auth/auth';
import { SignOutButton } from '@/components/auth/SignOutButton';

type PublicHeaderProps = {
  user: AuthUser | null;
};

export function PublicHeader({ user }: PublicHeaderProps) {
  return (
    <header className="relative z-10 border-b border-white/8 bg-[rgba(5,11,20,0.68)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3 text-[var(--text-primary)]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold">
            GO
          </span>
          <span className="text-sm font-semibold tracking-[0.14em] uppercase text-[var(--text-secondary)]">
            Guided Outcome
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard" className="ui-button-secondary">
                Dashboard
              </Link>
              <Link href="/dossiers" className="ui-button-secondary">
                My Dossiers
              </Link>
              <Link href="/dossiers/new" className="ui-button-primary">
                New dossier
              </Link>
              <SignOutButton className="ui-button-secondary" />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="ui-button-secondary">
                Sign in
              </Link>
              <Link href="/sign-up" className="ui-button-primary">
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
