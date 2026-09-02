'use client';

import { useSortable } from '@dnd-kit/react/sortable';
import { TaskCard } from './TaskCard';
import { TaskData } from '@/types/kanban';

interface SortableTaskProps {
    task: TaskData;
    columnId: string;
    index: number;
}

export function SortableTask({ task, columnId, index }: SortableTaskProps) {
    // `group: columnId` is what makes this sortable across columns, not
    // just within one — items sharing a group can be reordered among
    // themselves (see dnd-kit's "Multiple sortable lists" guide).
    // `type`/`accept` both 'task' keep tasks only interacting with
    // other tasks (not columns).
    const { ref, isDragging } = useSortable({
        id: task.id,
        index,
        group: columnId,
        type: 'task',
        accept: 'task',
    });

    return (
        <div
            ref={ref}
            style={{ opacity: isDragging ? 0.4 : 1, cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            <TaskCard
                task={task}
                columnId={columnId}
            />
        </div>
    );
}