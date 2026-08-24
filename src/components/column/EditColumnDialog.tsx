'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateColumnAction } from '@/app/actions';
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
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onColumnUpdated?: (column: ColumnData) => void;
}

export function EditColumnDialog({
    column,
    boardId,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    onColumnUpdated
}: EditColumnDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasInitializedRef = useRef(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const onOpenChange = controlledOnOpenChange || setInternalOpen;

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

    // ✅ FIX: Only reset when dialog opens, NOT on every render
    useEffect(() => {
        if (open) {
            reset({ title: column.title });
        }
    }, [open]); // ✅ Removed column.title from dependencies

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

            const updatedColumn: ColumnData = {
                id: result.data.id,
                title: result.data.title,
                boardId: result.data.boardId,
                order: result.data.order,
                tasks: column.tasks,
            };

            if (onColumnUpdated) {
                onColumnUpdated(updatedColumn);
            }

            onOpenChange(false);
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Column</DialogTitle>
                    <DialogDescription>
                        Update the column name below.
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
                                <FieldLabel htmlFor="edit-column-title">Column Name *</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-column-title"
                                        type="text"
                                        placeholder="Enter column name"
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
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}