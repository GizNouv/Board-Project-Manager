import { BoardId } from '../value-objects/BoardId';
import { Board } from '../entities/Board';
import { UserId } from '../value-objects/UserId';
import { Result } from '../utils/Result';
import { ColumnId } from '../value-objects/ColumnId';
import { TaskId } from '../value-objects/TaskId';

export interface IBoardRepository {
  findById(id: BoardId): Promise<Result<Board>>;
  findByUserId(userId: UserId): Promise<Result<Board[]>>;
  findAll(): Promise<Result<Board[]>>;
  save(board: Board): Promise<Result<Board>>;
  delete(id: BoardId): Promise<Result<void>>;
  update(board: Board): Promise<Result<Board>>;
  findBoardWithColumns(id: BoardId): Promise<Result<Board>>;
  saveBoardWithColumns(board: Board): Promise<Result<Board>>;
  findBoardByColumnId(columnId: ColumnId): Promise<Result<Board>>;
  
  // New methods for task DnD persistence
  reorderTasks(
    columnId: ColumnId,
    orderedTaskIds: string[]
  ): Promise<Result<void>>;
  
  moveTask(
    taskId: TaskId,
    sourceColumnId: ColumnId,
    targetColumnId: ColumnId,
    targetOrder: number,
    sourceTaskIds: string[],
    targetTaskIds: string[]
  ): Promise<Result<void>>;
}