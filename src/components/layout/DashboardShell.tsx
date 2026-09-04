'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main id='DashboardShell' className="flex-1 p-4 md:p-6 md:max-w-[calc(100vw-(256px))] overflow-x-hidden transition-all duration-350">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}