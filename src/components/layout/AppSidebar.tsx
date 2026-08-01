'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { ROUTES } from '@/config/routes';
import { navigationConfig } from '@/config/navigation';
import { Route } from 'next';

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === ROUTES.dashboard) {
      return pathname === href;
    }
    if (href === ROUTES.boards) {
      return pathname === href || pathname?.startsWith('/boards/');
    }
    return pathname?.startsWith(href + '/') || pathname === href;
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href={ROUTES.home} className="text-xl font-bold">
          Task Board
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationConfig.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href as Route}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">Task Board v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}