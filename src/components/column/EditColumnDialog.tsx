'use client';

import { useState, useEffect } from 'react';
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
import { useAction } from '@/hooks/use-action';
import { ColumnMapper } from '@/lib/mappers';
import { useBoardLogic } from '@/hooks/useBoardLogic';

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
}

export function EditColumnDialog({
    column,
    boardId,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: EditColumnDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const onOpenChange = controlledOnOpenChange || setInternalOpen;

    // Use useAction hook for mutation handling
    const { execute: updateColumn, isPending, error, reset } = useAction(updateColumnAction);

    // useBoardLogic for state update logic
    const { handleColumnUpdated } = useBoardLogic();

    const {
        register,
        handleSubmit,
        reset: resetForm,
        formState: { errors },
    } = useForm<EditColumnFormData>({
        resolver: zodResolver(editColumnSchema),
        defaultValues: {
            title: column.title,
        },
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            resetForm({ title: column.title });
        }
    }, [open]);

    const onSubmit = async (data: EditColumnFormData) => {
        await updateColumn({
            columnId: column.id,
            boardId: boardId,
            title: data.title,
        }, {
            onSuccess: (result) => {
                const updatedColumn: ColumnData = ColumnMapper.toColumnData(result, column.tasks);;
                handleColumnUpdated(updatedColumn);
                onOpenChange(false);
                reset();
            },
        });
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm();
            reset();
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
                                        disabled={isPending}
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
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}