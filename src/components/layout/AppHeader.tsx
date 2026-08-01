'use client';

import { Menu } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';

export function AppHeader() {
  return (
    <header className="flex h-16 items-center gap-4 border-b px-4 md:px-6">
      <SidebarTrigger>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </SidebarTrigger>
      <div className="flex flex-1 items-center justify-end gap-4">
        {/* Theme toggle placeholder */}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <span className="sr-only">Toggle theme</span>
          <span className="text-sm">🌓</span>
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}