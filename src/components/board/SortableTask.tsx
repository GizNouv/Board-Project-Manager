'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';

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

interface SortableTaskProps {
    task: TaskData;
    columnId: string;
}

export function SortableTask({ task, columnId }: SortableTaskProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `${columnId}-task-${task.id}`,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            <TaskCard task={task} />
        </div>
    );
}