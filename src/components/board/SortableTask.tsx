'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { TaskData } from '@/types/kanban';
import { useEffect } from 'react';

interface SortableTaskProps {
    task: TaskData;
    columnId: string;
    onTaskUpdated?: (task: TaskData) => void;
}

export function SortableTask({ task, columnId, onTaskUpdated }: SortableTaskProps) {
    const sortableId = `${columnId}-task-${task.id}`;

    // Log when SortableTask renders
    useEffect(() => {
        console.log(`  🔹 SortableTask render: ${sortableId}`);
    }, [sortableId]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: sortableId,
        data: {
            type: 'task',
            taskId: task.id,
            columnId: columnId,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <TaskCard task={task} onTaskUpdated={onTaskUpdated} />
        </div>
    );
}