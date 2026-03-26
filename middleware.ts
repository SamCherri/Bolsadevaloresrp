import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = publicRoutes.some((route) => path.startsWith(route));

  // Nunca redireciona páginas públicas para evitar loop com cookie inválido/expirado.
  if (isPublic) return NextResponse.next();

  const hasCookie = Boolean(req.cookies.get('bvrp_session')?.value);
  if (!hasCookie) return NextResponse.redirect(new URL('/login', req.url));

  // Validação real da sessão/role acontece no server-side (requireUser/requireRole).
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|api|favicon.ico).*)'] };
