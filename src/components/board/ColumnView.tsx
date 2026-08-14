'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTask } from './SortableTask';
import { CreateTaskDialog } from '@/components/task/CreateTaskDialog';
import { EditColumnDialog } from '@/components/column/EditColumnDialog';
import { ColumnMenu } from './ColumnMenu';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ColumnData, TaskData } from '@/types/kanban';
import { deleteColumnAction } from '@/app/actions/column';
import { useEffect } from 'react';

interface ColumnViewProps {
    column: ColumnData;
    boardId: string;
    className?: string;
    onTaskCreated?: (task: TaskData) => void;
    onTaskUpdated?: (task: TaskData) => void;
    onTaskDeleted?: (taskId: string) => void;
    onColumnUpdated?: (column: ColumnData) => void;
    onColumnDeleted?: (columnId: string) => void;
}

export function ColumnView({
    column,
    boardId,
    className,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onColumnUpdated,
    onColumnDeleted
}: ColumnViewProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const tasks = column.tasks;
    const taskCount = tasks.length;

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

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteColumnAction({
                columnId: column.id,
                boardId: boardId,
            });
            if (result.success && onColumnDeleted) {
                onColumnDeleted(column.id);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card
            ref={setDroppableRef}
            className={`${className} ${isOver ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                            {column.title}
                        </CardTitle>
                        <ColumnMenu
                            column={column}
                            onEdit={() => setEditDialogOpen(true)}
                            onDelete={handleDelete}
                            isDeleting={isDeleting}
                        />
                    </div>
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
                                <SortableTask
                                    key={task.id}
                                    task={task}
                                    columnId={column.id}
                                    onTaskUpdated={onTaskUpdated}
                                    onTaskDeleted={onTaskDeleted}
                                />
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

            <EditColumnDialog
                column={column}
                boardId={boardId}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onColumnUpdated={onColumnUpdated}
            />
        </Card>
    );
}