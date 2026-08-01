import {
  IBoardRepository,
  IColumnRepository,
  Board,
  BoardId,
  UserId,
  Column,
  ColumnId,
  Result,
  ResultFactory,
  EntityNotFoundException,
  ValidationException,
  DuplicateEntityException
} from '../../domain';
import { CreateBoardDTO, UpdateBoardDTO, CreateColumnDTO, UpdateColumnDTO } from '../dto/BoardDTOs';

export class BoardApplicationService {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly columnRepository: IColumnRepository
  ) { }

  async createBoard(dto: CreateBoardDTO): Promise<Result<Board>> {
    // Validate input
    if (!dto.title || dto.title.trim().length === 0) {
      return ResultFactory.failure(new ValidationException('Board title is required'));
    }

    if (dto.title.length > 100) {
      return ResultFactory.failure(new ValidationException('Board title must not exceed 100 characters'));
    }

    // Create board entity
    const board = new Board(
      new BoardId(crypto.randomUUID()),
      dto.title,
      new UserId(dto.ownerId)
    );

    // Save to repository
    return await this.boardRepository.save(board);
  }

  async getBoard(id: string): Promise<Result<Board>> {
    return await this.boardRepository.findById(new BoardId(id));
  }

  async getBoardWithColumns(id: string): Promise<Result<Board>> {
    return await this.boardRepository.findBoardWithColumns(new BoardId(id));
  }

  async getBoardsByUser(userId: string): Promise<Result<Board[]>> {
    return await this.boardRepository.findByUserId(new UserId(userId));
  }

  async getFirstBoardByUser(userId: string): Promise<Result<Board>> {
    const boardsResult = await this.boardRepository.findByUserId(new UserId(userId));
    if (boardsResult.isFailure()) {
      return ResultFactory.failure(boardsResult.error);
    }

    const boards = boardsResult.value;
    if (boards.length === 0) {
      return ResultFactory.failure(new EntityNotFoundException('Board', userId));
    }

    return await this.boardRepository.findBoardWithColumns(boards[0].id);
  }

  async getAllBoards(): Promise<Result<Board[]>> {
    return await this.boardRepository.findAll();
  }

  async updateBoard(id: string, dto: UpdateBoardDTO): Promise<Result<Board>> {
    const boardResult = await this.boardRepository.findById(new BoardId(id));
    if (boardResult.isFailure()) {
      return ResultFactory.failure(boardResult.error);
    }

    const board = boardResult.value;

    if (dto.title) {
      board.updateTitle(dto.title);
    }

    return await this.boardRepository.update(board);
  }

  async addColumn(dto: CreateColumnDTO): Promise<Result<Column>> {
    const boardResult = await this.boardRepository.findById(new BoardId(dto.boardId));
    if (boardResult.isFailure()) {
      return ResultFactory.failure(boardResult.error);
    }

    const column = new Column(
      new ColumnId(crypto.randomUUID()),
      dto.title,
      dto.boardId,
      dto.order || 0
    );

    const board = boardResult.value;
    board.addColumn(column);

    const updateResult = await this.boardRepository.update(board);
    if (updateResult.isFailure()) {
      return ResultFactory.failure(updateResult.error);
    }

    return await this.columnRepository.save(column);
  }

  async getColumn(id: string): Promise<Result<Column>> {
    return await this.columnRepository.findById(new ColumnId(id));
  }

  async getColumnsByBoard(boardId: string): Promise<Result<Column[]>> {
    return await this.columnRepository.findByBoardId(new BoardId(boardId));
  }

  async updateColumn(id: string, dto: UpdateColumnDTO): Promise<Result<Column>> {
    const columnResult = await this.columnRepository.findById(new ColumnId(id));
    if (columnResult.isFailure()) {
      return ResultFactory.failure(columnResult.error);
    }

    const column = columnResult.value;

    if (dto.title) {
      column.updateTitle(dto.title);
    }

    if (dto.order !== undefined) {
      column.updateOrder(dto.order);
    }

    return await this.columnRepository.update(column);
  }

  async deleteColumn(id: string): Promise<Result<void>> {
    const columnResult = await this.columnRepository.findById(new ColumnId(id));
    if (columnResult.isFailure()) {
      return ResultFactory.failure(columnResult.error);
    }

    const column = columnResult.value;
    const boardResult = await this.boardRepository.findById(new BoardId(column.boardId));
    if (boardResult.isFailure()) {
      return ResultFactory.failure(boardResult.error);
    }

    const board = boardResult.value;
    board.removeColumn(column.id);

    const updateResult = await this.boardRepository.update(board);
    if (updateResult.isFailure()) {
      return ResultFactory.failure(updateResult.error);
    }

    return await this.columnRepository.delete(column.id);
  }

  async deleteBoard(id: string): Promise<Result<void>> {
    return await this.boardRepository.delete(new BoardId(id));
  }

  async reorderColumn(columnId: string, newPosition: number): Promise<Result<void>> {
    return await this.columnRepository.reorderColumn(new ColumnId(columnId), newPosition);
  }
}