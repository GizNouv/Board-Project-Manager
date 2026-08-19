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
      await prisma.$transaction(async (tx) => {
        const column = await tx.column.findUnique({
          where: { id: columnId.toString() }
        });

        if (!column) {
          throw new EntityNotFoundException('Column', columnId.toString());
        }

        const columns = await tx.column.findMany({
          where: { boardId: column.boardId },
          orderBy: { order: 'asc' }
        });

        if (newOrder < 0 || newOrder >= columns.length) {
          throw new ValidationException('Invalid order position');
        }

        const currentOrder = column.order;
        if (currentOrder < newOrder) {
          await tx.column.updateMany({
            where: {
              boardId: column.boardId,
              order: {
                gt: currentOrder,
                lte: newOrder
              }
            },
            data: {
              order: { decrement: 1 },
              updatedAt: new Date()
            }
          });
        } else if (currentOrder > newOrder) {
          await tx.column.updateMany({
            where: {
              boardId: column.boardId,
              order: {
                gte: newOrder,
                lt: currentOrder
              }
            },
            data: {
              order: { increment: 1 },
              updatedAt: new Date()
            }
          });
        }

        await tx.column.update({
          where: { id: columnId.toString() },
          data: {
            order: newOrder,
            updatedAt: new Date()
          }
        });
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