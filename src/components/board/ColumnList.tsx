import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ColumnCard } from './ColumnCard';

export interface ColumnData {
    id: string;
    title: string;
    taskCount: number;
    order: number;
}

interface ColumnListProps {
    columns: ColumnData[];
    className?: string;
}

export function ColumnList({ columns, className }: ColumnListProps) {
    if (columns.length === 0) {
        return null;
    }

    // Sort columns by order
    const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

    return (
        <ScrollArea className={className}>
            <div className="flex gap-4 pb-4">
                {sortedColumns.map((column) => (
                    <ColumnCard
                        key={column.id}
                        id={column.id}
                        title={column.title}
                        taskCount={column.taskCount}
                        className="w-[280px] shrink-0"
                    />
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}