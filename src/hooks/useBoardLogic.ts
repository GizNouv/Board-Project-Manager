'use client';

import { useCallback } from 'react';
import { useBoardStore } from '@/stores/boardStore';
import { ColumnData, TaskData } from '@/types/kanban';

interface UseBoardLogicReturn {
  // State from store
  columns: ColumnData[];
  activeColumn: ColumnData | null;
  activeTask: TaskData | null;
  isContainerOver: boolean;
  boardId: string;
  mousePosition: { x: number; y: number } | null;

  // Sensors (to be implemented)
  sensors: ReturnType<typeof import('@dnd-kit/core').useSensors>;

  // Callbacks (to be migrated from BoardView in later steps)
  handleTaskCreated: (task: TaskData) => void;
  handleTaskUpdated: (task: TaskData) => void;
  handleColumnUpdated: (column: ColumnData) => void;
  handleDragStart: (event: import('@dnd-kit/core').DragStartEvent) => void;
  handleDragEnd: (event: import('@dnd-kit/core').DragEndEvent) => void;
}

export function useBoardLogic(boardId: string, initialColumns: ColumnData[]): UseBoardLogicReturn {
  // Store state
  const columns = useBoardStore((state) => state.columns);
  const activeColumn = useBoardStore((state) => state.activeColumn);
  const activeTask = useBoardStore((state) => state.activeTask);
  const isContainerOver = useBoardStore((state) => state.isContainerOver);
  const mousePosition = useBoardStore((state) => state.mousePosition);
  const storedBoardId = useBoardStore((state) => state.boardId);

  // Store setters
  const setColumns = useBoardStore((state) => state.setColumns);
  const setActiveColumn = useBoardStore((state) => state.setActiveColumn);
  const setActiveTask = useBoardStore((state) => state.setActiveTask);
  const setMousePosition = useBoardStore((state) => state.setMousePosition);
  const setContainerOver = useBoardStore((state) => state.setContainerOver);
  const setBoardId = useBoardStore((state) => state.setBoardId);

  // Initialize store on first call / boardId change
  // TODO: Add proper initialization logic in Step 3

  // ========== HANDLE TASK CREATED CALLBACK ==========
  // Migrated from BoardView.tsx - Step 4
  const handleTaskCreated = useCallback((newTask: TaskData) => {
    console.log('[useBoardLogic] Task created, updating state:', newTask);

    setColumns(prevColumns => {
      return prevColumns.map(column => {
        if (column.id === newTask.columnId) {
          if (column.tasks.some(task => task.id === newTask.id)) {
            return column;
          }
          return {
            ...column,
            tasks: [...column.tasks, newTask],
          };
        }
        return column;
      });
    });
  }, [setColumns]);

  const handleTaskUpdated = useCallback((task: TaskData) => {
    console.warn('[useBoardLogic] handleTaskUpdated not yet implemented');
  }, []);

  const handleColumnUpdated = useCallback((column: ColumnData) => {
    console.warn('[useBoardLogic] handleColumnUpdated not yet implemented');
  }, []);

  const handleDragStart = useCallback((event: import('@dnd-kit/core').DragStartEvent) => {
    console.warn('[useBoardLogic] handleDragStart not yet implemented');
  }, []);

  const handleDragEnd = useCallback((event: import('@dnd-kit/core').DragEndEvent) => {
    console.warn('[useBoardLogic] handleDragEnd not yet implemented');
  }, []);

  // Sensors placeholder
  const sensors = [] as any; // TODO: migrate sensor setup in Step 3

  return {
    columns,
    activeColumn,
    activeTask,
    isContainerOver,
    boardId: storedBoardId || boardId,
    mousePosition,
    sensors,
    handleTaskCreated,
    handleTaskUpdated,
    handleColumnUpdated,
    handleDragStart,
    handleDragEnd,
  };
}
