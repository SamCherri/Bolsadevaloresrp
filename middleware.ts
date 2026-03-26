import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/register'];

function hasValidSessionCookie(req: NextRequest) {
  const token = req.cookies.get('bvrp_session')?.value;
  return Boolean(token && /^[a-f0-9]{64}$/i.test(token));
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = publicRoutes.some((route) => path.startsWith(route));

  if (isPublic) return NextResponse.next();

  if (!hasValidSessionCookie(req)) {
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('bvrp_session');
    return response;
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|api|favicon.ico).*)'] };
