import Link from 'next/link';
import { BarChart3, Building2, Landmark, ShieldCheck, UserCircle2, Wallet2, Repeat } from 'lucide-react';
import { UserRole } from '@prisma/client';

export function Sidebar({ role }: { role: UserRole }) {
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, roles: ['INVESTOR', 'ISSUER', 'COLLABORATOR', 'ADMIN'] },
    { href: '/market', label: 'Mercado', icon: Landmark, roles: ['INVESTOR', 'ISSUER', 'ADMIN'] },
    { href: '/assets', label: 'Ativos', icon: Building2, roles: ['INVESTOR', 'ISSUER', 'ADMIN'] },
    { href: '/portfolio', label: 'Carteira', icon: Wallet2, roles: ['INVESTOR', 'ISSUER', 'COLLABORATOR', 'ADMIN'] },
    { href: '/exchange', label: 'Câmbio', icon: Repeat, roles: ['INVESTOR', 'ISSUER', 'COLLABORATOR', 'ADMIN'] },
    { href: '/collaborator', label: 'Colaborador', icon: UserCircle2, roles: ['COLLABORATOR', 'ADMIN'] },
    { href: '/admin', label: 'Admin', icon: ShieldCheck, roles: ['ADMIN'] },
  ].filter((l) => l.roles.includes(role));

  return (
    <>
      <aside className="hidden md:block md:w-64 bg-card border-r border-border p-4 space-y-2">
        <h1 className="text-xl font-bold mb-4">Bolsa de Valores RP</h1>
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted text-sm min-h-11">
            <Icon size={16} />{label}
          </Link>
        ))}
      </aside>

      <aside className="md:hidden bg-card border-b border-border p-2 sticky top-0 z-30">
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 text-xs min-h-11">
              <Icon size={14} />{label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
