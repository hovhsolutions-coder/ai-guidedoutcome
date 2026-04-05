import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { getCurrentUser, getSafeNextPath } from '@/src/lib/auth/auth';

export default async function SignInPage(props: PageProps<'/sign-in'>) {
  const [{ next }, user] = await Promise.all([props.searchParams, getCurrentUser()]);
  const nextPath = getSafeNextPath(Array.isArray(next) ? next[0] : next);

  if (user) {
    redirect(nextPath);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(109,156,255,0.08),_transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a1321_0%,#07111f_44%,#050b14_100%)]" />
      <PublicHeader user={null} />
      <div className="relative flex min-h-[calc(100vh-81px)] items-center justify-center px-6 py-16 sm:px-8">
        <AuthForm mode="sign-in" nextPath={nextPath} />
      </div>
    </div>
  );
}
