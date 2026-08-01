'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column } from '@/core/domain';
import { ColumnView } from './ColumnView';

interface SortableColumnProps {
    column: Column;
}

export function SortableColumn({ column }: SortableColumnProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `column-${column.id}` });

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
            className="h-full"
        >
            <ColumnView column={column} />
        </div>
    );
}