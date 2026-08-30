'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
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
import { createColumnAction } from '@/app/actions';
import { ColumnData } from '@/types/kanban';
import { useAction } from '@/hooks/use-action';
import { ColumnMapper } from '@/lib/mappers';

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

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const onOpenChange = controlledOnOpenChange || setInternalOpen;

    // Use useAction hook for mutation handling
    const { execute: createColumn, isPending, error, reset } = useAction(createColumnAction);

    const {
        register,
        handleSubmit,
        reset: resetForm,
        formState: { errors },
    } = useForm<CreateColumnFormData>({
        resolver: zodResolver(createColumnSchema),
        defaultValues: {
            title: '',
        },
    });

    const onSubmit = async (data: CreateColumnFormData) => {
        await createColumn({
            boardId,
            title: data.title,
        }, {
            onSuccess: (result) => {
                const newColumn: ColumnData = ColumnMapper.toColumnData(result);

                if (onColumnCreated) {
                    onColumnCreated(newColumn);
                }

                onOpenChange(false);
                resetForm();
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
                            {isPending ? 'Creating...' : 'Create Column'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}