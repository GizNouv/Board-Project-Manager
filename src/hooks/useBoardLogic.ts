// src/hooks/useBoardLogic.ts
'use client';

import { useCallback } from 'react';
import { useBoardStore } from '@/stores/boardStore';
import { ColumnData, TaskData } from '@/types/kanban';

interface UseBoardLogicReturn {
  // State from store
  columns: Record<string, ColumnData>;
  columnOrder: string[];
  activeColumnId: string | null;
  activeTaskId: string | null;
  isContainerOver: boolean;
  boardId: string;
  mousePosition: { x: number; y: number } | null;

  // Handlers (business logic only, no useAction)
  handleTaskCreated: (task: TaskData) => void;
  handleTaskUpdated: (task: TaskData) => void;
  handleTaskDeleted: (taskId: string, columnId: string) => void;
  handleColumnCreated: (column: ColumnData) => void;
  handleColumnUpdated: (column: ColumnData) => void;
  handleColumnDeleted: (columnId: string) => void;
}

// No parameters needed — state is read from store
export function useBoardLogic(): UseBoardLogicReturn {
  // ============================================================
  // State from store (read-only)
  // ============================================================

  const columns = useBoardStore((state) => state.columns);
  const columnOrder = useBoardStore((state) => state.columnOrder);
  const activeColumnId = useBoardStore((state) => state.activeColumnId);
  const activeTaskId = useBoardStore((state) => state.activeTaskId);
  const isContainerOver = useBoardStore((state) => state.isContainerOver);
  const mousePosition = useBoardStore((state) => state.mousePosition);
  const boardId = useBoardStore((state) => state.boardId);

  // ============================================================
  // Setters from store (for state updates)
  // ============================================================

  const addTask = useBoardStore((state) => state.addTask);
  const updateTask = useBoardStore((state) => state.updateTask);
  const deleteTask = useBoardStore((state) => state.deleteTask);
  const addColumn = useBoardStore((state) => state.addColumn);
  const updateColumn = useBoardStore((state) => state.updateColumn);
  const deleteColumn = useBoardStore((state) => state.deleteColumn);

  // ============================================================
  // Handlers (business logic only — no useAction)
  // ============================================================

  // ---------- TASK HANDLERS ----------

  const handleTaskCreated = useCallback((task: TaskData) => {
    console.log('[useBoardLogic] Task created:', task);
    addTask(task.columnId, task);
  }, [addTask]);

  const handleTaskUpdated = useCallback((task: TaskData) => {
    console.log('[useBoardLogic] Task updated:', task);
    updateTask(task.columnId, task.id, {
      title: task.title,
      description: task.description,
      priority: { value: task.priority.value },
      estimate: { value: task.estimate.value, unit: task.estimate.unit },
    });
  }, [updateTask]);

  const handleTaskDeleted = useCallback((taskId: string, columnId: string) => {
    console.log('[useBoardLogic] Task deleted:', taskId);
    deleteTask(columnId, taskId);
  }, [deleteTask]);

  // ---------- COLUMN HANDLERS ----------

  const handleColumnCreated = useCallback((column: ColumnData) => {
    console.log('[useBoardLogic] Column created:', column);
    addColumn(column);
  }, [addColumn]);

  const handleColumnUpdated = useCallback((column: ColumnData) => {
    console.log('[useBoardLogic] Column updated:', column);
    updateColumn(column.id, { title: column.title });
  }, [updateColumn]);

  const handleColumnDeleted = useCallback((columnId: string) => {
    console.log('[useBoardLogic] Column deleted:', columnId);
    deleteColumn(columnId);
  }, [deleteColumn]);

  // ============================================================
  // Return (State + Handlers)
  // ============================================================

  return {
    // State
    columns,
    columnOrder,
    activeColumnId,
    activeTaskId,
    isContainerOver,
    boardId,
    mousePosition,

    // Handlers
    handleTaskCreated,
    handleTaskUpdated,
    handleTaskDeleted,
    handleColumnCreated,
    handleColumnUpdated,
    handleColumnDeleted,
  };
}