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
import { createBoardAction } from '@/app/actions';
import { useAction } from '@/hooks/use-action';

const createBoardSchema = z.object({
    title: z.string()
        .min(1, 'Board name is required')
        .max(100, 'Board name must not exceed 100 characters')
        .trim(),
});

type CreateBoardFormData = z.infer<typeof createBoardSchema>;

interface CreateBoardDialogProps {
    userId: string;
}

export function CreateBoardDialog({ userId }: CreateBoardDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    // Use useAction hook for mutation handling
    const { execute: createBoard, isPending, error, reset } = useAction(createBoardAction);

    const {
        register,
        handleSubmit,
        reset: resetForm,
        formState: { errors },
    } = useForm<CreateBoardFormData>({
        resolver: zodResolver(createBoardSchema),
        defaultValues: {
            title: '',
        },
    });

    const onSubmit = async (data: CreateBoardFormData) => {
        await createBoard({
            title: data.title,
            ownerId: userId,
        }, {
            onSuccess: (result) => {
                setOpen(false);
                resetForm();
                reset();
                router.push(`/boards/${result.id}`);
                router.refresh();
            },
        });
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm();
            reset();
        }
        setOpen(newOpen);
    };


    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Board
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Board</DialogTitle>
                    <DialogDescription>
                        Enter a name for your new board. You can customize it later.
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
                                <FieldLabel htmlFor="title">Board Name</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="title"
                                        type="text"
                                        placeholder="e.g., Project Management, Sprint Planning"
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
                            {isPending ? 'Creating...' : 'Create Board'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}