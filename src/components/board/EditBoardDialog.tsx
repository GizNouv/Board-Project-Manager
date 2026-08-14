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
import { updateBoardAction } from '@/app/actions/board';
import { BoardData } from '@/types/kanban';

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
    onBoardUpdated?: (board: { id: string; title: string }) => void;
}

export function EditBoardDialog({
    board,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    onBoardUpdated
}: EditBoardDialogProps) {
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
    } = useForm<EditBoardFormData>({
        resolver: zodResolver(editBoardSchema),
        defaultValues: {
            title: board.title,
        },
    });

    useEffect(() => {
        reset({
            title: board.title,
        });
    }, [board, reset]);

    const onSubmit = async (data: EditBoardFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await updateBoardAction({
                boardId: board.id,
                title: data.title,
            });

            if (!result.success) {
                setError(result.message);
                return;
            }

            if (onBoardUpdated) {
                onBoardUpdated({
                    id: result.data.id,
                    title: result.data.title,
                });
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
            <DialogTrigger asChild>
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
            </DialogTrigger>
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
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}