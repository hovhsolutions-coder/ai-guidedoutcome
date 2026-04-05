import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { requireCurrentUser } from '@/src/lib/auth/auth';

export default async function DashboardPage() {
  const user = await requireCurrentUser('/dashboard');
  return <DashboardOverview ownerUserId={user.id} ownerName={user.name} />;
}
