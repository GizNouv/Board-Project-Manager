import { BaseTask } from './BaseTask';
import { TaskId } from '../value-objects/TaskId';
import { UserId } from '../value-objects/UserId';
import { Priority } from '../value-objects/Priority';
import { Estimate } from '../value-objects/Estimate';

/**
 * EpicTask - Concrete implementation for large-scale initiatives
 * Principle: Polymorphism - significantly different behavior from other task types
 * Principle: Inheritance - extends BaseTask
 */
export class EpicTask extends BaseTask {
  private _subTasks: TaskId[] = [];
  private _progress: number = 0;
  private _milestones: string[] = [];

  constructor(
    id: TaskId,
    title: string,
    description: string,
    estimate: Estimate,
    priority: Priority,
    assigneeId: UserId | null = null
  ) {
    super(id, title, description, estimate, priority, assigneeId);
  }

  get subTasks(): TaskId[] {
    return [...this._subTasks];
  }

  get progress(): number {
    return this._progress;
  }

  get milestones(): string[] {
    return [...this._milestones];
  }

  public addSubTask(taskId: TaskId): void {
    if (!this._subTasks.some(t => t.equals(taskId))) {
      this._subTasks.push(taskId);
      this.updateProgress();
    }
  }

  public removeSubTask(taskId: TaskId): void {
    this._subTasks = this._subTasks.filter(t => !t.equals(taskId));
    this.updateProgress();
  }

  public addMilestone(milestone: string): void {
    if (milestone && milestone.trim().length > 0) {
      this._milestones.push(milestone.trim());
    }
  }

  public updateProgress(completed: number = 0): void {
    this._progress = Math.min(100, Math.max(0, completed));
  }

  public override calculateStoryPoints(): number {
    const basePoints = this.estimate.toHours() / 6;
    const subTaskBonus = this._subTasks.length * 2;
    return Math.round(basePoints + subTaskBonus);
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
    const validColumns = ['backlog', 'planning', 'inprogress', 'completed'];
    return validColumns.includes(normalized);
  }

  public override badgeColor(): string {
    return 'amber';
  }

  public override get type(): string {
    return 'epic';
  }
}