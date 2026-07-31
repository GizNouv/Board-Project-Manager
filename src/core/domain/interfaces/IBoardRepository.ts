import { BoardId } from '../value-objects/BoardId';
import { Board } from '../entities/Board';
import { UserId } from '../value-objects/UserId';
import { Result } from '../utils/Result';

export interface IBoardRepository {
  findById(id: BoardId): Promise<Result<Board>>;
  findByUserId(userId: UserId): Promise<Result<Board[]>>;
  findAll(): Promise<Result<Board[]>>;
  save(board: Board): Promise<Result<Board>>;
  delete(id: BoardId): Promise<Result<void>>;
  update(board: Board): Promise<Result<Board>>;
  findBoardWithColumns(id: BoardId): Promise<Result<Board>>;
  saveBoardWithColumns(board: Board): Promise<Result<Board>>;
}