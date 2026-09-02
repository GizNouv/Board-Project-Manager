// src/stores/boardStore.ts
import { create } from 'zustand';
import { ColumnData, TaskData } from '@/types/kanban';

// ============================================================
// Types
// ============================================================

interface BoardStoreState {
  boardId: string;
  columns: Record<string, ColumnData>;
  columnOrder: string[];
  activeColumnId: string | null;
  activeTaskId: string | null;
  mousePosition: { x: number; y: number } | null;
  isContainerOver: boolean;
}

interface BoardStoreActions {
  setBoardId: (boardId: string) => void;
  setColumns: (columns: Record<string, ColumnData>, columnOrder: string[]) => void;
  updateColumn: (columnId: string, updates: Partial<ColumnData>) => void;
  addColumn: (column: ColumnData) => void;
  deleteColumn: (columnId: string) => void;
  reorderColumns: (newOrder: string[]) => void;
  addTask: (columnId: string, task: TaskData) => void;
  updateTask: (columnId: string, taskId: string, updates: Partial<TaskData>) => void;
  deleteTask: (columnId: string, taskId: string) => void;
  reorderTasks: (columnId: string, newTaskOrder: string[]) => void;
  setActiveColumnId: (columnId: string | null) => void;
  setActiveTaskId: (taskId: string | null) => void;
  setMousePosition: (position: { x: number; y: number } | null) => void;
  setContainerOver: (isOver: boolean) => void;
}

type BoardStore = BoardStoreState & BoardStoreActions;

// ============================================================
// Implementation
// ============================================================

export const useBoardStore = create<BoardStore>((set) => ({
  // ============================================================
  // Initial State
  // ============================================================

  boardId: '',
  columns: {},
  columnOrder: [],
  activeColumnId: null,
  activeTaskId: null,
  mousePosition: null,
  isContainerOver: false,

  // ============================================================
  // Board
  // ============================================================

  setBoardId: (boardId) => set({ boardId }),

  // ============================================================
  // Columns (bulk)
  // ============================================================

  setColumns: (columns, columnOrder) =>
    set({ columns, columnOrder }),

  // ============================================================
  // Columns (single)
  // ============================================================

  updateColumn: (columnId, updates) =>
    set((state) => ({
      columns: {
        ...state.columns,
        [columnId]: {
          ...state.columns[columnId],
          ...updates,
        },
      },
    })),

  addColumn: (column) =>
    set((state) => ({
      columns: {
        ...state.columns,
        [column.id]: column,
      },
      columnOrder: [...state.columnOrder, column.id],
    })),

  // ✅ Fixed: use state parameter
  deleteColumn: (columnId) =>
    set((state) => {
      const { [columnId]: _, ...remainingColumns } = state.columns;
      return {
        columns: remainingColumns,
        columnOrder: state.columnOrder.filter((id) => id !== columnId),
      };
    }),

  reorderColumns: (newOrder) =>
    set({ columnOrder: newOrder }),

  // ============================================================
  // Tasks
  // ============================================================

  addTask: (columnId, task) =>
    set((state) => ({
      columns: {
        ...state.columns,
        [columnId]: {
          ...state.columns[columnId],
          tasks: [...state.columns[columnId]?.tasks || [], task],
        },
      },
    })),

  updateTask: (columnId, taskId, updates) =>
    set((state) => ({
      columns: {
        ...state.columns,
        [columnId]: {
          ...state.columns[columnId],
          tasks: state.columns[columnId]?.tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          ) || [],
        },
      },
    })),

  deleteTask: (columnId, taskId) =>
    set((state) => ({
      columns: {
        ...state.columns,
        [columnId]: {
          ...state.columns[columnId],
          tasks: state.columns[columnId]?.tasks.filter(
            (task) => task.id !== taskId
          ) || [],
        },
      },
    })),

  reorderTasks: (columnId, newTaskOrder) =>
    set((state) => {
      const column = state.columns[columnId];
      if (!column) return state;

      const taskMap = column.tasks.reduce((acc, task) => {
        acc[task.id] = task;
        return acc;
      }, {} as Record<string, TaskData>);

      const reorderedTasks = newTaskOrder
        .map((id) => taskMap[id])
        .filter(Boolean);

      return {
        columns: {
          ...state.columns,
          [columnId]: {
            ...column,
            tasks: reorderedTasks,
          },
        },
      };
    }),

  // ============================================================
  // Active State
  // ============================================================

  setActiveColumnId: (activeColumnId) =>
    set({ activeColumnId }),

  setActiveTaskId: (activeTaskId) =>
    set({ activeTaskId }),

  setMousePosition: (mousePosition) =>
    set({ mousePosition }),

  setContainerOver: (isContainerOver) =>
    set({ isContainerOver }),
}));