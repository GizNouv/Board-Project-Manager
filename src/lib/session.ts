import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import type { Session } from 'next-auth';

/**
 * Get the current session from the server
 * Returns null if not authenticated
 */
export async function getServerSession(): Promise<Session | null> {
  return await auth();
}

/**
 * Get the current user from the server
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

/**
 * Require authentication on the server
 * Redirects to login if not authenticated
 */
export async function requireUser() {
  const session = await getServerSession();
  
  if (!session?.user) {
    redirect(ROUTES.login);
  }
  
  return session.user;
}

/**
 * Check if the current request is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession();
  return !!session?.user;
}