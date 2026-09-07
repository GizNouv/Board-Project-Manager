import { BaseTask } from './BaseTask';
import { TaskId } from '../value-objects/TaskId';
import { UserId } from '../value-objects/UserId';
import { Priority } from '../value-objects/Priority';
import { Estimate } from '../value-objects/Estimate';
import { TASK_DEFAULTS } from '@/constants/task-defaults';
import { Complexity, TaskComplexityEnum, TaskType, TaskTypesEnum } from '@/types';

/**
 * FeatureTask - Concrete implementation of BaseTask for feature development
 * Principle: Polymorphism - different behavior from BugTask
 * Principle: Inheritance - extends BaseTask
 */
export class FeatureTask extends BaseTask {
  private _complexity: Complexity;
  private _dependencies: TaskId[] = [];

  constructor(
    id: TaskId,
    title: string,
    description: string,
    estimate: Estimate,
    priority: Priority,
    assigneeId: UserId | null = null,
    complexity: Complexity = TASK_DEFAULTS.complexity
  ) {
    super(id, title, description, estimate, priority, assigneeId);
    this._complexity = complexity;
  }

  get complexity(): Complexity {
    return this._complexity;
  }

  get dependencies(): TaskId[] {
    return [...this._dependencies];
  }

  public updateComplexity(complexity: Complexity): void {
    this._complexity = complexity;
  }

  public addDependency(taskId: TaskId): void {
    if (!this._dependencies.some(d => d.equals(taskId))) {
      this._dependencies.push(taskId);
    }
  }

  public removeDependency(taskId: TaskId): void {
    this._dependencies = this._dependencies.filter(d => !d.equals(taskId));
  }

  public override calculateStoryPoints(): number {
    const basePoints = this.estimate.toHours() / 4;
    const complexityMultiplier = {
      [TaskComplexityEnum.LOW]: 1,
      [TaskComplexityEnum.MEDIUM]: 2,
      [TaskComplexityEnum.HIGH]: 3,
    };
    return Math.round(basePoints * complexityMultiplier[this._complexity]);
  }

  private normalizeColumnTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/-/g, '');
  }

  public override canMoveTo(columnTitle: string): boolean {
    console.log('🔵 FeatureTask.canMoveTo() called');
    console.log('  Column Title:', columnTitle);
    console.log('  Task ID:', this.id.toString());
    console.log('  Dependencies:', this._dependencies.length);

    const normalized = this.normalizeColumnTitle(columnTitle);
    console.log('  Normalized:', normalized);

    const validColumns = ['backlog', 'todo', 'inprogress', 'review', 'done'];
    console.log('  Valid Columns:', validColumns);
    console.log('  Is in valid columns?', validColumns.includes(normalized));

    const hasDependencies = this._dependencies.length > 0;
    if (hasDependencies && normalized === 'done') {
      console.log('  ❌ Has dependencies and moving to done - blocked');
      return false;
    }

    const result = validColumns.includes(normalized);
    console.log('  ✅ Final result:', result);
    return result;
  }

  public override badgeColor(): string {
    switch (this._complexity) {
      case TaskComplexityEnum.LOW:
        return 'blue';
      case TaskComplexityEnum.MEDIUM:
        return 'purple';
      case TaskComplexityEnum.HIGH:
        return 'indigo';
      default:
        return 'gray';
    }
  }

  public override get type(): TaskType {
    return TaskTypesEnum.FEATURE;
  }
}