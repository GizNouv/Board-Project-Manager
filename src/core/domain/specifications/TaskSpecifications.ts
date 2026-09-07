import { BaseSpecification } from './ISpecification';
import { BaseTask } from '../entities/BaseTask';
import { Column } from '../entities/Column';
import { Priority } from '../value-objects/Priority';
import type { Priority as SharedPriority } from '@/types/shared/task';
import { PRIORITIES, TaskPrioritiesEnum } from '@/types/shared/task';
import { Estimate } from '../value-objects/Estimate';

/**
 * Specification for task movement validation
 */
export class TaskMovableSpecification extends BaseSpecification<BaseTask> {
  private readonly targetColumn: Column;

  constructor(targetColumn: Column) {
    super();
    this.targetColumn = targetColumn;
  }

  public isSatisfiedBy(task: BaseTask): boolean {
    return task.canMoveTo(this.targetColumn.title);
  }
}

/**
 * Specification for estimate range validation
 */
export class EstimateRangeSpecification extends BaseSpecification<Estimate> {
  private readonly minHours: number;
  private readonly maxHours: number;

  constructor(minHours: number = 0, maxHours: number = 100) {
    super();
    this.minHours = minHours;
    this.maxHours = maxHours;
  }

  public isSatisfiedBy(estimate: Estimate): boolean {
    const hours = estimate.toHours();
    return hours >= this.minHours && hours <= this.maxHours;
  }
}

/**
 * Specification for priority change validation
 */
export class PriorityChangeSpecification extends BaseSpecification<Priority> {
  private readonly maxPriority: SharedPriority;

  constructor(maxPriority: SharedPriority = TaskPrioritiesEnum.CRITICAL) {
    super();
    this.maxPriority = maxPriority;
  }

  public isSatisfiedBy(priority: Priority): boolean {
    const order = PRIORITIES;
    const maxIndex = order.indexOf(this.maxPriority);
    const currentIndex = order.indexOf(priority.value);
    return currentIndex <= maxIndex;
  }
}

/**
 * Specification for task assignment validation
 */
export class TaskAssigneeSpecification extends BaseSpecification<BaseTask> {
  public isSatisfiedBy(task: BaseTask): boolean {
    return task.assigneeId !== null;
  }
}

/**
 * Specification for task type validation
 */
export class TaskTypeSpecification extends BaseSpecification<BaseTask> {
  private readonly allowedTypes: string[];

  constructor(allowedTypes: string[]) {
    super();
    this.allowedTypes = allowedTypes;
  }

  public isSatisfiedBy(task: BaseTask): boolean {
    return this.allowedTypes.includes(task.type);
  }
}