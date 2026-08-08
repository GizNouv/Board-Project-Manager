import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TaskData } from '@/types/kanban';
import { EditTaskDialog } from '@/components/task/EditTaskDialog';

interface TaskCardProps {
    task: TaskData;
    className?: string;
    onTaskUpdated?: (task: TaskData) => void;
}

export function TaskCard({ task, className, onTaskUpdated }: TaskCardProps) {
    const priorityColors = {
        LOW: 'bg-green-500/10 text-green-700 dark:text-green-400',
        MEDIUM: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
        HIGH: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
        CRITICAL: 'bg-red-500/10 text-red-700 dark:text-red-400',
    };

    const typeColors = {
        bug: 'bg-red-500/10 text-red-700 dark:text-red-400',
        feature: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
        epic: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    };

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium leading-tight line-clamp-2 flex-1">
                        {task.title}
                    </CardTitle>
                    {/* Edit button - opens EditTaskDialog */}
                    {onTaskUpdated && (
                        <EditTaskDialog
                            task={task}
                            onTaskUpdated={onTaskUpdated}
                            trigger={
                                <button
                                    className="h-6 w-6 shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                    aria-label="Edit task"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                            }
                        />
                    )}
                </div>
                {task.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                        {task.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                        variant="secondary"
                        className={cn(
                            'text-xs font-medium',
                            priorityColors[task.priority.value as keyof typeof priorityColors] || ''
                        )}
                    >
                        {task.priority.value}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-xs font-medium',
                            typeColors[task.type as keyof typeof typeColors] || ''
                        )}
                    >
                        {task.type}
                    </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {task.estimate && (
                        <span>
                            {task.estimate.value} {task.estimate.unit}
                        </span>
                    )}
                    {task.assigneeId && (
                        <span>👤 Assigned</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}