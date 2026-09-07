import { BaseTask } from './BaseTask';
import { TaskId } from '../value-objects/TaskId';
import { UserId } from '../value-objects/UserId';
import { Priority } from '../value-objects/Priority';
import { Estimate } from '../value-objects/Estimate';
import { TASK_DEFAULTS } from '@/constants/task-defaults';
import { Severity, TaskSeverityEnum, TaskType, TaskTypesEnum } from '@/types';

/**
 * BugTask - Concrete implementation of BaseTask for bug-related work
 * Principle: Polymorphism - overrides abstract methods with specific behavior
 * Principle: Inheritance - extends BaseTask
 */
export class BugTask extends BaseTask {
  private _severity: Severity;

  constructor(
    id: TaskId,
    title: string,
    description: string,
    estimate: Estimate,
    priority: Priority,
    assigneeId: UserId | null = null,
    severity: Severity = TASK_DEFAULTS.severity
  ) {
    super(id, title, description, estimate, priority, assigneeId);
    this._severity = severity;
  }

  get severity(): Severity {
    return this._severity;
  }

  public updateSeverity(severity: Severity): void {
    this._severity = severity;
  }

  public override calculateStoryPoints(): number {
    const basePoints = this.estimate.toHours() / 2;
    const severityMultiplier = {
      [TaskSeverityEnum.MINOR]: 1,
      [TaskSeverityEnum.MAJOR]: 2,
      [TaskSeverityEnum.CRITICAL]: 4,
    };
    return Math.round(basePoints * severityMultiplier[this._severity]);
  }

  private normalizeColumnTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/-/g, '');
  }

  public override canMoveTo(columnTitle: string): boolean {
    const normalized = this.normalizeColumnTitle(columnTitle);
    const validColumns = ['todo', 'inprogress', 'review', 'done'];

    if (this._severity === TaskSeverityEnum.CRITICAL) {
      return validColumns.includes(normalized);
    }

    return validColumns.includes(normalized);
  }

  public override badgeColor(): string {
    switch (this._severity) {
      case TaskSeverityEnum.MINOR:
        return 'green';
      case TaskSeverityEnum.MAJOR:
        return 'orange';
      case TaskSeverityEnum.CRITICAL:
        return 'red';
      default:
        return 'gray';
    }
  }

  public override get type(): TaskType {
    return TaskTypesEnum.BUG;
  }
}