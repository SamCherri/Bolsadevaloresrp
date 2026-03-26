import { logoutAction } from '@/actions/auth-actions';

export function Topbar({ username }: { username: string }) {
  return (
    <header className="flex justify-between items-center border-b border-border p-4 bg-card">
      <p className="text-sm text-slate-300">Bem-vindo, {username}</p>
      <form action={logoutAction}><button className="btn-primary">Sair</button></form>
    </header>
  );
}
