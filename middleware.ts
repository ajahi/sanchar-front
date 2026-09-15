import { NextResponse, type NextRequest } from 'next/server';

// Proxy the API through Next so the backend's httpOnly session cookie is first-party
// (no CORS, no cookie-domain issues). BACKEND_URL is server-side, read at runtime.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

// No session cookie -> /login. The cookie is httpOnly and set by the backend
// (/api/v1/auth/login and the Instagram callback); the backend validates it.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith('/api/v1/')) {
    return NextResponse.rewrite(new URL(pathname + search, BACKEND_URL));
  }
  const hasSession = req.cookies.has('ns_session');
  const isLogin = pathname === '/login';
  if (!hasSession && !isLogin) return NextResponse.redirect(new URL('/login', req.url));
  if (hasSession && isLogin) return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next|favicon.ico).*)', '/api/v1/:path*'] };
