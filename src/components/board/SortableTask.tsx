'use client'; // Next.js directive - this component runs on the client side

import { useSortable } from '@dnd-kit/sortable'; // Hook for making individual tasks draggable/sortable
import { useDroppable } from '@dnd-kit/core'; // Hook for making elements droppable targets
import { useDndContext } from '@dnd-kit/core'; // Hook to access global drag state
import { CSS } from '@dnd-kit/utilities'; // Utility for transforming CSS during drag
import { TaskCard } from './TaskCard'; // Component that renders the actual task content
import { TaskData } from '@/types/kanban'; // Type definition for Task data
import { useEffect } from 'react'; // React hook for side effects
import { cn } from '@/lib/utils'; // Utility for conditional class names

// Props interface for the SortableTask component
interface SortableTaskProps {
    task: TaskData;
    columnId: string;
    onTaskUpdated?: (task: TaskData) => void;
    onTaskDeleted?: (taskId: string) => void;
}

export function SortableTask({ task, columnId, onTaskUpdated, onTaskDeleted }: SortableTaskProps) {
    // Unique identifier for this sortable task (combines column and task IDs)
    const sortableId = `${columnId}-task-${task.id}`;
    
    // Access global drag context to check what's being dragged and where
    const { active, over } = useDndContext();
    
    // Check if a task from another column is being dragged
    const isDraggingTask = active?.data?.current?.type === 'task';
    const isDraggingFromOtherColumn = isDraggingTask && active?.data?.current?.columnId !== columnId;
    const isDraggingThisTask = active?.id === sortableId;

    // Debug log to track component renders (useful for performance debugging)
    useEffect(() => {
        console.log(`  🔹 SortableTask render: ${sortableId}`);
    }, [sortableId]);

    // Hook that enables drag-and-drop sorting functionality for tasks within the same column
    const {
        attributes, // Accessibility attributes for drag handle
        listeners, // Event listeners for drag interactions
        setNodeRef: setSortableRef, // Ref to attach to the DOM element
        transform, // CSS transform values during drag
        transition, // CSS transition for smooth animations
        isDragging, // Boolean indicating if this task is being dragged
    } = useSortable({
        id: sortableId, // Unique identifier for this sortable item
        data: {
            type: 'task', // Type of draggable item
            taskId: task.id, // Task ID
            columnId: columnId, // Source column ID
            task: task, // Store full task data for ghost preview
        }
    });

    // Style object for the dragging animation
    const style = {
        transform: CSS.Transform.toString(transform), // Apply drag transform
        transition, // Apply smooth transition
        opacity: isDragging ? 0.3 : 1, // Make semi-transparent while dragging
        cursor: isDragging ? 'grabbing' : 'grab', // Change cursor based on drag state
    };

    // Check if this task is being hovered over during a drag
    const isOverThisTask = over?.id === `drop-${sortableId}`;
    
    // Determine if we should show a ghost preview (when dragging from another column)
    const shouldShowGhost = isDraggingFromOtherColumn && isOverThisTask && !isDraggingThisTask;

    // Get the task data of the item being dragged (for ghost preview)
    const draggingTask = active?.data?.current?.task as TaskData | undefined;

    return (
        <div className="relative">
            {/* Ghost preview - shows a faded copy of the dragged task when moving between columns */}
            {shouldShowGhost && draggingTask && (
                <div className="mb-2">
                    {/* Visual guide line indicating drop position */}
                    <div className="h-0.5 bg-primary rounded-full mb-2 animate-pulse" />
                    
                    {/* Faded preview of the task being dragged */}
                    <div className="pointer-events-none opacity-50">
                        <TaskCard
                            task={draggingTask}
                            columnId={columnId}
                            className="border-2 border-dashed border-primary bg-primary/5 shadow-lg"
                        />
                    </div>
                </div>
            )}

            {/* Main task rendering */}
            <div
                ref={setSortableRef} // Attach sortable ref to this div
                style={style} // Apply drag animation styles
                {...attributes} // Spread accessibility attributes
                {...listeners} // Spread drag event listeners
                className={cn(
                    'transition-all duration-200',
                    isDragging && 'opacity-30', // Reduce opacity when dragging
                    // Highlight with ring when a task from another column is hovered over this
                    isOverThisTask && isDraggingFromOtherColumn && 'ring-2 ring-primary ring-offset-2 rounded-lg'
                )}
            >
                {/* Render the actual task card content */}
                <TaskCard
                    task={task}
                    columnId={columnId}
                    onTaskUpdated={onTaskUpdated}
                    onTaskDeleted={onTaskDeleted}
                />
            </div>
        </div>
    );
}