import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { UserApplicationService } from '@/core/application/services/UserApplicationService';
import { PrismaUserRepository } from '@/core/infrastructure/repositories/PrismaUserRepository';
import { verifyPassword } from '@/lib/password';

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

        const userRepository = new PrismaUserRepository();
        const userService = new UserApplicationService(userRepository);

        const result = await userService.getUserByEmail(credentials.email as string);

        if (result.isFailure()) {
          return null;
        }

        const user = result.value;

        // In a real implementation, you would retrieve the hashed password
        // from the user record. This is a placeholder.
        // You'll need to add a password field to your User entity and repository.
        const hashedPassword = ''; // This should come from the user record

        const isValid = await verifyPassword(credentials.password as string, hashedPassword);

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
    signIn: '/login',
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
      const isOnLoginPage = request.nextUrl?.pathname === '/login';

      if (isOnLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/', request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return Response.redirect(new URL('/login', request.nextUrl));
      }

      return true;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
};