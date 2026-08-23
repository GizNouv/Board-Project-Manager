import { z } from 'zod';
import type { Session } from 'next-auth';

// ============================================================
// 1. Core Result Type (shared across all actions)
// ============================================================

export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; message: string };

// ============================================================
// 2. Action Context
// ============================================================

export type ActionContext<TInput = unknown> = {
    input: TInput;
    session: Session | null;
};

// ✅ FIX: Handler ALWAYS returns ActionResult<TOutput>
export type ActionHandler<TInput, TOutput> = (
    context: ActionContext<TInput>
) => Promise<ActionResult<TOutput>>;

// ============================================================
// 3. Revalidation Configuration
// ============================================================

export type RevalidationTarget =
    | string
    | { path: string; type?: 'page' | 'layout' }
    | RevalidationTarget[];

// ============================================================
// 4. Action Configuration
// ============================================================

export type ActionConfig<TInput, TOutput> = {
    handler: ActionHandler<TInput, TOutput>;
    schema?: z.ZodSchema<TInput>;
    requireAuth?: boolean;
    revalidate?: RevalidationTarget;
};

// ============================================================
// 5. Action Builder Interface (Fluent API)
// ============================================================

export type ActionBuilder<TInput, TOutput> = {
    withValidation: (schema: z.ZodSchema<TInput>) => ActionBuilder<TInput, TOutput>;
    withAuth: () => ActionBuilder<TInput, TOutput>;
    withRevalidation: (target: RevalidationTarget) => ActionBuilder<TInput, TOutput>;
    build: () => (input: TInput) => Promise<ActionResult<TOutput>>;
};

// ============================================================
// 6. Factory Function Type
// ============================================================

export type CreateAction = <TInput, TOutput>(
    config: Pick<ActionConfig<TInput, TOutput>, 'handler'>
) => ActionBuilder<TInput, TOutput>;