import { prisma } from '../prisma/client';
import {
  IColumnRepository,
  Column,
  ColumnId,
  BoardId,
  Result,
  ResultFactory,
  EntityNotFoundException,
  ValidationException,
  DuplicateEntityException,
  DomainException
} from '../../domain';
import { ColumnMapper } from '../mappers/ColumnMapper';
import { PrismaErrorMapper } from '../errors/PrismaErrorMapper';

export class PrismaColumnRepository implements IColumnRepository {
  private columnMapper = new ColumnMapper();

  async findById(id: ColumnId): Promise<Result<Column>> {
    try {
      const column = await prisma.column.findUnique({
        where: { id: id.toString() }
      });

      if (!column) {
        return ResultFactory.failure(new EntityNotFoundException('Column', id.toString()));
      }

      return ResultFactory.success(this.columnMapper.toDomain(column));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findByBoardId(boardId: BoardId): Promise<Result<Column[]>> {
    try {
      const columns = await prisma.column.findMany({
        where: { boardId: boardId.toString() },
        orderBy: { order: 'asc' }
      });

      return ResultFactory.success(columns.map(col => this.columnMapper.toDomain(col)));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findAll(): Promise<Result<Column[]>> {
    try {
      const columns = await prisma.column.findMany({
        orderBy: { order: 'asc' }
      });

      return ResultFactory.success(columns.map(col => this.columnMapper.toDomain(col)));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async save(column: Column): Promise<Result<Column>> {
    try {
      const data = this.columnMapper.toPersistence(column);

      await prisma.column.create({
        data
      });

      return ResultFactory.success(column);
    } catch (error) {
      if (PrismaErrorMapper.isDuplicateError(error)) {
        return ResultFactory.failure(new DuplicateEntityException('Column', column.id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async delete(id: ColumnId): Promise<Result<void>> {
    try {
      await prisma.column.delete({
        where: { id: id.toString() }
      });

      return ResultFactory.success(undefined);
    } catch (error) {
      if (PrismaErrorMapper.isNotFoundError(error)) {
        return ResultFactory.failure(new EntityNotFoundException('Column', id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async update(column: Column): Promise<Result<Column>> {
    try {
      const data = this.columnMapper.toPersistenceUpdate(column);

      await prisma.column.update({
        where: { id: column.id.toString() },
        data
      });

      return ResultFactory.success(column);
    } catch (error) {
      if (PrismaErrorMapper.isNotFoundError(error)) {
        return ResultFactory.failure(new EntityNotFoundException('Column', column.id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async findColumnWithTasks(id: ColumnId): Promise<Result<Column>> {
    try {
      const column = await prisma.column.findUnique({
        where: { id: id.toString() },
        include: {
          tasks: {
            include: {
              assignee: true
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!column) {
        return ResultFactory.failure(new EntityNotFoundException('Column', id.toString()));
      }

      return ResultFactory.success(this.columnMapper.toDomainWithTasks(column));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async reorderColumn(columnId: ColumnId, newOrder: number): Promise<Result<void>> {
    try {
      const columnIdStr = columnId.toString();
      const STAGING_OFFSET = 1000;

      await prisma.$transaction(async (tx) => {
        // 1. Get the column
        const column = await tx.column.findUnique({
          where: { id: columnIdStr }
        });

        if (!column) {
          throw new EntityNotFoundException('Column', columnIdStr);
        }

        const boardId = column.boardId;

        // 2. Get all columns in this board
        const columns = await tx.column.findMany({
          where: { boardId },
          select: { id: true, order: true },
          orderBy: { order: 'asc' }
        });

        // 3. Validate new order
        if (newOrder < 0 || newOrder >= columns.length) {
          throw new ValidationException('Invalid order position');
        }

        // 4. No-op if already in correct position
        const currentIndex = columns.findIndex(c => c.id === columnIdStr);
        if (currentIndex === newOrder) {
          return;
        }

        // 5. Build desired final ordering
        const moved = columns.find(c => c.id === columnIdStr)!;
        const rest = columns.filter(c => c.id !== columnIdStr);
        const desired = [...rest];
        desired.splice(newOrder, 0, moved);

        // 6. Phase 1: Stage all columns to unique high values
        for (let i = 0; i < desired.length; i++) {
          await tx.column.update({
            where: { id: desired[i].id },
            data: { order: i + STAGING_OFFSET }
          });
        }

        // 7. Phase 2: Finalize to 0..n-1
        for (let i = 0; i < desired.length; i++) {
          await tx.column.update({
            where: { id: desired[i].id },
            data: { order: i }
          });
        }
      });

      return ResultFactory.success(undefined);
    } catch (error) {
      if (error instanceof DomainException) {
        return ResultFactory.failure(error);
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async findBoardColumns(boardId: BoardId): Promise<Result<Column[]>> {
    return this.findByBoardId(boardId);
  }
}