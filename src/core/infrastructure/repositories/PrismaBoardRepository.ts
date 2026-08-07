import { prisma } from '../prisma/client';
import {
  IBoardRepository,
  Board,
  BoardId,
  UserId,
  ColumnId,
  Result,
  ResultFactory,
  EntityNotFoundException,
  DuplicateEntityException,
  DomainException
} from '../../domain';
import { BoardMapper } from '../mappers/BoardMapper';
import { ColumnMapper } from '../mappers/ColumnMapper';
import { PrismaErrorMapper } from '../errors/PrismaErrorMapper';

export class PrismaBoardRepository implements IBoardRepository {
  private boardMapper = new BoardMapper();
  private columnMapper = new ColumnMapper();

  async findById(id: BoardId): Promise<Result<Board>> {
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

  async findBoardByColumnId(columnId: ColumnId): Promise<Result<Board>> {
    try {
      const column = await prisma.column.findUnique({
        where: { id: columnId.toString() },
        select: { boardId: true }
      });

      if (!column) {
        return ResultFactory.failure(new EntityNotFoundException('Column', columnId.toString()));
      }

      return this.findBoardWithColumns(new BoardId(column.boardId));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findByUserId(userId: UserId): Promise<Result<Board[]>> {
    try {
      const boards = await prisma.board.findMany({
        where: { ownerId: userId.toString() },
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
        },
        orderBy: { createdAt: 'desc' }
      });

      return ResultFactory.success(boards.map(board => this.boardMapper.toDomainWithColumns(board)));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findAll(): Promise<Result<Board[]>> {
    try {
      const boards = await prisma.board.findMany({
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
        },
        orderBy: { createdAt: 'desc' }
      });

      return ResultFactory.success(boards.map(board => this.boardMapper.toDomainWithColumns(board)));
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

  // In saveBoardWithColumns method, add logs:

  async saveBoardWithColumns(board: Board): Promise<Result<Board>> {
    console.log('🔵 saveBoardWithColumns called');
    console.log('  Board ID:', board.id.toString());
    console.log('  Columns:', board.columns.map(c => ({
      id: c.id.toString(),
      title: c.title,
      order: c.order,
      taskCount: c.tasks.length
    })));

    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Save board
        const boardData = this.boardMapper.toPersistence(board);
        console.log('  📝 Upserting board:', boardData);
        await tx.board.upsert({
          where: { id: board.id.toString() },
          update: boardData,
          create: boardData,
        });

        // Step 2: Get existing columns
        const existingColumns = await tx.column.findMany({
          where: { boardId: board.id.toString() },
        });
        console.log('  📋 Existing columns:', existingColumns.map(c => ({ id: c.id, order: c.order, title: c.title })));

        const existingColumnIds = new Set(existingColumns.map((c) => c.id));
        const boardColumns = board.columns;

        // Step 3: Delete columns that are no longer in the board
        const columnsToDelete = existingColumns.filter(
          (c) => !boardColumns.some((bc) => bc.id.toString() === c.id)
        );
        console.log('  🗑️ Columns to delete:', columnsToDelete.map(c => c.id));
        for (const col of columnsToDelete) {
          await tx.column.delete({ where: { id: col.id } });
        }

        // Step 4: First, reset all column orders to avoid unique constraint conflicts
        // Set all existing columns to a temporary negative order
        const tempOrderOffset = -1000;
        for (let i = 0; i < existingColumns.length; i++) {
          const col = existingColumns[i];
          await tx.column.update({
            where: { id: col.id },
            data: { order: tempOrderOffset - i },
          });
        }

        // Step 5: Now update/create columns with the correct order
        for (const column of boardColumns) {
          const columnData = this.columnMapper.toPersistence(column);
          console.log(`  📝 ${existingColumnIds.has(column.id.toString()) ? 'Updating' : 'Creating'} column:`, {
            id: column.id.toString(),
            title: column.title,
            order: column.order
          });

          if (existingColumnIds.has(column.id.toString())) {
            await tx.column.update({
              where: { id: column.id.toString() },
              data: columnData,
            });
          } else {
            await tx.column.create({
              data: columnData,
            });
          }

          // Save tasks for this column
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
              updatedAt: task.updatedAt,
            };

            await tx.task.upsert({
              where: { id: task.id.toString() },
              update: taskData,
              create: taskData,
            });
          }
        }
      });

      console.log('  ✅ Transaction completed successfully');
      return ResultFactory.success(board);
    } catch (error) {
      console.error('  ❌ Transaction failed:', error);
      if (error instanceof DomainException) {
        return ResultFactory.failure(error);
      }
      throw PrismaErrorMapper.map(error);
    }
  }
}