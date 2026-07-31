import { redirectIfAuthenticated } from '@/lib/auth-guard';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Auth Layout - For login/register pages
 * Redirects to dashboard if already authenticated
 */
export default async function AuthLayout({ children }: AuthLayoutProps) {
  // Redirect authenticated users away from auth pages
  await redirectIfAuthenticated();
  
  return (
    <div className="auth-container min-h-screen flex items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}