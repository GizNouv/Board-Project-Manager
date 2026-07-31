import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

/**
 * Require authentication for Server Components
 * Redirects to /login if no session exists
 * Returns the session if authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login' as never);
  }
  
  return session;
}

/**
 * Redirect authenticated users away from auth pages
 * Redirects to / if session exists
 * Returns true if unauthenticated (can proceed)
 */
export async function redirectIfAuthenticated(): Promise<boolean> {
  const session = await auth();
  
  if (session?.user) {
    redirect('/');
  }
  
  return true;
}

/**
 * Get current session without redirect
 * Returns null if not authenticated
 */
export async function getOptionalSession() {
  const session = await auth();
  return session || null;
}