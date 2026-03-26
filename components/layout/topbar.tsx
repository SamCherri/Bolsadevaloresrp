import { logoutAction } from '@/actions/auth-actions';

export function Topbar({ username }: { username: string }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center border-b border-border p-4 bg-card">
      <p className="text-sm text-slate-300 break-all">Bem-vindo, {username}</p>
      <form action={logoutAction} className="w-full sm:w-auto"><button className="btn-primary w-full sm:w-auto">Sair</button></form>
    </header>
  );
}
