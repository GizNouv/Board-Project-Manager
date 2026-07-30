import { BoardId } from '../value-objects/BoardId';
import { Board } from '../entities/Board';
import { UserId } from '../value-objects/UserId';
import { Result } from '../utils/Result';

/**
 * Repository interface for Board aggregate root
 * Uses rich domain operations instead of CRUD
 */
export interface IBoardRepository {
  findById(id: BoardId): Promise<Result<Board>>;
  findByUserId(userId: UserId): Promise<Result<Board[]>>;
  findAll(): Promise<Result<Board[]>>;
  save(board: Board): Promise<Result<void>>;
  delete(id: BoardId): Promise<Result<void>>;
  update(board: Board): Promise<Result<void>>;
  findBoardWithColumns(id: BoardId): Promise<Result<Board>>;
}