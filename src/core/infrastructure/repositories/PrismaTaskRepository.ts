import { prisma } from '../prisma/client';
import {
  ITaskRepository,
  BaseTask,
  TaskId,
  ColumnId,
  Result,
  ResultFactory,
  EntityNotFoundException,
  ValidationException,
  DuplicateEntityException,
  DomainException
} from '../../domain';
import { TaskMapper } from '../mappers/TaskMapper';
import { PrismaErrorMapper } from '../errors/PrismaErrorMapper';

export class PrismaTaskRepository implements ITaskRepository {
  private taskMapper = new TaskMapper();

  async findById(id: TaskId): Promise<Result<BaseTask>> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: id.toString() },
        include: { assignee: true }
      });

      if (!task) {
        return ResultFactory.failure(new EntityNotFoundException('Task', id.toString()));
      }

      return ResultFactory.success(this.taskMapper.toDomain(task));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findAll(): Promise<Result<BaseTask[]>> {
    try {
      const tasks = await prisma.task.findMany({
        include: { assignee: true },
        orderBy: { createdAt: 'asc' }
      });

      return ResultFactory.success(tasks.map(task => this.taskMapper.toDomain(task)));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findByColumnId(columnId: ColumnId): Promise<Result<BaseTask[]>> {
    try {
      const tasks = await prisma.task.findMany({
        where: { columnId: columnId.toString() },
        include: { assignee: true },
        orderBy: { createdAt: 'asc' }
      });

      return ResultFactory.success(tasks.map(task => this.taskMapper.toDomain(task)));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findByType(type: string): Promise<Result<BaseTask[]>> {
    try {
      const tasks = await prisma.task.findMany({
        where: { type: type.toUpperCase() as any },
        include: { assignee: true },
        orderBy: { createdAt: 'asc' }
      });

      return ResultFactory.success(tasks.map(task => this.taskMapper.toDomain(task)));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async save(task: BaseTask): Promise<Result<BaseTask>> {
    try {
      const data = this.taskMapper.toPersistence(task);
      
      await prisma.task.create({
        data: {
          ...data,
          columnId: '' // Must be set by caller through column update
        }
      });

      return ResultFactory.success(task);
    } catch (error) {
      if (PrismaErrorMapper.isDuplicateError(error)) {
        return ResultFactory.failure(new DuplicateEntityException('Task', task.id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async delete(id: TaskId): Promise<Result<void>> {
    try {
      await prisma.task.delete({
        where: { id: id.toString() }
      });

      return ResultFactory.success(undefined);
    } catch (error) {
      if (PrismaErrorMapper.isNotFoundError(error)) {
        return ResultFactory.failure(new EntityNotFoundException('Task', id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async update(task: BaseTask): Promise<Result<BaseTask>> {
    try {
      const data = this.taskMapper.toPersistenceUpdate(task);

      await prisma.task.update({
        where: { id: task.id.toString() },
        data
      });

      return ResultFactory.success(task);
    } catch (error) {
      if (PrismaErrorMapper.isNotFoundError(error)) {
        return ResultFactory.failure(new EntityNotFoundException('Task', task.id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async moveTask(
    taskId: TaskId,
    fromColumnId: ColumnId,
    toColumnId: ColumnId
  ): Promise<Result<void>> {
    try {
      await prisma.$transaction(async (tx) => {
        const task = await tx.task.findUnique({
          where: { id: taskId.toString() }
        });

        if (!task) {
          throw new EntityNotFoundException('Task', taskId.toString());
        }

        if (task.columnId !== fromColumnId.toString()) {
          throw new ValidationException('Task is not in the source column');
        }

        await tx.task.update({
          where: { id: taskId.toString() },
          data: { 
            columnId: toColumnId.toString(),
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

  async reorderTask(
    taskId: TaskId,
    columnId: ColumnId,
    position: number
  ): Promise<Result<void>> {
    try {
      await prisma.$transaction(async (tx) => {
        const tasks = await tx.task.findMany({
          where: { columnId: columnId.toString() },
          orderBy: { createdAt: 'asc' }
        });

        const taskIndex = tasks.findIndex(t => t.id === taskId.toString());
        if (taskIndex === -1) {
          throw new EntityNotFoundException('Task', taskId.toString());
        }

        if (position < 0 || position >= tasks.length) {
          throw new ValidationException('Invalid position for reordering');
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

  async assignUser(taskId: TaskId, userId: string | null): Promise<Result<void>> {
    try {
      await prisma.task.update({
        where: { id: taskId.toString() },
        data: {
          assigneeId: userId,
          updatedAt: new Date()
        }
      });

      return ResultFactory.success(undefined);
    } catch (error) {
      if (PrismaErrorMapper.isNotFoundError(error)) {
        return ResultFactory.failure(new EntityNotFoundException('Task', taskId.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }
}