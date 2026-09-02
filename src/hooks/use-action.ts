import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ActionResult } from '@/lib/action-builder';

interface UseActionOptions<TInput, TOutput> {
    onSuccess?: (data: TOutput) => void;
    onError?: (error: string) => void;
    onSettled?: () => void;
    successMessage?: string;
    errorMessage?: string;
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

                    // Sonner success toast
                    toast.success(
                        options?.successMessage || 'Operation completed successfully'
                    );

                    return result;
                } else {
                    setError(result.message);
                    options?.onError?.(result.message);

                    // Sonner error toast
                    toast.error(
                        options?.errorMessage || result.message || 'Something went wrong'
                    );

                    return result;
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                setError(message);
                options?.onError?.(message);

                // Sonner error toast for thrown errors
                toast.error(options?.errorMessage || message);

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