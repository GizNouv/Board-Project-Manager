import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TaskData } from '@/types/kanban';
import { TaskMenu } from './TaskMenu';
import { EditTaskDialog } from '@/components/task/EditTaskDialog';
import { deleteTaskAction } from '@/app/actions';
import { useAction } from '@/hooks/use-action';
import { useBoardLogic } from '@/hooks/useBoardLogic';
import {
    AlertTriangle,
    Bug,
    CalendarClock,
    CheckCircle2,
    Clock,
    GripVertical,
    Layers,
    MessageSquare,
    Paperclip,
    Sparkles,
    Tag,
    Zap,
} from 'lucide-react';

interface TaskCardProps {
    task: TaskData;
    className?: string;
    columnId: string;
    /** Optional: mark the card as draggable and show the grab handle */
    isDraggable?: boolean;
}

const priorityConfig = {
    LOW: {
        label: 'Low',
        accent: 'bg-gradient-to-b from-emerald-400 to-emerald-500',
        badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
        ring: 'group-hover:ring-emerald-500/25',
        glow: 'group-hover:shadow-emerald-500/10',
        icon: CheckCircle2,
    },
    MEDIUM: {
        label: 'Medium',
        accent: 'bg-gradient-to-b from-amber-400 to-amber-500',
        badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
        ring: 'group-hover:ring-amber-500/25',
        glow: 'group-hover:shadow-amber-500/10',
        icon: Zap,
    },
    HIGH: {
        label: 'High',
        accent: 'bg-gradient-to-b from-orange-400 to-orange-500',
        badge: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
        ring: 'group-hover:ring-orange-500/25',
        glow: 'group-hover:shadow-orange-500/10',
        icon: AlertTriangle,
    },
    CRITICAL: {
        label: 'Critical',
        accent: 'bg-gradient-to-b from-red-500 to-red-600',
        badge: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
        ring: 'group-hover:ring-red-500/30',
        glow: 'group-hover:shadow-red-500/15',
        icon: AlertTriangle,
    },
} as const;

const typeConfig = {
    BUG: {
        label: 'Bug',
        icon: Bug,
        badge: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    },
    FEATURE: {
        label: 'Feature',
        icon: Sparkles,
        badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    },
    EPIC: {
        label: 'Epic',
        icon: Layers,
        badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    },
} as const;

/** Returns a due-date presentation with urgency coloring */
function getDueDateMeta(dueDate: string | Date | undefined) {
    if (!dueDate) return null;
    const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    if (Number.isNaN(date.getTime())) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDue = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round(
        (startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
    );

    const label = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });

    if (diffDays < 0) {
        return {
            label,
            tone: 'text-red-600 dark:text-red-400',
            ring: 'bg-red-500/10 border-red-500/20',
            hint: `Overdue by ${Math.abs(diffDays)}d`,
        };
    }
    if (diffDays === 0) {
        return {
            label: 'Today',
            tone: 'text-orange-600 dark:text-orange-400',
            ring: 'bg-orange-500/10 border-orange-500/20',
            hint: 'Due today',
        };
    }
    if (diffDays === 1) {
        return {
            label: 'Tomorrow',
            tone: 'text-amber-600 dark:text-amber-400',
            ring: 'bg-amber-500/10 border-amber-500/20',
            hint: 'Due tomorrow',
        };
    }
    if (diffDays <= 3) {
        return {
            label,
            tone: 'text-amber-600 dark:text-amber-400',
            ring: 'bg-amber-500/10 border-amber-500/20',
            hint: `Due in ${diffDays}d`,
        };
    }
    return {
        label,
        tone: 'text-muted-foreground',
        ring: 'bg-muted/60 border-border',
        hint: `Due in ${diffDays}d`,
    };
}

