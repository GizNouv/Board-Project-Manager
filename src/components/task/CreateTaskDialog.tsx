'use client';

import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldContent, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createTaskAction } from '@/app/actions/task';
import { TaskData } from '@/types/kanban';

const createTaskSchema = z.object({
    title: z.string()
        .min(1, 'Task title is required')
        .max(200, 'Task title must not exceed 200 characters')
        .trim(),
    description: z.string().optional().default(''),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    estimate: z.number().min(0, 'Estimate must be a positive number'),
    estimateUnit: z.enum(['hours', 'days']),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;
type CreateTaskFormInput = z.input<typeof createTaskSchema>;

interface CreateTaskDialogProps {
    columnId: string;
    trigger?: React.ReactNode;
    onTaskCreated?: (task: TaskData) => void;
}

export function CreateTaskDialog({ columnId, trigger, onTaskCreated }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    console.log('[CreateTaskDialog] render:', {
        columnId,
        hasOnTaskCreated: typeof onTaskCreated === 'function',
        open,
    });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<CreateTaskFormInput>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: 'MEDIUM',
            estimate: 1,
            estimateUnit: 'hours',
        },
    });

    const onSubmit = async (data: CreateTaskFormInput) => {
        console.log('========== CREATE TASK DEBUG: ACTION CALL ==========');
        console.log('[CreateTaskDialog] form data:', data);
        console.log('[CreateTaskDialog] columnId prop:', columnId);

        setIsLoading(true);
        setError(null);

        try {
            const result = await createTaskAction({
                title: data.title,
                description: data.description || '',
                priority: data.priority,
                estimate: data.estimate,
                estimateUnit: data.estimateUnit,
                columnId,
            });

            console.log('========== CREATE TASK DEBUG: ACTION RESULT ==========');
            console.log('[CreateTaskDialog] result:', result);
            console.log('[CreateTaskDialog] result JSON:', JSON.stringify(result, null, 2));

            if (!result.success) {
                console.log('[CreateTaskDialog] ❌ Action failed:', result.message);
                setError(result.message);
                return;
            }

            console.log('[CreateTaskDialog] ✅ Task created successfully');

            const taskData: TaskData = {
                id: result.data.id,
                title: result.data.title,
                description: result.data.description,
                columnId: result.data.columnId,
                estimate: {
                    value: result.data.estimate,
                    unit: result.data.estimateUnit as 'hours' | 'days',
                },
                priority: {
                    value: result.data.priority,
                },
                type: result.data.type,
                assigneeId: result.data.assigneeId,
            };

            console.log('========== CREATE TASK DEBUG: CALLBACK ==========');
            console.log('[CreateTaskDialog] onTaskCreated type:', typeof onTaskCreated);
            console.log('[CreateTaskDialog] task being passed:', taskData);
            console.log('[CreateTaskDialog] task being passed JSON:', JSON.stringify(taskData, null, 2));

            if (onTaskCreated) {
                console.log('>>> [CreateTaskDialog] CALLING onTaskCreated NOW');
                onTaskCreated(taskData);
                console.log('<<< [CreateTaskDialog] onTaskCreated RETURNED');
            } else {
                console.error('!!! [CreateTaskDialog] onTaskCreated IS UNDEFINED !!!');
            }

            setOpen(false);
            reset();
        } catch (err) {
            console.error('[CreateTaskDialog] ❌ Unexpected error:', err);
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
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to this column. Fill in the details below.
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
                                <FieldLabel htmlFor="title">Title *</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="title"
                                        type="text"
                                        placeholder="Enter task title"
                                        disabled={isLoading}
                                        aria-invalid={!!errors.title}
                                        {...register('title')}
                                    />
                                </FieldContent>
                                {errors.title && <FieldError>{errors.title.message}</FieldError>}
                            </Field>
                        </FieldGroup>

                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="description">Description</FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter task description (optional)"
                                        disabled={isLoading}
                                        aria-invalid={!!errors.description}
                                        {...register('description')}
                                    />
                                </FieldContent>
                                {errors.description && <FieldError>{errors.description.message}</FieldError>}
                            </Field>
                        </FieldGroup>

                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="priority">Priority</FieldLabel>
                                <FieldContent>
                                    <Select
                                        disabled={isLoading}
                                        defaultValue="MEDIUM"
                                        onValueChange={(value) => setValue('priority', value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')}
                                    >
                                        <SelectTrigger id="priority">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                            <SelectItem value="CRITICAL">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FieldContent>
                                {errors.priority && <FieldError>{errors.priority.message}</FieldError>}
                            </Field>
                        </FieldGroup>

                        <div className="grid grid-cols-2 gap-4">
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="estimate">Estimate</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="estimate"
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            disabled={isLoading}
                                            aria-invalid={!!errors.estimate}
                                            {...register('estimate', { valueAsNumber: true })}
                                        />
                                    </FieldContent>
                                    {errors.estimate && <FieldError>{errors.estimate.message}</FieldError>}
                                </Field>
                            </FieldGroup>

                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="estimateUnit">Unit</FieldLabel>
                                    <FieldContent>
                                        <Select
                                            disabled={isLoading}
                                            defaultValue="hours"
                                            onValueChange={(value) => setValue('estimateUnit', value as 'hours' | 'days')}
                                        >
                                            <SelectTrigger id="estimateUnit">
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="hours">Hours</SelectItem>
                                                <SelectItem value="days">Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FieldContent>
                                    {errors.estimateUnit && <FieldError>{errors.estimateUnit.message}</FieldError>}
                                </Field>
                            </FieldGroup>
                        </div>
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
                            {isLoading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}