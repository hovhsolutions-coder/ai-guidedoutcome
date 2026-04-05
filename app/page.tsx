import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { getCurrentUser } from '@/src/lib/auth/auth';

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(109,156,255,0.08),_transparent_28%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(111,145,205,0.05),_transparent_22%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a1321_0%,#07111f_44%,#050b14_100%)]" />
      <PublicHeader user={user} />
      
      {/* Hero section */}
      <div className="relative flex min-h-[calc(100vh-81px)] items-center justify-center px-6 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-5 inline-flex">
            <span className="ui-chip ui-chip-accent">{user ? 'Your dossier workspace' : 'Dossier workspace'}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
            <span className="text-white">Move the next</span>
            <br />
            <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-strong)] bg-clip-text text-transparent">
              dossier forward
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto leading-relaxed">
            {user
              ? 'Open your dashboard, continue saved dossiers, or start a new one without losing momentum.'
              : 'Sign in, create your account, and turn a messy situation into a structured dossier you can keep moving.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={user ? '/dossiers/new' : '/sign-up'}
              className="ui-button-primary text-lg px-8 py-4 min-h-[3.5rem] w-full sm:w-auto"
            >
              {user ? 'Generate dossier' : 'Create account'}
            </Link>
            <Link
              href={user ? '/dossiers' : '/sign-in'}
              className="ui-button-secondary text-lg px-8 py-4 min-h-[3.5rem] w-full sm:w-auto"
            >
              {user ? 'My Dossiers' : 'Sign in'}
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="ui-button-secondary text-lg px-8 py-4 min-h-[3.5rem] w-full sm:w-auto"
              >
                Dashboard
              </Link>
            )}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3 text-sm text-[var(--text-muted)]">
            <span className="ui-surface-secondary px-4 py-2">Clear account path</span>
            <span className="ui-surface-secondary px-4 py-2">Reliable creation</span>
            <span className="ui-surface-secondary px-4 py-2">Personal dossiers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
