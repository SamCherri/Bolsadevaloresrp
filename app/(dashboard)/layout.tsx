import { DashboardShell } from '@/components/layout/dashboard-shell';
import { requireUser } from '@/lib/auth';

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <DashboardShell username={user.username} role={user.role}>{children}</DashboardShell>;
}
