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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updateBoardAction } from '@/app/actions';
import { useAction } from '@/hooks/use-action';

const editBoardSchema = z.object({
    title: z.string()
        .min(1, 'Board title is required')
        .max(100, 'Board title must not exceed 100 characters')
        .trim(),
});

type EditBoardFormData = z.infer<typeof editBoardSchema>;

interface EditBoardDialogProps {
    board: {
        id: string;
        title: string;
    };
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function EditBoardDialog({
    board,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: EditBoardDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const onOpenChange = controlledOnOpenChange || setInternalOpen;

    // Use useAction hook for mutation handling
    const { execute: updateBoard, isPending, error, reset } = useAction(updateBoardAction);

    const {
        register,
        handleSubmit,
        reset: resetForm,
        formState: { errors },
    } = useForm<EditBoardFormData>({
        resolver: zodResolver(editBoardSchema),
        defaultValues: {
            title: board.title,
        },
    });

    useEffect(() => {
        resetForm({
            title: board.title,
        });
    }, [board, resetForm]);

    const onSubmit = async (data: EditBoardFormData) => {
        await updateBoard({
            boardId: board.id,
            title: data.title,
        }, {
            successMessage: "Board updated successfully",
            onSuccess: () => {
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
            {/* <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit board</span>
                    </Button>
                )}
            </DialogTrigger> */}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Board</DialogTitle>
                    <DialogDescription>
                        Update the board name below.
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
                                <FieldLabel htmlFor="edit-board-title">Board Name *</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-board-title"
                                        type="text"
                                        placeholder="Enter board name"
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