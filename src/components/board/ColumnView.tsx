'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTask } from './SortableTask';
import { CreateTaskDialog } from '@/components/task/CreateTaskDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ColumnData, TaskData } from '@/types/kanban';
import { useEffect } from 'react';

interface ColumnViewProps {
    column: ColumnData;
    className?: string;
    onTaskCreated?: (task: TaskData) => void;
}

export function ColumnView({ column, className, onTaskCreated }: ColumnViewProps) {
    const tasks = column.tasks;
    const taskCount = tasks.length;

    // DEBUG: ColumnView render log
    console.log('[ColumnView] render:', {
        columnId: column.id,
        columnTitle: column.title,
        taskCount: tasks.length,
        taskIds: tasks.map(task => task.id),
        hasOnTaskCreated: typeof onTaskCreated === 'function',
    });

    // Log when column renders and its tasks
    useEffect(() => {
        console.log(`📋 ColumnView render: ${column.id} - ${column.title}`);
        console.log(`   tasks:`, tasks.map(t => ({ id: t.id, title: t.title })));
    }, [column.id, column.title, tasks]);

    // Check for duplicate task IDs
    useEffect(() => {
        const taskIds = tasks.map(t => t.id);
        const uniqueIds = new Set(taskIds);
        if (taskIds.length !== uniqueIds.size) {
            console.warn(`⚠️ DUPLICATE TASK IDs FOUND in column: ${column.id} - ${column.title}`);
            console.warn('Task IDs:', taskIds);
        }
    }, [tasks, column.id]);

    // Prepare task IDs for sortable context
    const taskIds = tasks.map(task => `${column.id}-task-${task.id}`);
    console.log(`🔄 ColumnView taskIds for ${column.id}:`, taskIds);

    // Set up droppable for the column
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: column.id,
        data: {
            type: 'column',
            columnId: column.id,
        },
    });

    return (
        <Card
            ref={setDroppableRef}
            className={`${className} ${isOver ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                        {column.title}
                    </CardTitle>
                    <CardDescription>
                        {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {taskCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <p className="text-sm text-muted-foreground">No tasks yet</p>
                        <CreateTaskDialog
                            columnId={column.id}
                            onTaskCreated={onTaskCreated}
                            trigger={
                                <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Task
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    <>
                        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                            {tasks.slice(0, 5).map((task) => (
                                <SortableTask key={task.id} task={task} columnId={column.id} />
                            ))}
                        </SortableContext>
                        <CreateTaskDialog
                            columnId={column.id}
                            onTaskCreated={onTaskCreated}
                            trigger={
                                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Task
                                </Button>
                            }
                        />
                        {taskCount > 5 && (
                            <p className="text-xs text-muted-foreground text-center">
                                +{taskCount - 5} more tasks
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}