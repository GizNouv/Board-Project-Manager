'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { createTaskAction } from '@/app/actions';
import { TaskData } from '@/types/kanban';
import { useAction } from '@/hooks/use-action';
import { TaskMapper } from '@/lib/mappers';
import { useBoardLogic } from '@/hooks/useBoardLogic';
import { TASK_DEFAULTS } from '@/constants/task-defaults';
import { COMPLEXITIES, ESTIMATE_UNITS, PRIORITIES, SEVERITIES, TASK_TYPES, TaskComplexityEnum, TaskEstimateUnitEnum, TaskPrioritiesEnum, TaskSeverityEnum, TaskTypesEnum } from '@/types';

const createTaskSchema = z.object({
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

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

interface CreateTaskDialogProps {
    columnId: string;
    trigger?: React.ReactNode;
}

export function CreateTaskDialog({ columnId, trigger }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false);

    // Use useAction hook for mutation handling
    const { execute: createTask, isPending, error, reset } = useAction(createTaskAction);

    // useBoardLogic for state update logic
    const { handleTaskCreated } = useBoardLogic();

    const {
        register,
        handleSubmit,
        reset: resetForm,
        resetField,
        control,
        watch,
        formState: { errors },
    } = useForm<CreateTaskFormData>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: TASK_DEFAULTS.priority,
            estimate: TASK_DEFAULTS.estimate,
            estimateUnit: TASK_DEFAULTS.estimateUnit,
            type: TASK_DEFAULTS.type,
            severity: TASK_DEFAULTS.severity,
            complexity: TASK_DEFAULTS.complexity,
        },
    });

    const watchType = watch('type');

    const onSubmit = async (data: CreateTaskFormData) => {
        await createTask({
            title: data.title,
            description: data.description || '',
            priority: data.priority,
            estimate: data.estimate,
            estimateUnit: data.estimateUnit,
            columnId,
            type: data.type || TASK_DEFAULTS.type,
            severity: data.severity,
            complexity: data.complexity,
        }, {
            successMessage: "Task created successfully",
            onSuccess: (result) => {
                const taskData: TaskData = TaskMapper.toTaskData(result);
                handleTaskCreated(taskData);
                setOpen(false);
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
                                <FieldLabel htmlFor="description">Description</FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="description"
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
                                <FieldLabel htmlFor="priority">Priority</FieldLabel>
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
                                                <SelectTrigger id="priority">
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
                                <FieldLabel htmlFor="type">Task Type</FieldLabel>
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
                                                        resetField('complexity', { defaultValue: TaskComplexityEnum.MEDIUM });
                                                    } else if (value === 'BUG') {
                                                        resetField('complexity');
                                                        resetField('severity', { defaultValue: TaskSeverityEnum.MAJOR });
                                                    } else {
                                                        resetField('severity');
                                                        resetField('complexity');
                                                    }
                                                }}
                                            >
                                                <SelectTrigger id="type">
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
                                    <FieldLabel htmlFor="estimate">Estimate</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="estimate"
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
                                    <FieldLabel htmlFor="estimateUnit">Unit</FieldLabel>
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
                                                    <SelectTrigger id="estimateUnit">
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
                        {watchType === 'BUG' && (
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="severity">Severity</FieldLabel>
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
                                                    <SelectTrigger id="severity">
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

                        {/* ✅ Conditional: Complexity for FEATURE */}
                        {watchType === 'FEATURE' && (
                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="complexity">Complexity</FieldLabel>
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
                                                    <SelectTrigger id="complexity">
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
                            {isPending ? 'Creating...' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}