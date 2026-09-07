import { BaseTask } from '../entities/BaseTask';
import { BugTask } from '../entities/BugTask';
import { FeatureTask } from '../entities/FeatureTask';
import { EpicTask } from '../entities/EpicTask';
import { UserId } from '../value-objects/UserId';
import { Priority } from '../value-objects/Priority';
import { TaskTypesEnum, type Priority as SharedPriority } from '@/types/shared/task';
import { Estimate } from '../value-objects/Estimate';
import { ValidationException } from '../exceptions/BaseExceptions';
import { TASK_DEFAULTS } from '@/constants/task-defaults';
import type { BaseTaskFields, TaskFields, TaskType } from '@/types/shared/task';
import { TaskId } from '../value-objects/TaskId';

export type TaskCreationParams = TaskFields & {id: string};

/**
 * TaskFactory with registry pattern
 * Extensible factory that can register new task types
 */
export class TaskFactory {
  private static readonly creators: Map<TaskTypesEnum, (params: TaskCreationParams) => BaseTask> = new Map();

  static {
    this.registerCreator(TaskTypesEnum.BUG, (params) => {
      const id = new TaskId(params.id || crypto.randomUUID());
      const userId = params.assigneeId ? new UserId(params.assigneeId) : null;
      const priority = new Priority(params.priority as SharedPriority);
      const estimate = new Estimate(params.estimate.value, params.estimate.unit || TASK_DEFAULTS.estimateUnit);
      return new BugTask(id, params.title, params.description, estimate, priority, userId, params.severity || TASK_DEFAULTS.severity);
    });
    
    this.registerCreator(TaskTypesEnum.FEATURE, (params) => {
      const id = new TaskId(params.id || crypto.randomUUID());
      const userId = params.assigneeId ? new UserId(params.assigneeId) : null;
      const priority = new Priority(params.priority as SharedPriority);
      const estimate = new Estimate(params.estimate.value, params.estimate.unit || TASK_DEFAULTS.estimateUnit);
      return new FeatureTask(id, params.title, params.description, estimate, priority, userId, params.complexity || TASK_DEFAULTS.complexity);
    });
    
    this.registerCreator(TaskTypesEnum.EPIC, (params) => {
      const id = new TaskId(params.id || crypto.randomUUID());
      const userId = params.assigneeId ? new UserId(params.assigneeId) : null;
      const priority = new Priority(params.priority as SharedPriority);
      const estimate = new Estimate(params.estimate.value, params.estimate.unit || TASK_DEFAULTS.estimateUnit);
      return new EpicTask(id, params.title, params.description, estimate, priority, userId);
    });
  }

  public static registerCreator(type: TaskType, creator: (params: TaskCreationParams) => BaseTask): void {
    this.creators.set(type, creator);
  }

  public static createTask(type: TaskType, params: TaskCreationParams): BaseTask {
    const creator = this.creators.get(type);
    console.log('creator', creator)
    if (!creator) {
      throw new ValidationException(`Unknown task type: ${type}`);
    }
    return creator(params);
  }

  public static createBugTask(params: Omit<TaskCreationParams, 'severity'> & Pick<BaseTaskFields, 'severity'>): BugTask {
    return this.createTask(TaskTypesEnum.BUG, params) as BugTask;
  }

  public static createFeatureTask(params: Omit<TaskCreationParams, 'complexity'> & Pick<BaseTaskFields, 'complexity'>): FeatureTask {
    return this.createTask(TaskTypesEnum.FEATURE, params) as FeatureTask;
  }

  public static createEpicTask(params: Omit<TaskCreationParams, 'severity' | 'complexity'>): EpicTask {
    return this.createTask(TaskTypesEnum.EPIC, params) as EpicTask;
  }
}