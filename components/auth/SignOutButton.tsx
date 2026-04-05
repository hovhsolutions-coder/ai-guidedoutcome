'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type SignOutButtonProps = {
  className?: string;
  label?: string;
};

export function SignOutButton({
  className = 'ui-button-secondary',
  label = 'Sign out',
}: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
      });
    } finally {
      router.push('/');
      router.refresh();
      setIsPending(false);
    }
  };

  return (
    <button type="button" onClick={handleSignOut} className={className} disabled={isPending}>
      {isPending ? 'Signing out...' : label}
    </button>
  );
}
