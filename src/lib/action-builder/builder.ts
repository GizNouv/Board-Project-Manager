import {
  type ActionBuilder,
  type ActionConfig,
  type ActionHandler,
  type ActionContext,
  type ActionResult,
  type RevalidationTarget,
  type CreateAction,
} from './types';
import { withValidation } from './with-validation';
import { withAuth } from './with-auth';
import { withRevalidation } from './with-revalidation';

export const createAction: CreateAction = <TInput, TOutput>(
  config: Pick<ActionConfig<TInput, TOutput>, 'handler'>
): ActionBuilder<TInput, TOutput> => {
  let schema: ActionConfig<TInput, TOutput>['schema'];
  let requireAuth = false;
  let revalidateTarget: RevalidationTarget<TInput> | undefined;

  let handler: ActionHandler<TInput, TOutput> = config.handler;

  const builder: ActionBuilder<TInput, TOutput> = {
    withValidation(s: typeof schema) {
      schema = s;
      return builder;
    },

    withAuth() {
      requireAuth = true;
      return builder;
    },

    withRevalidation(target: RevalidationTarget) {
      revalidateTarget = target;
      return builder;
    },

    build() {
      // 1. Start with the base handler
      let composedHandler = handler;

      // 2. Apply validation (if schema provided)
      if (schema) {
        composedHandler = withValidation(composedHandler, schema);
      }

      // 3. Apply auth (if required)
      if (requireAuth) {
        composedHandler = withAuth(composedHandler);
      }

      // 4. Apply revalidation (if target provided)
      if (revalidateTarget) {
        composedHandler = withRevalidation(composedHandler, revalidateTarget);
      }

      // Return the action function
      return async (input: TInput): Promise<ActionResult<TOutput>> => {
        try {
          const context: ActionContext<TInput> = {
            input,
            session: null,
          };

          return await composedHandler(context);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An unexpected error occurred';
          return {
            success: false,
            message,
          };
        }
      };
    },
  };

  return builder;
};