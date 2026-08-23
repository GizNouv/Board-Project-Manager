import { getServerSession } from '@/lib/session';
import type { ActionHandler, ActionContext, ActionResult } from './types';

export function withAuth<TInput, TOutput>(
    handler: ActionHandler<TInput, TOutput>
): ActionHandler<TInput, TOutput> {
    return async (context: ActionContext<TInput>): Promise<ActionResult<TOutput>> => {
        const session = await getServerSession();

        if (!session?.user) {
            return {
                success: false,
                message: 'Authentication required. Please login first.',
            };
        }

        // Attach session to context
        const authContext: ActionContext<TInput> = {
            ...context,
            session,
        };

        return handler(authContext);
    };
}