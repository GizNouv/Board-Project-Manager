import { useState, useCallback } from 'react';
import { ActionResult } from '@/lib/action-builder';

interface UseActionOptions<TInput, TOutput> {
    onSuccess?: (data: TOutput) => void;
    onError?: (error: string) => void;
    onSettled?: () => void;
}

export function useAction<TInput, TOutput>(
    action: (input: TInput) => Promise<ActionResult<TOutput>>
) {
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<TOutput | null>(null);

    const execute = useCallback(
        async (input: TInput, options?: UseActionOptions<TInput, TOutput>) => {
            setIsPending(true);
            setError(null);

            try {
                const result = await action(input);

                if (result.success) {
                    setData(result.data);
                    options?.onSuccess?.(result.data);
                    return result;
                } else {
                    setError(result.message);
                    options?.onError?.(result.message);
                    return result;
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                setError(message);
                options?.onError?.(message);
                return { success: false, message } as ActionResult<TOutput>;
            } finally {
                setIsPending(false);
                options?.onSettled?.();
            }
        },
        [action]
    );

    return {
        execute,
        isPending,
        error,
        data,
        reset: useCallback(() => {
            setError(null);
            setData(null);
        }, []),
        isSuccess: !!data && !error,
        isError: !!error,
    };
}