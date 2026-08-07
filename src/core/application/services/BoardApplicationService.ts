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
  DuplicateEntityException,
  TaskId
} from '../../domain';
import { CreateBoardDTO, UpdateBoardDTO, CreateColumnDTO, UpdateColumnDTO } from '../dto/BoardDTOs';

export class BoardApplicationService {
  constructor(
    private readonly boardRepository: IBoardRepository,
    private readonly columnRepository: IColumnRepository
  ) { }

  async createBoard(dto: CreateBoardDTO): Promise<Result<Board>> {
    if (!dto.title || dto.title.trim().length === 0) {
      return ResultFactory.failure(new ValidationException('Board title is required'));
    }

    if (dto.title.length > 100) {
      return ResultFactory.failure(new ValidationException('Board title must not exceed 100 characters'));
    }

    const board = new Board(
      new BoardId(crypto.randomUUID()),
      dto.title,
      new UserId(dto.ownerId)
    );

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

  async getBoardsByOwner(ownerId: string): Promise<Result<Board[]>> {
    return await this.boardRepository.findByUserId(new UserId(ownerId));
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

    const board = boardResult.value;

    // Calculate the next order value based on existing columns
    const existingColumns = board.columns;
    const nextOrder = existingColumns.length > 0
      ? Math.max(...existingColumns.map(col => col.order)) + 1
      : 0;

    const column = new Column(
      new ColumnId(crypto.randomUUID()),
      dto.title,
      dto.boardId,
      nextOrder
    );

    board.addColumn(column);

    const result = await this.boardRepository.saveBoardWithColumns(board);
    if (result.isFailure()) {
      return ResultFactory.failure(result.error);
    }

    return ResultFactory.success(column);
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

  // ============== DEDICATED TASK PERSISTENCE METHODS ==============

  async reorderTasks(
    columnId: string,
    orderedTaskIds: string[]
  ): Promise<Result<void>> {
    if (!orderedTaskIds || orderedTaskIds.length === 0) {
      return ResultFactory.failure(new ValidationException('Ordered task IDs cannot be empty'));
    }

    // Verify no duplicates
    const uniqueIds = new Set(orderedTaskIds);
    if (uniqueIds.size !== orderedTaskIds.length) {
      return ResultFactory.failure(new ValidationException('Duplicate task IDs in order list'));
    }

    return await this.boardRepository.reorderTasks(
      new ColumnId(columnId),
      orderedTaskIds
    );
  }

  async moveTask(
    taskId: string,
    sourceColumnId: string,
    targetColumnId: string,
    targetOrder: number,
    sourceTaskIds: string[],
    targetTaskIds: string[]
  ): Promise<Result<void>> {
    if (!sourceTaskIds || sourceTaskIds.length === 0) {
      return ResultFactory.failure(new ValidationException('Source task IDs cannot be empty'));
    }

    if (!targetTaskIds || targetTaskIds.length === 0) {
      return ResultFactory.failure(new ValidationException('Target task IDs cannot be empty'));
    }

    // Verify source task IDs are unique
    const sourceUnique = new Set(sourceTaskIds);
    if (sourceUnique.size !== sourceTaskIds.length) {
      return ResultFactory.failure(new ValidationException('Duplicate source task IDs'));
    }

    // Verify target task IDs are unique
    const targetUnique = new Set(targetTaskIds);
    if (targetUnique.size !== targetTaskIds.length) {
      return ResultFactory.failure(new ValidationException('Duplicate target task IDs'));
    }

    // Verify no overlap between source and target
    const overlap = sourceTaskIds.some(id => targetTaskIds.includes(id));
    if (overlap) {
      return ResultFactory.failure(new ValidationException('Task IDs overlap between source and target'));
    }

    // Verify taskId is in sourceTaskIds
    if (!sourceTaskIds.includes(taskId)) {
      return ResultFactory.failure(new ValidationException('Task ID not found in source task IDs'));
    }

    // Verify targetOrder is within bounds
    if (targetOrder < 0 || targetOrder > targetTaskIds.length) {
      return ResultFactory.failure(new ValidationException('Target order out of bounds'));
    }

    return await this.boardRepository.moveTask(
      new TaskId(taskId),
      new ColumnId(sourceColumnId),
      new ColumnId(targetColumnId),
      targetOrder,
      sourceTaskIds,
      targetTaskIds
    );
  }
}