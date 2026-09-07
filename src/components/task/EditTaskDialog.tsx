'use client';

import { useEffect, useState } from 'react';
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
import { updateTaskAction, UpdateTaskInput } from '@/app/actions';
import { TaskData } from '@/types/kanban';
import { useAction } from '@/hooks/use-action';
import { TaskMapper } from '@/lib/mappers';
import { useBoardLogic } from '@/hooks/useBoardLogic';
import { TASK_DEFAULTS } from '@/constants/task-defaults';
import { COMPLEXITIES, ESTIMATE_UNITS, EstimateUnit, PRIORITIES, Priority, SEVERITIES, TASK_TYPES, TaskComplexityEnum, TaskEstimateUnitEnum, TaskPrioritiesEnum, TaskSeverityEnum, TaskType, TaskTypesEnum } from '@/types';

const editTaskSchema = z.object({
    title: z.string()
        .min(1, 'Task title is required')
        .max(200, 'Task title must not exceed 200 characters')
        .trim(),
    description: z.string().optional(),
    priority: z.enum(PRIORITIES),
    estimate: z.number().min(0, 'Estimate must be a positive number'),
    estimateUnit: z.enum(ESTIMATE_UNITS),
    type: z.enum(TASK_TYPES),
    severity: z.enum(SEVERITIES).optional(),
    complexity: z.enum(COMPLEXITIES).optional(),
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
        watch,
        resetField,
        formState: { errors },
    } = useForm<EditTaskFormData>({
        resolver: zodResolver(editTaskSchema),
        defaultValues: {
            title: task.title,
            description: task.description || '',
            priority: task.priority as Priority,
            estimate: task.estimate.value,
            estimateUnit: task.estimate.unit as EstimateUnit,
            type: task.type.toUpperCase() as TaskType || TASK_DEFAULTS.type,
            severity: (task as any).severity || undefined,
            complexity: (task as any).complexity || undefined,
        },
    });

    // Reset form when task changes (after update action)
    useEffect(() => {
        resetForm({
            title: task.title,
            description: task.description || '',
            priority: task.priority as Priority,
            estimate: task.estimate.value,
            estimateUnit: task.estimate.unit as EstimateUnit,
            type: task.type.toUpperCase() as TaskType || TASK_DEFAULTS.type,
            severity: (task as any).severity || undefined,
            complexity: (task as any).complexity || undefined,
        });
    }, [task, resetForm, open]);

    const watchType = watch('type');
    const taskType = watchType || task.type;

    const onSubmit = async (data: EditTaskFormData) => {

        const payload: UpdateTaskInput = {
            taskId: task.id,
            columnId: task.columnId,
            title: data.title,
            description: data.description || '',
            priority: data.priority,
            estimate: {
                value: data.estimate,
                unit: data.estimateUnit,
            },
        };

        // Only include optional fields if they have valid values
        if (data.severity !== undefined && data.severity !== null) {
            payload.severity = data.severity;
        }

        if (data.complexity !== undefined && data.complexity !== null) {
            payload.complexity = data.complexity;
        }

        if (data.type !== undefined && data.type !== task.type?.toUpperCase()) {
            payload.type = data.type;
        }

        console.log('📤 Payload being sent:', JSON.stringify(payload, null, 2));

        await updateTask(
            payload,
            {
                successMessage: "Task updated successfully",
                onSuccess: (result) => {
                    const updatedTask: TaskData = TaskMapper.toTaskData(result);
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
                                                <SelectTrigger id="edit-priority">
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={TaskPrioritiesEnum.LOW}>Low</SelectItem>
                                                    <SelectItem value={TaskPrioritiesEnum.MEDIUM}>Medium</SelectItem>
                                                    <SelectItem value={TaskPrioritiesEnum.HIGH}>High</SelectItem>
                                                    <SelectItem value={TaskPrioritiesEnum.CRITICAL}>Critical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                                {errors.priority && <FieldError>{errors.priority.message}</FieldError>}
                            </Field>
                        </FieldGroup>

                        {/* Task Type Selector */}
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="edit-type">Task Type</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        name="type"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                disabled={isPending}
                                                value={field.value}
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    // Reset severity/complexity when type changes
                                                    if (value === 'FEATURE') {
                                                        resetField('severity');
                                                        resetField('complexity', { defaultValue: task.complexity });
                                                    } else if (value === 'BUG') {
                                                        resetField('complexity');
                                                        resetField('severity', { defaultValue: task.severity });
                                                    } else {
                                                        resetField('severity');
                                                        resetField('complexity');
                                                    }
                                                }}
                                            >
                                                <SelectTrigger id="edit-type">
                                                    <SelectValue placeholder="Select task type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={TaskTypesEnum.FEATURE}>Feature</SelectItem>
                                                    <SelectItem value={TaskTypesEnum.BUG}>Bug</SelectItem>
                                                    <SelectItem value={TaskTypesEnum.EPIC}>Epic</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                                {errors.type && <FieldError>{errors.type.message}</FieldError>}
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
                                                    <SelectTrigger id="edit-estimateUnit">
                                                        <SelectValue placeholder="Select unit" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={TaskEstimateUnitEnum.HOURS}>Hours</SelectItem>
                                                        <SelectItem value={TaskEstimateUnitEnum.DAYS}>Days</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                    {errors.estimateUnit && <FieldError>{errors.estimateUnit.message}</FieldError>}
                                </Field>
                            </FieldGroup>
                        </div>

                        {/* Conditional: Severity for BUG */}
                        {taskType === 'BUG' && (
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
                                                    <SelectTrigger id="edit-severity">
                                                        <SelectValue placeholder="Select severity" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={TaskSeverityEnum.MINOR}>Minor</SelectItem>
                                                        <SelectItem value={TaskSeverityEnum.MAJOR}>Major</SelectItem>
                                                        <SelectItem value={TaskSeverityEnum.CRITICAL}>Critical</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                    {errors.severity && <FieldError>{errors.severity.message}</FieldError>}
                                </Field>
                            </FieldGroup>
                        )}

                        {/* Conditional: Complexity for FEATURE */}
                        {taskType === 'FEATURE' && (
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
                                                    <SelectTrigger id="edit-complexity">
                                                        <SelectValue placeholder="Select complexity" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={TaskComplexityEnum.LOW}>Low</SelectItem>
                                                        <SelectItem value={TaskComplexityEnum.MEDIUM}>Medium</SelectItem>
                                                        <SelectItem value={TaskComplexityEnum.HIGH}>High</SelectItem>
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