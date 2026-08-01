import { LayoutDashboard, LayoutGrid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from './routes';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const navigationConfig: NavItem[] = [
  {
    title: 'Overview',
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    title: 'Boards',
    href: ROUTES.boards,
    icon: LayoutGrid,
  },
];

export type NavigationConfig = typeof navigationConfig;