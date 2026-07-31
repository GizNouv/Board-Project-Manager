import { Route } from "next";

function createRoute<T extends string>(path: T): Route {
    return path as Route;
}

export const ROUTES = {
    root: createRoute('/'),
    login: createRoute('/login'),
    register: createRoute('/register'),
}