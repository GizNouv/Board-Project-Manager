import { prisma } from '../prisma/client';
import {
  IBoardRepository,
  Board,
  BoardId,
  UserId,
  ColumnId,
  TaskId,
  Result,
  ResultFactory,
  EntityNotFoundException,
  DuplicateEntityException,
  DomainException,
  ValidationException
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
                orderBy: { order: 'asc' }
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
                orderBy: { order: 'asc' }
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
                orderBy: { order: 'asc' }
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
                orderBy: { order: 'asc' }
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
    console.log('🔵 saveBoardWithColumns called');
    console.log('  Board ID:', board.id.toString());

    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Save board
        const boardData = this.boardMapper.toPersistence(board);
        await tx.board.upsert({
          where: { id: board.id.toString() },
          update: boardData,
          create: boardData,
        });

        // Step 2: Get existing columns with their tasks
        const existingColumns = await tx.column.findMany({
          where: { boardId: board.id.toString() },
          include: {
            tasks: true,
          },
        });

        const existingColumnIds = new Set(existingColumns.map((c) => c.id));
        const boardColumns = board.columns;

        // Step 3: Delete columns that are no longer in the board
        const columnsToDelete = existingColumns.filter(
          (c) => !boardColumns.some((bc) => bc.id.toString() === c.id)
        );
        for (const col of columnsToDelete) {
          await tx.column.delete({ where: { id: col.id } });
        }

        // Step 4: Reset column orders to avoid unique constraint conflicts
        const tempOrderOffset = -1000;
        const columnsToReset = existingColumns.filter((c) => existingColumnIds.has(c.id));
        for (let i = 0; i < columnsToReset.length; i++) {
          const col = columnsToReset[i];
          await tx.column.update({
            where: { id: col.id },
            data: { order: tempOrderOffset - i },
          });
        }

        // Step 5: Process each column
        for (const column of boardColumns) {
          const columnData = this.columnMapper.toPersistence(column);
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

          // Step 6: Get tasks for this column
          const existingTasks = await tx.task.findMany({
            where: { columnId: column.id.toString() },
          });
          const existingTaskIds = new Set(existingTasks.map((t) => t.id));
          const columnTasks = column.tasks;

          // Step 7: Delete tasks that are no longer in the column
          const tasksToDelete = existingTasks.filter(
            (t) => !columnTasks.some((bt) => bt.id.toString() === t.id)
          );
          for (const task of tasksToDelete) {
            await tx.task.delete({ where: { id: task.id } });
          }

          // Step 8: Reset existing task orders to temporary values
          const tempTaskOrderOffset = -10000;
          const tasksToReset = existingTasks.filter((t) => existingTaskIds.has(t.id));
          for (let i = 0; i < tasksToReset.length; i++) {
            const task = tasksToReset[i];
            await tx.task.update({
              where: { id: task.id },
              data: { order: tempTaskOrderOffset - i },
            });
          }

          // Step 9: Create/update tasks with correct order
          for (let taskIndex = 0; taskIndex < columnTasks.length; taskIndex++) {
            const task = columnTasks[taskIndex];
            const { BugTask, FeatureTask } = await import('../../domain');

            const taskData: any = {
              id: task.id.toString(),
              title: task.title,
              description: task.description || null,
              estimate: task.estimate.value,
              estimateUnit: task.estimate.unit,
              priority: task.priority.value as any,
              type: task.type.toUpperCase() as any,
              assigneeId: task.assigneeId?.toString() || null,
              columnId: column.id.toString(),
              order: taskIndex,
              severity: task instanceof BugTask ? (task as any).severity : null,
              complexity: task instanceof FeatureTask ? (task as any).complexity : null,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
            };

            if (existingTaskIds.has(task.id.toString())) {
              await tx.task.update({
                where: { id: task.id.toString() },
                data: taskData,
              });
            } else {
              await tx.task.create({
                data: taskData,
              });
            }
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

  // ============== NEW DEDICATED TASK PERSISTENCE METHODS ==============

  async reorderTasks(
    columnId: ColumnId,
    orderedTaskIds: string[]
  ): Promise<Result<void>> {
    console.log('🔵 reorderTasks called');
    console.log('  columnId:', columnId.toString());
    console.log('  orderedTaskIds:', orderedTaskIds);

    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Get all tasks in the column
        const existingTasks = await tx.task.findMany({
          where: { columnId: columnId.toString() },
        });

        const existingTaskIds = new Set(existingTasks.map((t) => t.id));
        const taskIdsSet = new Set(orderedTaskIds);

        // Verify all orderedTaskIds exist in the column
        for (const taskId of orderedTaskIds) {
          if (!existingTaskIds.has(taskId)) {
            throw new ValidationException(
              `Task ${taskId} does not belong to column ${columnId.toString()}`
            );
          }
        }

        // Verify no extra tasks in the column (all tasks accounted for)
        for (const task of existingTasks) {
          if (!taskIdsSet.has(task.id)) {
            throw new ValidationException(
              `Task ${task.id} is missing from the reorder list`
            );
          }
        }

        // Step 2: Temporarily assign negative order values
        const tempOrderOffset = -10000;
        for (let i = 0; i < existingTasks.length; i++) {
          const task = existingTasks[i];
          await tx.task.update({
            where: { id: task.id },
            data: { order: tempOrderOffset - i },
          });
        }

        // Step 3: Assign final order values based on array position
        for (let i = 0; i < orderedTaskIds.length; i++) {
          const taskId = orderedTaskIds[i];
          await tx.task.update({
            where: { id: taskId },
            data: { order: i },
          });
        }
      });

      console.log('  ✅ reorderTasks completed successfully');
      return ResultFactory.success(undefined);
    } catch (error) {
      console.error('  ❌ reorderTasks failed:', error);
      if (error instanceof DomainException) {
        return ResultFactory.failure(error);
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async moveTask(
    taskId: TaskId,
    sourceColumnId: ColumnId,
    targetColumnId: ColumnId,
    targetOrder: number,
    sourceTaskIds: string[],
    targetTaskIds: string[]
  ): Promise<Result<void>> {
    console.log('🔵 moveTask called');
    console.log('  taskId:', taskId.toString());
    console.log('  sourceColumnId:', sourceColumnId.toString());
    console.log('  targetColumnId:', targetColumnId.toString());
    console.log('  targetOrder:', targetOrder);
    console.log('  sourceTaskIds:', sourceTaskIds);
    console.log('  targetTaskIds:', targetTaskIds);

    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Verify task exists and belongs to source column
        const task = await tx.task.findUnique({
          where: { id: taskId.toString() },
        });

        if (!task) {
          throw new EntityNotFoundException('Task', taskId.toString());
        }

        if (task.columnId !== sourceColumnId.toString()) {
          throw new ValidationException(
            `Task ${taskId.toString()} does not belong to column ${sourceColumnId.toString()}`
          );
        }

        // Step 2: Verify the moved task is NOT in sourceTaskIds
        if (sourceTaskIds.includes(taskId.toString())) {
          throw new ValidationException(
            `Moved task ${taskId.toString()} should not be in sourceTaskIds`
          );
        }

        // Step 3: Verify the moved task IS in targetTaskIds
        if (!targetTaskIds.includes(taskId.toString())) {
          throw new ValidationException(
            `Moved task ${taskId.toString()} must be in targetTaskIds`
          );
        }

        // Step 4: Get all tasks in source column (excluding the moved task)
        const sourceExistingTasks = await tx.task.findMany({
          where: {
            columnId: sourceColumnId.toString(),
            id: { not: taskId.toString() }
          },
        });

        const sourceExistingIds = sourceExistingTasks.map(t => t.id);

        // Verify all sourceTaskIds exist in source column (excluding moved task)
        for (const id of sourceTaskIds) {
          if (!sourceExistingIds.includes(id)) {
            throw new ValidationException(`Task ${id} does not exist in source column`);
          }
        }

        // Step 5: Temporarily assign safe negative order to moved task
        await tx.task.update({
          where: { id: taskId.toString() },
          data: {
            order: -99999,
          },
        });

        // Step 6: Reindex source column (only the remaining tasks)
        const tempSourceOffset = -20000;
        for (let i = 0; i < sourceTaskIds.length; i++) {
          await tx.task.update({
            where: { id: sourceTaskIds[i] },
            data: { order: tempSourceOffset - i },
          });
        }

        // Assign final source orders
        for (let i = 0; i < sourceTaskIds.length; i++) {
          await tx.task.update({
            where: { id: sourceTaskIds[i] },
            data: { order: i },
          });
        }

        // Step 7: Move task to destination column
        await tx.task.update({
          where: { id: taskId.toString() },
          data: {
            columnId: targetColumnId.toString(),
            order: -99998,
          },
        });

        // Step 8: Reindex destination column
        // Get all tasks in destination column (including the moved task)
        const destExistingTasks = await tx.task.findMany({
          where: { columnId: targetColumnId.toString() },
        });

        const destExistingIds = destExistingTasks.map(t => t.id);

        // Verify all targetTaskIds exist in destination column
        // (including the moved task which was just moved)
        for (const id of targetTaskIds) {
          if (!destExistingIds.includes(id)) {
            throw new ValidationException(`Task ${id} does not exist in destination column`);
          }
        }

        // Temporarily assign negative orders to destination tasks
        const tempDestOffset = -30000;
        for (let i = 0; i < targetTaskIds.length; i++) {
          await tx.task.update({
            where: { id: targetTaskIds[i] },
            data: { order: tempDestOffset - i },
          });
        }

        // Assign final destination orders
        for (let i = 0; i < targetTaskIds.length; i++) {
          await tx.task.update({
            where: { id: targetTaskIds[i] },
            data: { order: i },
          });
        }
      });

      console.log('  ✅ moveTask completed successfully');
      return ResultFactory.success(undefined);
    } catch (error) {
      console.error('  ❌ moveTask failed:', error);
      if (error instanceof DomainException) {
        return ResultFactory.failure(error);
      }
      throw PrismaErrorMapper.map(error);
    }
  }
}