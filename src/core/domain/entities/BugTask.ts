import { BaseTask } from './BaseTask';
import { TaskId } from '../value-objects/TaskId';
import { UserId } from '../value-objects/UserId';
import { Priority } from '../value-objects/Priority';
import { Estimate } from '../value-objects/Estimate';

/**
 * BugTask - Concrete implementation of BaseTask for bug-related work
 * Principle: Polymorphism - overrides abstract methods with specific behavior
 * Principle: Inheritance - extends BaseTask
 */
export class BugTask extends BaseTask {
  private _severity: 'minor' | 'major' | 'critical';

  constructor(
    id: TaskId,
    title: string,
    description: string,
    estimate: Estimate,
    priority: Priority,
    assigneeId: UserId | null = null,
    severity: 'minor' | 'major' | 'critical' = 'major'
  ) {
    super(id, title, description, estimate, priority, assigneeId);
    this._severity = severity;
  }

  get severity(): 'minor' | 'major' | 'critical' {
    return this._severity;
  }

  public updateSeverity(severity: 'minor' | 'major' | 'critical'): void {
    this._severity = severity;
  }

  public override calculateStoryPoints(): number {
    const basePoints = this.estimate.toHours() / 2;
    const severityMultiplier = {
      minor: 1,
      major: 2,
      critical: 4,
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

    if (this._severity === 'critical') {
      return validColumns.includes(normalized);
    }

    return validColumns.includes(normalized);
  }

  public override badgeColor(): string {
    switch (this._severity) {
      case 'minor':
        return 'green';
      case 'major':
        return 'orange';
      case 'critical':
        return 'red';
      default:
        return 'gray';
    }
  }

  public override get type(): string {
    return 'bug';
  }
}