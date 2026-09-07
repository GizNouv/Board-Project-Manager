import { Task as PrismaTask, Priority as PrismaPriority, TaskType as PrismaTaskType } from '@prisma/client';
import {
  BaseTask,
  BugTask,
  FeatureTask,
  EpicTask,
  TaskId,
  UserId,
  Priority,
  Estimate,
  TaskFactory,
} from '../../domain';
import { ValidationException } from '../../domain/exceptions';
import type { Complexity, EstimateUnit, Severity, Priority as SharedPriority } from '@/types/shared/task';
import { Mapper } from './Mapper';
import { TASK_DEFAULTS } from '@/constants/task-defaults';

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
    const priority = new Priority(prismaTask.priority as SharedPriority);
    const estimate = new Estimate(prismaTask.estimate, prismaTask.estimateUnit as EstimateUnit);

    switch (prismaTask.type) {
      case PrismaTaskType.BUG:
        return new BugTask(
          taskId,
          prismaTask.title,
          prismaTask.description || '',
          estimate,
          priority,
          assigneeId,
          (prismaTask.severity as Severity) || TASK_DEFAULTS.severity
        );

      case PrismaTaskType.FEATURE:
        return new FeatureTask(
          taskId,
          prismaTask.title,
          prismaTask.description || '',
          estimate,
          priority,
          assigneeId,
          (prismaTask.complexity as Complexity) || TASK_DEFAULTS.complexity
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
      order: 0,
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
      order: 0,
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