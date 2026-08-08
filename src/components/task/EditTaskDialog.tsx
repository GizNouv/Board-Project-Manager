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
import { updateTaskAction } from '@/app/actions/task';
import { TaskData } from '@/types/kanban';

const editTaskSchema = z.object({
    title: z.string()
        .min(1, 'Task title is required')
        .max(200, 'Task title must not exceed 200 characters')
        .trim(),
    description: z.string().optional().default(''),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    estimate: z.number().min(0, 'Estimate must be a positive number'),
    estimateUnit: z.enum(['hours', 'days']),
    severity: z.enum(['minor', 'major', 'critical']).optional(),
    complexity: z.enum(['low', 'medium', 'high']).optional(),
});

type EditTaskFormData = z.infer<typeof editTaskSchema>;
type EditTaskFormInput = z.input<typeof editTaskSchema>;

interface EditTaskDialogProps {
    task: TaskData;
    trigger?: React.ReactNode;
    onTaskUpdated?: (task: TaskData) => void;
}

export function EditTaskDialog({ task, trigger, onTaskUpdated }: EditTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EditTaskFormInput>({
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
    const estimateUnit = watch('estimateUnit');

    // Reset form when task changes
    useEffect(() => {
        reset({
            title: task.title,
            description: task.description || '',
            priority: task.priority.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            estimate: task.estimate.value,
            estimateUnit: task.estimate.unit as 'hours' | 'days',
            severity: task.type === 'bug' ? (task as any).severity : undefined,
            complexity: task.type === 'feature' ? (task as any).complexity : undefined,
        });
    }, [task, reset]);

    const onSubmit = async (data: EditTaskFormInput) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await updateTaskAction({
                taskId: task.id,
                columnId: task.columnId, // ✅ Add this - required by the server action
                title: data.title,
                description: data.description || '',
                priority: data.priority,
                estimate: {
                    value: data.estimate,
                    unit: data.estimateUnit,
                },
                severity: data.severity,
                complexity: data.complexity,
            });

            if (!result.success) {
                setError(result.message);
                return;
            }

            // Convert DTO back to TaskData
            const updatedTask: TaskData = {
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

            if (onTaskUpdated) {
                onTaskUpdated(updatedTask);
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
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit task</span>
                    </Button>
                )}
            </DialogTrigger>
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
                                <FieldLabel htmlFor="edit-description">Description</FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="edit-description"
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
                                <FieldLabel htmlFor="edit-priority">Priority</FieldLabel>
                                <FieldContent>
                                    <Select
                                        disabled={isLoading}
                                        defaultValue={task.priority.value}
                                        onValueChange={(value) => setValue('priority', value as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')}
                                    >
                                        <SelectTrigger id="edit-priority">
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
                                    <FieldLabel htmlFor="edit-estimate">Estimate</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="edit-estimate"
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
                                    <FieldLabel htmlFor="edit-estimateUnit">Unit</FieldLabel>
                                    <FieldContent>
                                        <Select
                                            disabled={isLoading}
                                            defaultValue={task.estimate.unit}
                                            onValueChange={(value) => setValue('estimateUnit', value as 'hours' | 'days')}
                                        >
                                            <SelectTrigger id="edit-estimateUnit">
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

                        {/* Task-type specific fields */}
                        {taskType === 'bug' && (
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="edit-severity">Severity</FieldLabel>
                                    <FieldContent>
                                        <Select
                                            disabled={isLoading}
                                            defaultValue={(task as any).severity || 'major'}
                                            onValueChange={(value) => setValue('severity', value as 'minor' | 'major' | 'critical')}
                                        >
                                            <SelectTrigger id="edit-severity">
                                                <SelectValue placeholder="Select severity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="minor">Minor</SelectItem>
                                                <SelectItem value="major">Major</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                        <Select
                                            disabled={isLoading}
                                            defaultValue={(task as any).complexity || 'medium'}
                                            onValueChange={(value) => setValue('complexity', value as 'low' | 'medium' | 'high')}
                                        >
                                            <SelectTrigger id="edit-complexity">
                                                <SelectValue placeholder="Select complexity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FieldContent>
                                    {errors.complexity && <FieldError>{errors.complexity.message}</FieldError>}
                                </Field>
                            </FieldGroup>
                        )}
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
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}