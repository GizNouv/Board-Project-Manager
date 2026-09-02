'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { updateTaskAction } from '@/app/actions';
import { TaskData } from '@/types/kanban';
import { useAction } from '@/hooks/use-action';
import { TaskMapper } from '@/lib/mappers';
import { useBoardLogic } from '@/hooks/useBoardLogic';

const editTaskSchema = z.object({
    title: z.string()
        .min(1, 'Task title is required')
        .max(200, 'Task title must not exceed 200 characters')
        .trim(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    estimate: z.number().min(0, 'Estimate must be a positive number'),
    estimateUnit: z.enum(['hours', 'days']),
    severity: z.enum(['minor', 'major', 'critical']).optional(),
    complexity: z.enum(['low', 'medium', 'high']).optional(),
});

type EditTaskFormData = z.infer<typeof editTaskSchema>;

interface EditTaskDialogProps {
    task: TaskData;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function EditTaskDialog({
    task,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: EditTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOnOpenChange || setInternalOpen;

    // Use useAction hook for mutation handling
    const { execute: updateTask, isPending, error, reset } = useAction(updateTaskAction);

    // useBoardLogic for state update logic
    const { handleTaskUpdated } = useBoardLogic();

    const {
        register,
        handleSubmit,
        reset: resetForm,
        control,
        formState: { errors },
    } = useForm<EditTaskFormData>({
        resolver: zodResolver(editTaskSchema),
        defaultValues: {
            title: task.title,
            description: task.description || '',
            priority: task.priority.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            estimate: task.estimate.value,
            estimateUnit: task.estimate.unit as 'hours' | 'days',
            severity: task.type === 'bug' ? (task as any).severity : undefined,
            complexity: task.type === 'feature' ? (task as any).complexity : undefined,
        },
    });

    const taskType = task.type;

    const onSubmit = async (data: EditTaskFormData) => {
        await updateTask({
            taskId: task.id,
            columnId: task.columnId,
            title: data.title,
            description: data.description || '',
            priority: data.priority,
            estimate: {
                value: data.estimate,
                unit: data.estimateUnit,
            },
            severity: data.severity,
            complexity: data.complexity,
        }, {
            onSuccess: (result) => {
                const updatedTask: TaskData = TaskMapper.toTaskData(result)
                handleTaskUpdated(updatedTask);
                setOpen(false);
                reset();
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                    <DialogDescription>
                        Update the task details below.
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
                                <FieldLabel htmlFor="edit-title">Title *</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="edit-title"
                                        type="text"
                                        placeholder="Enter task title"
                                        disabled={isPending}
                                        aria-invalid={!!errors.title}
                                        {...register('title')}
                                    />
                                </FieldContent>
                                {errors.title && <FieldError>{errors.title.message}</FieldError>}
                            </Field>
                        </FieldGroup>

                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="edit-description">Description</FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="edit-description"
                                        placeholder="Enter task description (optional)"
                                        disabled={isPending}
                                        aria-invalid={!!errors.description}
                                        {...register('description')}
                                    />
                                </FieldContent>
                                {errors.description && <FieldError>{errors.description.message}</FieldError>}
                            </Field>
                        </FieldGroup>

                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="edit-priority">Priority</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        name="priority"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                disabled={isPending}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger
                                                    id="edit-priority"


                                                >
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">Low</SelectItem>
                                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                                    <SelectItem value="HIGH">High</SelectItem>
                                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                                {errors.priority && <FieldError>{errors.priority.message}</FieldError>}
                            </Field>
                        </FieldGroup>

                        <div className="grid grid-cols-2 gap-4">
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="edit-estimate">Estimate</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="edit-estimate"
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            disabled={isPending}
                                            aria-invalid={!!errors.estimate}
                                            {...register('estimate', { valueAsNumber: true })}
                                        />
                                    </FieldContent>
                                    {errors.estimate && <FieldError>{errors.estimate.message}</FieldError>}
                                </Field>
                            </FieldGroup>

                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="edit-estimateUnit">Unit</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="estimateUnit"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    disabled={isPending}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger
                                                        id="edit-estimateUnit"


                                                    >
                                                        <SelectValue placeholder="Select unit" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="hours">Hours</SelectItem>
                                                        <SelectItem value="days">Days</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                    {errors.estimateUnit && <FieldError>{errors.estimateUnit.message}</FieldError>}
                                </Field>
                            </FieldGroup>
                        </div>

                        {taskType === 'bug' && (
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="edit-severity">Severity</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="severity"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    disabled={isPending}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger
                                                        id="edit-severity"


                                                    >
                                                        <SelectValue placeholder="Select severity" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="minor">Minor</SelectItem>
                                                        <SelectItem value="major">Major</SelectItem>
                                                        <SelectItem value="critical">Critical</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                    {errors.severity && <FieldError>{errors.severity.message}</FieldError>}
                                </Field>
                            </FieldGroup>
                        )}

                        {taskType === 'feature' && (
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="edit-complexity">Complexity</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="complexity"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    disabled={isPending}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger
                                                        id="edit-complexity"
                                                    >
                                                        <SelectValue placeholder="Select complexity" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="medium">Medium</SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                    {errors.complexity && <FieldError>{errors.complexity.message}</FieldError>}
                                </Field>
                            </FieldGroup>
                        )}
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