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
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}