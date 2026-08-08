export interface CreateBoardDTO {
  title: string;
  ownerId: string;
}

export interface UpdateBoardDTO {
  title?: string;
}

export interface CreateColumnDTO {
  title: string;
  boardId: string;
  order?: number;
}

export interface UpdateColumnDTO {
  title?: string;
  order?: number;
}

export interface BoardResponseDTO {
  id: string;
  title: string;
  ownerId: string;
  columnCount: number;
  totalTasks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ColumnDTO {
  id: string;
  boardId: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}