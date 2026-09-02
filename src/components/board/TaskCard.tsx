import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TaskData } from '@/types/kanban';
import { TaskMenu } from './TaskMenu';
import { EditTaskDialog } from '@/components/task/EditTaskDialog';
import { deleteTaskAction } from '@/app/actions';
import { useAction } from '@/hooks/use-action';
import { useBoardLogic } from '@/hooks/useBoardLogic';

interface TaskCardProps {
    task: TaskData;
    className?: string;
    columnId: string;
}

export function TaskCard({ task, className, columnId }: TaskCardProps) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Use useAction hook for delete mutation
    const { execute: deleteTask, isPending: isDeleting } = useAction(deleteTaskAction);

    const { handleTaskDeleted } = useBoardLogic()

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

    const handleEdit = () => {
        setEditDialogOpen(true);
    };

    const handleDelete = async () => {
        await deleteTask({
            taskId: task.id,
            columnId: columnId,
        }, {
            onSuccess: () => {
                handleTaskDeleted(task.id, columnId);
            },
        });
    };

    return (
        <>
            <Card className={cn('overflow-hidden bg-muted/50', className)}>
                <CardHeader className="p-3">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-medium leading-tight line-clamp-2 flex-1">
                            {task.title}
                        </CardTitle>
                        <TaskMenu
                            task={task}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isDeleting={isDeleting}
                        />
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

            <EditTaskDialog
                task={task}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />
        </>
    );
}