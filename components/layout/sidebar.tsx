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
    <aside className="w-full md:w-64 bg-card border-r border-border p-4 space-y-2">
      <h1 className="text-xl font-bold mb-4">Bolsa de Valores RP</h1>
      {links.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-sm">
          <Icon size={16} />{label}
        </Link>
      ))}
    </aside>
  );
}