export function TaskCard({ task, className, columnId, isDraggable }: TaskCardProps) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const { execute: deleteTask, isPending: isDeleting } = useAction(deleteTaskAction);
    const { handleTaskDeleted } = useBoardLogic();

    const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
    const type = typeConfig[task.type as keyof typeof typeConfig];
    const PriorityIcon = priority?.icon;
    const TypeIcon = type?.icon;

    // Optional extended fields — safe if undefined
    const labels = (task as TaskData & { labels?: { id: string; name: string; color?: string }[] }).labels ?? [];
    const commentsCount = (task as TaskData & { commentsCount?: number }).commentsCount ?? 0;
    const attachmentsCount = (task as TaskData & { attachmentsCount?: number }).attachmentsCount ?? 0;
    const subtasks = (task as TaskData & { subtasks?: { total: number; completed: number } }).subtasks;
    const dueDate = (task as TaskData & { dueDate?: string | Date }).dueDate;
    const dueMeta = getDueDateMeta(dueDate);

    const subtaskPct =
        subtasks && subtasks.total > 0
            ? Math.round((subtasks.completed / subtasks.total) * 100)
            : 0;

    const handleEdit = () => setEditDialogOpen(true);
    const handleDelete = async () => {
        await deleteTask(
            { taskId: task.id, columnId },
            {
                successMessage: 'Task deleted successfully',
                onSuccess: () => handleTaskDeleted(task.id, columnId),
            }
        );
    };

    return (
        <TooltipProvider delayDuration={250}>
            <>
                <Card
                    className={cn(
                        'group relative bg-muted/50 overflow-hidden backdrop-blur-sm',
                        'ring-1 ring-border/60 transition-all duration-300 ease-out',
                        'hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:bg-muted',
                        priority?.ring,
                        priority?.glow,
                        isDraggable && 'cursor-grab active:cursor-grabbing',
                        isDeleting && 'opacity-40 pointer-events-none scale-[0.98]',
                        className
                    )}
                >
                    {/* Priority accent stripe */}
                    {priority && (
                        <div
                            className={cn('absolute left-0 top-0 h-full w-1', priority.accent)}
                            aria-hidden
                        />
                    )}

                    {/* Top shine on hover */}
                    <div
                        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-hidden
                    />

                    {/* Drag handle */}
                    {isDraggable && (
                        <div
                            className={cn(
                                'absolute left-1.5 top-1/2 -translate-y-1/2',
                                'opacity-0 group-hover:opacity-60 transition-opacity',
                                'text-muted-foreground'
                            )}
                            aria-hidden
                        >
                            <GripVertical className="h-4 w-4" />
                        </div>
                    )}

                    <CardHeader className={cn('p-3 pl-4 pb-2 space-y-1.5', isDraggable && 'pl-6')}>
                        {/* Labels row */}
                        {labels.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 -mt-0.5">
                                {labels.slice(0, 4).map((label) => (
                                    <span
                                        key={label.id}
                                        className="h-1.5 w-6 rounded-full"
                                        style={{ backgroundColor: label.color ?? 'var(--muted)' }}
                                        title={label.name}
                                    />
                                ))}
                                {labels.length > 4 && (
                                    <span className="text-[10px] text-muted-foreground">
                                        +{labels.length - 4}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-sm font-semibold leading-snug line-clamp-2 flex-1 tracking-tight">
                                {task.title}
                            </CardTitle>
                            <div
                                className={cn(
                                    'shrink-0 -mt-0.5 -mr-1 transition-all duration-200',
                                    'md:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
                                    'md:translate-x-1 group-hover:translate-x-0'
                                )}
                            >
                                <TaskMenu
                                    task={task}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    isDeleting={isDeleting}
                                />
                            </div>
                        </div>

                        {task.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {task.description}
                            </p>
                        )}
                    </CardHeader>

                    <CardContent className="p-3 pl-4 pt-1 space-y-3">
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {priority && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0 gap-1',
                                                priority.badge
                                            )}
                                        >
                                            {PriorityIcon && <PriorityIcon className="h-2.5 w-2.5" />}
                                            {priority.label}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        Priority: {priority.label}
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {type && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'text-[10px] font-medium uppercase tracking-wider px-1.5 py-0 gap-1',
                                                type.badge
                                            )}
                                        >
                                            {TypeIcon && <TypeIcon className="h-2.5 w-2.5" />}
                                            {type.label}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        Type: {type.label}
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {(task.complexity || task.severity) && (
                                <Badge
                                    variant="outline"
                                    className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0 text-muted-foreground border-border"
                                >
                                    {task.complexity ?? task.severity}
                                </Badge>
                            )}
                        </div>


                        {/* Footer */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                            <div className="flex items-center gap-2 min-w-0">
                                {/* Due date */}
                                {dueMeta && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md border',
                                                    dueMeta.ring,
                                                    dueMeta.tone
                                                )}
                                            >
                                                <CalendarClock className="h-3 w-3" />
                                                {dueMeta.label}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            {dueMeta.hint}
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {/* Estimate */}
                                {task.estimate && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                                                <Clock className="h-3 w-3" />
                                                {task.estimate.value} {task.estimate.unit}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            Estimate
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* Comments */}
                                {commentsCount > 0 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                                                <MessageSquare className="h-3 w-3" />
                                                {commentsCount}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            {commentsCount} comment{commentsCount === 1 ? '' : 's'}
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {/* Attachments */}
                                {attachmentsCount > 0 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                                                <Paperclip className="h-3 w-3" />
                                                {attachmentsCount}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            {attachmentsCount} attachment{attachmentsCount === 1 ? '' : 's'}
                                        </TooltipContent>
                                    </Tooltip>
                                )}

                                {/* Assignee */}
                                {task.assigneeId && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Avatar className="h-5 w-5 ring-2 ring-background transition-transform hover:scale-110">
                                                <AvatarImage src={undefined} alt={task.assigneeId} />
                                                <AvatarFallback className="text-[9px] font-semibold bg-primary/10 text-primary">
                                                    {task.assigneeId.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            Assigned to {task.assigneeId}
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <EditTaskDialog
                    task={task}
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                />
            </>
        </TooltipProvider>
    );
}