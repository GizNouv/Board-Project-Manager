import { Column as PrismaColumn, Task as PrismaTask } from '@prisma/client';
import { Column, ColumnId, BaseTask } from '../../domain';
import { Mapper } from './Mapper';
import { TaskMapper } from './TaskMapper';

type PrismaColumnWithTasks = PrismaColumn & {
  tasks?: PrismaTask[];
};

/**
 * ColumnMapper - Converts between Prisma Column models and Domain Column entities
 * Supports optional task mapping for complete column hydration
 * Dependency direction: Infrastructure -> Domain
 */
export class ColumnMapper implements Mapper<Column, PrismaColumnWithTasks> {
  private taskMapper = new TaskMapper();

  public toDomain(prismaColumn: PrismaColumnWithTasks): Column {
    const column = new Column(
      new ColumnId(prismaColumn.id),
      prismaColumn.title,
      prismaColumn.boardId,
      prismaColumn.order
    );

    if (prismaColumn.tasks && prismaColumn.tasks.length > 0) {
      for (const prismaTask of prismaColumn.tasks) {
        const task = this.taskMapper.toDomain(prismaTask);
        // Skip validation when loading from database
        column.addTask(task, true);
      }
    }

    return column;
  }

  public toPersistence(column: Column): PrismaColumn {
    return {
      id: column.id.toString(),
      title: column.title,
      boardId: column.boardId,
      order: column.order,
      createdAt: column.createdAt,
      updatedAt: column.updatedAt,
    };
  }

  public toPersistenceUpdate(column: Column): Partial<PrismaColumn> {
    return {
      title: column.title,
      boardId: column.boardId,
      order: column.order,
      updatedAt: new Date(),
    };
  }

  public toDomainWithTasks(prismaColumn: PrismaColumnWithTasks): Column {
    return this.toDomain(prismaColumn);
  }
}