import { BaseTask } from './BaseTask';
import { TaskId } from '../value-objects/TaskId';
import { UserId } from '../value-objects/UserId';
import { Priority } from '../value-objects/Priority';
import { Estimate } from '../value-objects/Estimate';

/**
 * FeatureTask - Concrete implementation of BaseTask for feature development
 * Principle: Polymorphism - different behavior from BugTask
 * Principle: Inheritance - extends BaseTask
 */
export class FeatureTask extends BaseTask {
  private _complexity: 'low' | 'medium' | 'high';
  private _dependencies: TaskId[] = [];

  constructor(
    id: TaskId,
    title: string,
    description: string,
    estimate: Estimate,
    priority: Priority,
    assigneeId: UserId | null = null,
    complexity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(id, title, description, estimate, priority, assigneeId);
    this._complexity = complexity;
  }

  get complexity(): 'low' | 'medium' | 'high' {
    return this._complexity;
  }

  get dependencies(): TaskId[] {
    return [...this._dependencies];
  }

  public updateComplexity(complexity: 'low' | 'medium' | 'high'): void {
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
    // Features: points based on complexity and estimates
    const basePoints = this.estimate.toHours() / 4;
    const complexityMultiplier = {
      low: 1,
      medium: 2,
      high: 3,
    };
    return Math.round(basePoints * complexityMultiplier[this._complexity]);
  }

  public override canMoveTo(columnTitle: string): boolean {
    // Features can move through standard workflow with dependency checks
    const lowerTitle = columnTitle.toLowerCase();
    const validColumns = ['backlog', 'todo', 'in progress', 'review', 'done'];
    
    // Check if all dependencies are completed (simplified)
    const hasDependencies = this._dependencies.length > 0;
    if (hasDependencies && lowerTitle === 'done') {
      return false; // Can't complete feature with unresolved dependencies
    }
    
    return validColumns.includes(lowerTitle);
  }

  public override badgeColor(): string {
    switch (this._complexity) {
      case 'low':
        return 'blue';
      case 'medium':
        return 'purple';
      case 'high':
        return 'indigo';
      default:
        return 'gray';
    }
  }

  public override get type(): string {
    return 'feature';
  }
}