import { ColumnId } from '../value-objects/ColumnId';
import { Column } from '../entities/Column';
import { BoardId } from '../value-objects/BoardId';
import { Result } from '../utils/Result';

export interface IColumnRepository {
  findById(id: ColumnId): Promise<Result<Column>>;
  findByBoardId(boardId: BoardId): Promise<Result<Column[]>>;
  findAll(): Promise<Result<Column[]>>;
  save(column: Column): Promise<Result<Column>>;
  delete(id: ColumnId): Promise<Result<void>>;
  update(column: Column): Promise<Result<Column>>;
  findColumnWithTasks(id: ColumnId): Promise<Result<Column>>;
  reorderColumn(columnId: ColumnId, newOrder: number): Promise<Result<void>>;
  findBoardColumns(boardId: BoardId): Promise<Result<Column[]>>;
}