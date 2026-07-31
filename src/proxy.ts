import { auth } from './auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  const isPublicRoute =
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/register') ||
    req.nextUrl.pathname.startsWith('/api/auth');

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(
      new URL('/login', req.nextUrl)
    );
  }

  if (
    isLoggedIn &&
    (req.nextUrl.pathname === '/login' ||
      req.nextUrl.pathname === '/register')
  ) {
    return NextResponse.redirect(
      new URL('/', req.nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};