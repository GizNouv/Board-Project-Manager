'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Pencil } from 'lucide-react';
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
import { updateColumnAction } from '@/app/actions/board';
import { ColumnData } from '@/types/kanban';

const editColumnSchema = z.object({
    title: z.string()
        .min(1, 'Column title is required')
        .max(100, 'Column title must not exceed 100 characters')
        .trim(),
});

type EditColumnFormData = z.infer<typeof editColumnSchema>;

interface EditColumnDialogProps {
    column: ColumnData;
    boardId: string;
    trigger?: React.ReactNode;
    onColumnUpdated?: (column: ColumnData) => void;
}

export function EditColumnDialog({
    column,
    boardId,
    trigger,
    onColumnUpdated
}: EditColumnDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EditColumnFormData>({
        resolver: zodResolver(editColumnSchema),
        defaultValues: {
            title: column.title,
        },
    });

    // Reset form when column changes
    useEffect(() => {
        reset({
            title: column.title,
        });
    }, [column, reset]);

    const onSubmit = async (data: EditColumnFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await updateColumnAction({
                columnId: column.id,
                boardId: boardId,
                title: data.title,
            });

            if (!result.success) {
                setError(result.message);
                return;
            }

            // Convert DTO back to ColumnData
            const updatedColumn: ColumnData = {
                id: result.data.id,
                title: result.data.title,
                boardId: result.data.boardId,
                order: result.data.order,
                tasks: column.tasks, // Preserve existing tasks
            };

            if (onColumnUpdated) {
                onColumnUpdated(updatedColumn);
            }

            setOpen(false);
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
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit column</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Edit Column</DialogTitle>
                    <DialogDescription>
                        Update the column name below.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4 py-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="edit-column-title">Column Name *</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-column-title"
                                        type="text"
                                        placeholder="Enter column name"
                                        disabled={isLoading}
                                        aria-invalid={!!errors.title}
                                        {...register('title')}
                                        onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} onClick={(e) => e.stopPropagation()}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}