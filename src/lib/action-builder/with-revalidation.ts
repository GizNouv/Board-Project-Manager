import { revalidatePath } from 'next/cache';
import type { ActionHandler, ActionContext, RevalidationTarget, ActionResult } from './types';

function normalizeTargets(target: RevalidationTarget): string[] {
  if (typeof target === 'string') {
    return [target];
  }
  if (Array.isArray(target)) {
    return target.flatMap(t => normalizeTargets(t));
  }
  // { path, type? }
  return [target.path];
}

export function withRevalidation<TInput, TOutput>(
  handler: ActionHandler<TInput, TOutput>,
  target: RevalidationTarget
): ActionHandler<TInput, TOutput> {
  return async (context: ActionContext<TInput>): Promise<ActionResult<TOutput>> => {
    const result = await handler(context);

    // ✅ Now TypeScript knows result has 'success' property
    if (result.success) {
      const paths = normalizeTargets(target);
      for (const path of paths) {
        revalidatePath(path);
      }
    }

    return result;
  };
}