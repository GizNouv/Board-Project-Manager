import { UserMenu } from '@/components/auth/UserMenu';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { requireAuth } from '@/lib/auth-guard';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard Layout - Protected by authentication
 * All routes under this layout require authentication
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Verify authentication before rendering
  await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href={ROUTES.home} className="text-xl font-bold">
            Task Board
          </Link>
          <UserMenu />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}