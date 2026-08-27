'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SortableTask } from './SortableTask';
import { CreateTaskDialog } from '@/components/task/CreateTaskDialog';
import { EditColumnDialog } from '@/components/column/EditColumnDialog';
import { ColumnMenu } from './ColumnMenu';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ColumnData, TaskData } from '@/types/kanban';
import { deleteColumnAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { useAction } from '@/hooks/use-action';

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
    onColumnDeleted,
}: ColumnViewProps) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const tasks = column.tasks;
    const taskCount = tasks.length;

    const { execute: deleteColumn, isPending: isDeleting } = useAction(deleteColumnAction)

    // Makes the column itself a drop target, so a task can be dropped
    // into empty space — including an empty column, which otherwise
    // has no task-level droppables to catch it. collisionPriority is
    // kept lower than a task's own (default) priority so hovering
    // directly over a task still targets that task, not the column
    // background behind it — this is the dnd-kit-documented pattern
    // for kanban-style boards.
    const { ref: droppableRef, isDropTarget } = useDroppable({
        id: column.id,
        type: 'column',
        accept: 'task',
        collisionPriority: -1,
    });

    const handleDelete = async () => {
        await deleteColumn({
            columnId: column.id,
            boardId: boardId,
        }, {
            onSuccess: () => {
                if (onColumnDeleted) {
                    onColumnDeleted(column.id);
                }
            }
        });
    };

    return (
        <Card
            ref={droppableRef}
            className={cn('max-h-full gap-2 border-border border', className, isDropTarget && 'border-primary')}
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
            <div className='max-h-full overflow-y-auto scroll-smooth py-1 scrollbar-thumb-muted-foreground scrollbar-thin scrollbar-track-transparent'>
                <CardContent className="space-y-2 px-2">
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
                        tasks.map((task, index) => (
                            <SortableTask
                                key={task.id}
                                task={task}
                                columnId={column.id}
                                index={index}
                                onTaskUpdated={onTaskUpdated}
                                onTaskDeleted={onTaskDeleted}
                            />
                        ))
                    )}
                </CardContent>

                <EditColumnDialog
                    column={column}
                    boardId={boardId}
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    onColumnUpdated={onColumnUpdated}
                />
            </div>
            {
                taskCount !== 0
                &&
                <CardFooter>
                    <CreateTaskDialog
                        columnId={column.id}
                        onTaskCreated={onTaskCreated}
                        trigger={
                            <Button variant="ghost" size="sm" className="w-full justify-center text-muted-foreground">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Task
                            </Button>
                        }
                    />
                </CardFooter>
            }
        </Card>
    );
}