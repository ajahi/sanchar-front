import { NextResponse, type NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ABSOLUTE FIRST CHECK — webhooks must never be rewritten by Next.js.
  // nginx routes them directly to FastAPI. Any rewrite re-serializes the
  // body and breaks Meta's HMAC signature verification.
  if (pathname.startsWith('/api/v1/webhooks/')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/v1/')) {
    return NextResponse.rewrite(new URL(pathname + search, BACKEND_URL));
  }

  const hasSession = req.cookies.has('ns_session');
  const isLogin = pathname === '/login';
  if (!hasSession && !isLogin) return NextResponse.redirect(new URL('/login', req.url));
  if (hasSession && isLogin) return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)', '/api/v1/:path*'],
};