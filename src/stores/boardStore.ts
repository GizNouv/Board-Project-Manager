import { create } from 'zustand';
import { ColumnData, TaskData } from '@/types/kanban';

interface BoardStoreState {
  boardId: string;
  columns: ColumnData[];
  activeColumn: ColumnData | null;
  activeTask: TaskData | null;
  mousePosition: { x: number; y: number } | null;
  isContainerOver: boolean;
}

interface BoardStoreActions {
  setBoardId: (boardId: string) => void;
  setColumns: (columns: ColumnData[] | ((prev: ColumnData[]) => ColumnData[])) => void;
  setActiveColumn: (column: ColumnData | null) => void;
  setActiveTask: (task: TaskData | null) => void;
  setMousePosition: (position: { x: number; y: number } | null) => void;
  setContainerOver: (isOver: boolean) => void;
}

type BoardStore = BoardStoreState & BoardStoreActions;

export const useBoardStore = create<BoardStore>((set) => ({
  // State
  boardId: '',
  columns: [],
  activeColumn: null,
  activeTask: null,
  mousePosition: null,
  isContainerOver: false,

  // Setters (pure state mutations, no business logic)
  setBoardId: (boardId) => set({ boardId }),
  setColumns: (columnsOrUpdater) =>
    set((state) => ({
      columns:
        typeof columnsOrUpdater === 'function'
          ? columnsOrUpdater(state.columns)
          : columnsOrUpdater,
    })),
  setActiveColumn: (activeColumn) => set({ activeColumn }),
  setActiveTask: (activeTask) => set({ activeTask }),
  setMousePosition: (mousePosition) => set({ mousePosition }),
  setContainerOver: (isContainerOver) => set({ isContainerOver }),
}));