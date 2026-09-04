import { Route } from "next";

export const ROUTES = {
  home: '/' as Route,
  login: '/login' as Route,
  register: '/register' as Route,
  dashboard: '/dashboard' as Route,
  boards: '/boards' as Route,
  board: (boardId: string) => `/boards/${boardId}` as Route,
  tasks: '/tasks' as Route,
  profile: '/profile' as Route,
  api: {
    auth: {
      register: '/api/auth/register' as Route,
    },
  },
}