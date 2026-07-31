import { auth } from './auth';
import { NextResponse } from 'next/server';
import { ROUTES } from './config/routes';

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  const isPublicRoute =
    req.nextUrl.pathname.startsWith(ROUTES.login) ||
    req.nextUrl.pathname.startsWith(ROUTES.register) ||
    req.nextUrl.pathname.startsWith('/api/auth');

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(
      new URL(ROUTES.login, req.nextUrl)
    );
  }

  if (
    isLoggedIn &&
    (req.nextUrl.pathname === ROUTES.login ||
      req.nextUrl.pathname === ROUTES.register)
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