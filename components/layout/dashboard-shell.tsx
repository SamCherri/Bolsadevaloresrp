import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { UserRole } from '@prisma/client';

export function DashboardShell({ username, role, children }: { username: string; role: UserRole; children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <Sidebar role={role} />
      <div className="flex-1">
        <Topbar username={username} />
        <main className="p-4 md:p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
