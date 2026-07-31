import { prisma } from '../prisma/client';
import {
  IBoardRepository,
  Board,
  BoardId,
  UserId,
  Result,
  ResultFactory,
  EntityNotFoundException,
  DuplicateEntityException,
  DomainException
} from '../../domain';
import { BoardMapper } from '../mappers/BoardMapper';
import { PrismaErrorMapper } from '../errors/PrismaErrorMapper';

export class PrismaBoardRepository implements IBoardRepository {
  private boardMapper = new BoardMapper();

  async findById(id: BoardId): Promise<Result<Board>> {
    try {
      const board = await prisma.board.findUnique({
        where: { id: id.toString() }
      });

      if (!board) {
        return ResultFactory.failure(new EntityNotFoundException('Board', id.toString()));
      }

      return ResultFactory.success(this.boardMapper.toDomain(board));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findByUserId(userId: UserId): Promise<Result<Board[]>> {
    try {
      const boards = await prisma.board.findMany({
        where: { ownerId: userId.toString() },
        orderBy: { createdAt: 'desc' }
      });

      return ResultFactory.success(boards.map(board => this.boardMapper.toDomain(board)));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findAll(): Promise<Result<Board[]>> {
    try {
      const boards = await prisma.board.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return ResultFactory.success(boards.map(board => this.boardMapper.toDomain(board)));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async save(board: Board): Promise<Result<Board>> {
    try {
      const data = this.boardMapper.toPersistence(board);

      await prisma.board.create({
        data
      });

      return ResultFactory.success(board);
    } catch (error) {
      if (PrismaErrorMapper.isDuplicateError(error)) {
        return ResultFactory.failure(new DuplicateEntityException('Board', board.id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async delete(id: BoardId): Promise<Result<void>> {
    try {
      await prisma.board.delete({
        where: { id: id.toString() }
      });

      return ResultFactory.success(undefined);
    } catch (error) {
      if (PrismaErrorMapper.isNotFoundError(error)) {
        return ResultFactory.failure(new EntityNotFoundException('Board', id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async update(board: Board): Promise<Result<Board>> {
    try {
      const data = this.boardMapper.toPersistenceUpdate(board);

      await prisma.board.update({
        where: { id: board.id.toString() },
        data
      });

      return ResultFactory.success(board);
    } catch (error) {
      if (PrismaErrorMapper.isNotFoundError(error)) {
        return ResultFactory.failure(new EntityNotFoundException('Board', board.id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async findBoardWithColumns(id: BoardId): Promise<Result<Board>> {
    try {
      const board = await prisma.board.findUnique({
        where: { id: id.toString() },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                include: {
                  assignee: true
                },
                orderBy: { createdAt: 'asc' }
              }
            }
          }
        }
      });

      if (!board) {
        return ResultFactory.failure(new EntityNotFoundException('Board', id.toString()));
      }

      return ResultFactory.success(this.boardMapper.toDomainWithColumns(board));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async saveBoardWithColumns(board: Board): Promise<Result<Board>> {
    try {
      await prisma.$transaction(async (tx) => {
        const boardData = this.boardMapper.toPersistence(board);
        await tx.board.upsert({
          where: { id: board.id.toString() },
          update: boardData,
          create: boardData
        });

        for (const column of board.columns) {
          const columnData = {
            id: column.id.toString(),
            title: column.title,
            boardId: board.id.toString(),
            order: column.order,
            createdAt: column.createdAt,
            updatedAt: column.updatedAt
          };

          await tx.column.upsert({
            where: { id: column.id.toString() },
            update: columnData,
            create: columnData
          });

          for (const task of column.tasks) {
            const { BugTask, FeatureTask } = await import('../../domain');
            
            const taskData = {
              id: task.id.toString(),
              title: task.title,
              description: task.description || null,
              estimate: task.estimate.value,
              estimateUnit: task.estimate.unit,
              priority: task.priority.value as any,
              type: task.type.toUpperCase() as any,
              assigneeId: task.assigneeId?.toString() || null,
              columnId: column.id.toString(),
              severity: task instanceof BugTask ? (task as any).severity : null,
              complexity: task instanceof FeatureTask ? (task as any).complexity : null,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt
            };

            await tx.task.upsert({
              where: { id: task.id.toString() },
              update: taskData,
              create: taskData
            });
          }
        }
      });

      return ResultFactory.success(board);
    } catch (error) {
      if (error instanceof DomainException) {
        return ResultFactory.failure(error);
      }
      throw PrismaErrorMapper.map(error);
    }
  }
}