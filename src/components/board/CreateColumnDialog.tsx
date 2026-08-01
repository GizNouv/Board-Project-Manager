'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createColumnAction, type ColumnDTO } from '@/app/actions/column';

const createColumnSchema = z.object({
    title: z.string()
        .min(1, 'Column name is required')
        .max(50, 'Column name must not exceed 50 characters')
        .trim(),
});

type CreateColumnFormData = z.infer<typeof createColumnSchema>;

interface CreateColumnDialogProps {
    boardId: string;
    trigger?: React.ReactNode;
}

export function CreateColumnDialog({ boardId, trigger }: CreateColumnDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateColumnFormData>({
        resolver: zodResolver(createColumnSchema),
        defaultValues: {
            title: '',
        },
    });

    const onSubmit = async (data: CreateColumnFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await createColumnAction({
                boardId,
                title: data.title,
            });

            if (!result.success) {
                setError(result.message);
                return;
            }

            setOpen(false);
            reset();
            router.refresh();
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            reset();
            setError(null);
        }
        setOpen(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Column
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Column</DialogTitle>
                    <DialogDescription>
                        Enter a name for your new column. You can customize it later.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 py-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="title">Column Name</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="title"
                                        type="text"
                                        placeholder="e.g., To Do, In Progress, Done"
                                        disabled={isLoading}
                                        aria-invalid={!!errors.title}
                                        {...register('title')}
                                    />
                                </FieldContent>
                                {errors.title && <FieldError>{errors.title.message}</FieldError>}
                            </Field>
                        </FieldGroup>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Creating...' : 'Create Column'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}