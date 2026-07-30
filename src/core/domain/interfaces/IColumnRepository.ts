import { ColumnId } from '../value-objects/ColumnId';
import { Column } from '../entities/Column';
import { BoardId } from '../value-objects/BoardId';

/**
 * IColumnRepository - Repository interface for Column entities
 * Demonstrates repository pattern for domain entities
 */
export interface IColumnRepository {
  findById(id: ColumnId): Promise<Column | null>;
  findByBoardId(boardId: BoardId): Promise<Column[]>;
  findAll(): Promise<Column[]>;
  save(column: Column): Promise<void>;
  delete(id: ColumnId): Promise<void>;
  update(column: Column): Promise<void>;
}