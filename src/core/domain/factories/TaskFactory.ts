import { BaseTask } from '../entities/BaseTask';
import { BugTask } from '../entities/BugTask';
import { FeatureTask } from '../entities/FeatureTask';
import { EpicTask } from '../entities/EpicTask';
import { TaskId } from '../value-objects/TaskId';
import { UserId } from '../value-objects/UserId';
import { Priority, PriorityLevel } from '../value-objects/Priority';
import { Estimate } from '../value-objects/Estimate';
import { ValidationException } from '../exceptions/BaseExceptions';

export enum TaskType {
  BUG = 'bug',
  FEATURE = 'feature',
  EPIC = 'epic'
}

export interface TaskCreationParams {
  id?: string;
  title: string;
  description: string;
  estimate: {
    value: number;
    unit?: 'hours' | 'days';
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId?: string | null;
  severity?: 'minor' | 'major' | 'critical';
  complexity?: 'low' | 'medium' | 'high';
}

/**
 * TaskFactory with registry pattern
 * Extensible factory that can register new task types
 */
export class TaskFactory {
  private static readonly creators: Map<TaskType, (params: TaskCreationParams) => BaseTask> = new Map();

  static {
    this.registerCreator(TaskType.BUG, (params) => {
      const id = new TaskId(params.id || crypto.randomUUID());
      const userId = params.assigneeId ? new UserId(params.assigneeId) : null;
      const priority = new Priority(params.priority as PriorityLevel);
      const estimate = new Estimate(params.estimate.value, params.estimate.unit || 'hours');
      return new BugTask(id, params.title, params.description, estimate, priority, userId, params.severity || 'major');
    });

    this.registerCreator(TaskType.FEATURE, (params) => {
      const id = new TaskId(params.id || crypto.randomUUID());
      const userId = params.assigneeId ? new UserId(params.assigneeId) : null;
      const priority = new Priority(params.priority as PriorityLevel);
      const estimate = new Estimate(params.estimate.value, params.estimate.unit || 'hours');
      return new FeatureTask(id, params.title, params.description, estimate, priority, userId, params.complexity || 'medium');
    });

    this.registerCreator(TaskType.EPIC, (params) => {
      const id = new TaskId(params.id || crypto.randomUUID());
      const userId = params.assigneeId ? new UserId(params.assigneeId) : null;
      const priority = new Priority(params.priority as PriorityLevel);
      const estimate = new Estimate(params.estimate.value, params.estimate.unit || 'hours');
      return new EpicTask(id, params.title, params.description, estimate, priority, userId);
    });
  }

  public static registerCreator(type: TaskType, creator: (params: TaskCreationParams) => BaseTask): void {
    this.creators.set(type, creator);
  }

  public static createTask(type: TaskType, params: TaskCreationParams): BaseTask {
    const creator = this.creators.get(type);
    if (!creator) {
      throw new ValidationException(`Unknown task type: ${type}`);
    }
    return creator(params);
  }

  public static createBugTask(params: Omit<TaskCreationParams, 'severity'> & { severity?: 'minor' | 'major' | 'critical' }): BugTask {
    return this.createTask(TaskType.BUG, params) as BugTask;
  }

  public static createFeatureTask(params: Omit<TaskCreationParams, 'complexity'> & { complexity?: 'low' | 'medium' | 'high' }): FeatureTask {
    return this.createTask(TaskType.FEATURE, params) as FeatureTask;
  }

  public static createEpicTask(params: Omit<TaskCreationParams, 'severity' | 'complexity'>): EpicTask {
    return this.createTask(TaskType.EPIC, params) as EpicTask;
  }
}