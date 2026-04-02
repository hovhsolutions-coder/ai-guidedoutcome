import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GuidanceErrorBoundary } from '@/src/components/guidance/guidance-error-boundary';
import { GuidanceSessionShell } from '@/src/components/guidance/guidance-session-shell';

export default function GuidancePage() {
  return (
    <DashboardLayout>
      <GuidanceErrorBoundary>
        <GuidanceSessionShell />
      </GuidanceErrorBoundary>
    </DashboardLayout>
  );
}
