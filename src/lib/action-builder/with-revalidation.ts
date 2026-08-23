import { revalidatePath } from 'next/cache';
import type { ActionHandler, ActionContext, RevalidationTarget, ActionResult } from './types';

function normalizeTargets<TInput>(
  target: RevalidationTarget<TInput>,
  input: TInput
): string[] {
  // Resolve function if provided
  const resolved = typeof target === 'function' ? target(input) : target;
  
  if (typeof resolved === 'string') {
    return [resolved];
  }
  if (Array.isArray(resolved)) {
    return resolved.flatMap(t => normalizeTargets(t, input));
  }
  // { path, type? }
  return [resolved.path];
}

export function withRevalidation<TInput, TOutput>(
  handler: ActionHandler<TInput, TOutput>,
  target: RevalidationTarget<TInput>
): ActionHandler<TInput, TOutput> {
  return async (context: ActionContext<TInput>): Promise<ActionResult<TOutput>> => {
    const result = await handler(context);

    if (result.success) {
      const paths = normalizeTargets(target, context.input);
      for (const path of paths) {
        revalidatePath(path);
      }
    }

    return result;
  };
}