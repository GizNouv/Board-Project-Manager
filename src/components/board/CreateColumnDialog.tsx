'use client';

import { useState, useEffect } from 'react';
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
import { createColumnAction } from '@/app/actions/column';
import { ColumnData } from '@/types/kanban';

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
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onColumnCreated?: (column: ColumnData) => void;
}

export function CreateColumnDialog({
    boardId,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    onColumnCreated,
}: CreateColumnDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const onOpenChange = controlledOnOpenChange || setInternalOpen;

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

    // ✅ FIX: Reset form when dialog opens
    useEffect(() => {
        if (open) {
            reset({ title: '' });
        }
    }, [open]);

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

            const newColumn: ColumnData = {
                id: result.data.id,
                title: result.data.title,
                boardId: result.data.boardId,
                order: result.data.order,
                tasks: [],
            };

            if (onColumnCreated) {
                onColumnCreated(newColumn);
            }

            onOpenChange(false);
            reset();
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
        onOpenChange(newOpen);
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
                        Enter a name for your new column.
                    </DialogDescription>
                </DialogHeader>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4 py-4">
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
                            onClick={() => onOpenChange(false)}
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