import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { container } from '@/core/infrastructure/container';
import { verifyPassword } from '@/lib/password';
import { ROUTES } from './config/routes';

const protectedRoutes = [
  ROUTES.home,
];

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const userService = container.userApplicationService;

        const result = await userService.getUserByEmail(credentials.email as string);

        if (result.isFailure()) {
          return null;
        }

        const user = result.value;

        const isValid = await verifyPassword(credentials.password as string, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: ROUTES.login,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = request.nextUrl?.pathname === ROUTES.login || request.nextUrl?.pathname === ROUTES.register;
      const isOnProtectedPage =  protectedRoutes.some((route) => request.nextUrl?.pathname === route)

      if (isOnLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/', request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && isOnProtectedPage) {
        return Response.redirect(new URL(ROUTES.login, request.nextUrl));
      }

      return true;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
};