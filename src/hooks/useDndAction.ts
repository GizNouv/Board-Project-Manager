// src/hooks/useDndAction.ts
import { useCallback } from 'react';
import { toast } from 'sonner';

interface DndActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
}

/**
 * Non-blocking DnD action hook using fetch instead of Server Actions.
 * Server Actions block the UI in Next.js 15; fetch does not.
 */
export function useDndAction<TInput, TOutput>(
  endpoint: string
) {
  const execute = useCallback(
    async (input: TInput, options?: DndActionOptions<TOutput>): Promise<void> => {
      try {
        // Use fetch - this is truly non-blocking
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        const result = await response.json();

        if (result.success) {
          toast.success(options?.successMessage || 'Operation completed successfully')
          options?.onSuccess?.(result.data);
        } else {
          const message = result.message || 'Something went wrong'
          toast.error(message)
          options?.onError?.(message);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Network error';
        toast.error(message)
        options?.onError?.(message);
      }
    },
    [endpoint]
  );

  return { execute };
}