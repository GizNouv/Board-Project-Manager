'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTask } from './SortableTask';
import { CreateTaskDialog } from '@/components/task/CreateTaskDialog';
import { EditColumnDialog } from '@/components/column/EditColumnDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ColumnData, TaskData } from '@/types/kanban';
import { useEffect } from 'react';

interface ColumnViewProps {
    column: ColumnData;
    boardId: string;
    className?: string;
    onTaskCreated?: (task: TaskData) => void;
    onTaskUpdated?: (task: TaskData) => void;
    onColumnUpdated?: (column: ColumnData) => void;
}

export function ColumnView({
    column,
    boardId,
    className,
    onTaskCreated,
    onTaskUpdated,
    onColumnUpdated
}: ColumnViewProps) {
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
                        {/* Edit button - isolated from drag */}
                        <EditColumnDialog
                            column={column}
                            boardId={boardId}
                            onColumnUpdated={onColumnUpdated}
                            trigger={
                                <button
                                    className="h-5 w-5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                    aria-label="Edit column"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                            }
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
        </Card>
    );
}