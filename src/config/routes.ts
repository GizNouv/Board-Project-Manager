import { Route } from "next";

export const ROUTES = {
  home: '/' as Route,
  login: '/login' as Route,
  register: '/register' as Route,
  dashboard: '/dashboard' as Route,
  board: '/board' as Route,
  tasks: '/tasks' as Route,
  profile: '/profile' as Route,
  api: {
    auth: {
      register: '/api/auth/register' as Route,
    },
  },
}