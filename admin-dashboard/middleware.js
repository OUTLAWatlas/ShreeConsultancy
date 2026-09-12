import { NextResponse } from 'next/server';
import { verifySessionToken } from './lib/session';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublicPath = pathname.startsWith('/login') || pathname.startsWith('/api/auth');
  if (isPublicPath) return NextResponse.next();

  const token = request.cookies.get('admin_session')?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
