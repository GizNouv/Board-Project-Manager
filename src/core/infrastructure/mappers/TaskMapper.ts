import { Task as PrismaTask, Priority as PrismaPriority, TaskType as PrismaTaskType } from '@prisma/client';
import {
  BaseTask,
  BugTask,
  FeatureTask,
  EpicTask,
  TaskId,
  UserId,
  Priority,
  PriorityLevel,
  Estimate,
  TaskFactory,
  TaskType
} from '../../domain';
import { ValidationException } from '../../domain/exceptions';
import { Mapper } from './Mapper';

type PrismaTaskWithRelations = PrismaTask & {
  assignee?: { id: string } | null;
  comments?: Array<{ id: string }>;
  attachments?: Array<{ id: string }>;
};

/**
 * TaskMapper - Converts between Prisma Task models and Domain Task entities
 * Uses TaskFactory to create appropriate task types (Bug, Feature, Epic)
 * Dependency direction: Infrastructure -> Domain
 */
export class TaskMapper implements Mapper<BaseTask, PrismaTaskWithRelations> {
  public toDomain(prismaTask: PrismaTaskWithRelations): BaseTask {
    const taskId = new TaskId(prismaTask.id);
    const assigneeId = prismaTask.assignee ? new UserId(prismaTask.assignee.id) : null;
    const priority = new Priority(prismaTask.priority as PriorityLevel);
    const estimate = new Estimate(prismaTask.estimate, prismaTask.estimateUnit as 'hours' | 'days');

    switch (prismaTask.type) {
      case PrismaTaskType.BUG:
        return new BugTask(
          taskId,
          prismaTask.title,
          prismaTask.description || '',
          estimate,
          priority,
          assigneeId,
          (prismaTask.severity as 'minor' | 'major' | 'critical') || 'major'
        );

      case PrismaTaskType.FEATURE:
        return new FeatureTask(
          taskId,
          prismaTask.title,
          prismaTask.description || '',
          estimate,
          priority,
          assigneeId,
          (prismaTask.complexity as 'low' | 'medium' | 'high') || 'medium'
        );

      case PrismaTaskType.EPIC:
        return new EpicTask(
          taskId,
          prismaTask.title,
          prismaTask.description || '',
          estimate,
          priority,
          assigneeId
        );

      default:
        throw new ValidationException(`Unknown task type: ${prismaTask.type}`);
    }
  }

  public toPersistence(task: BaseTask): PrismaTask {
    const baseData = {
      id: task.id.toString(),
      title: task.title,
      description: task.description || null,
      estimate: task.estimate.value,
      estimateUnit: task.estimate.unit,
      priority: task.priority.value as PrismaPriority,
      type: task.type.toUpperCase() as PrismaTaskType,
      assigneeId: task.assigneeId?.toString() || null,
      columnId: '', // Must be set by repository
      severity: null as string | null,
      complexity: null as string | null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    if (task instanceof BugTask) {
      return {
        ...baseData,
        severity: task.severity,
      } as PrismaTask;
    }

    if (task instanceof FeatureTask) {
      return {
        ...baseData,
        complexity: task.complexity,
      } as PrismaTask;
    }

    if (task instanceof EpicTask) {
      return baseData as PrismaTask;
    }

    throw new ValidationException(`Unknown task type for mapping: ${task.constructor.name}`);
  }

  public toPersistenceUpdate(task: BaseTask): Partial<PrismaTask> {
    const baseData = {
      title: task.title,
      description: task.description || null,
      estimate: task.estimate.value,
      estimateUnit: task.estimate.unit,
      priority: task.priority.value as PrismaPriority,
      type: task.type.toUpperCase() as PrismaTaskType,
      assigneeId: task.assigneeId?.toString() || null,
      severity: null as string | null,
      complexity: null as string | null,
      updatedAt: new Date(),
    };

    if (task instanceof BugTask) {
      return {
        ...baseData,
        severity: task.severity,
      };
    }

    if (task instanceof FeatureTask) {
      return {
        ...baseData,
        complexity: task.complexity,
      };
    }

    if (task instanceof EpicTask) {
      return baseData;
    }

    throw new ValidationException(`Unknown task type for update mapping: ${task.constructor.name}`);
  }
}