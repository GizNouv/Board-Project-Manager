import { z } from 'zod';
import type { ActionHandler, ActionContext, ActionResult } from './types';

export function withValidation<TInput, TOutput>(
    handler: ActionHandler<TInput, TOutput>,
    schema: z.ZodSchema<TInput>
): ActionHandler<TInput, TOutput> {
    return async (context: ActionContext<TInput>): Promise<ActionResult<TOutput>> => {
        const result = schema.safeParse(context.input);

        if (!result.success) {
            return {
                success: false,
                message: result.error.issues[0]?.message || 'Validation failed',
            };
        }

        // Pass validated input to the next handler
        const validatedContext: ActionContext<TInput> = {
            ...context,
            input: result.data,
        };

        return handler(validatedContext);
    };
}