import { LayoutDashboard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from './routes';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navigationConfig: NavItem[] = [
  {
    title: 'Dashboard',
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
];

export type NavigationConfig = typeof navigationConfig;