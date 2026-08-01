import { DashboardShell } from '@/components/layout/DashboardShell';
import { requireUser } from '@/lib/session';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Ensure user is authenticated
  await requireUser();

  return <DashboardShell>{children}</DashboardShell>;
}