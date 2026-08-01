'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTask } from './SortableTask';

interface TaskData {
    id: string;
    title: string;
    description: string;
    estimate: {
        value: number;
        unit: string;
    };
    priority: {
        value: string;
    };
    type: string;
    assigneeId: string | null;
}

interface ColumnData {
    id: string;
    title: string;
    boardId: string;
    order: number;
    tasks: TaskData[];
}

interface ColumnViewProps {
    column: ColumnData;
    className?: string;
}

export function ColumnView({ column, className }: ColumnViewProps) {
    const tasks = column.tasks;
    const taskCount = tasks.length;

    // Prepare task IDs for sortable context
    const taskIds = tasks.map(task => `${column.id}-task-${task.id}`);

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                    {column.title}
                </CardTitle>
                <CardDescription>
                    {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {taskCount === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks yet</p>
                ) : (
                    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                        {tasks.slice(0, 5).map((task) => (
                            <SortableTask key={task.id} task={task} columnId={column.id} />
                        ))}
                    </SortableContext>
                )}
                {taskCount > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                        +{taskCount - 5} more tasks
                    </p>
                )}
            </CardContent>
        </Card>
    );
}