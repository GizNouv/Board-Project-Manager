import { Entity } from './Entity';
import { TaskId } from '../value-objects/TaskId';
import { UserId } from '../value-objects/UserId';
import { Priority } from '../value-objects/Priority';
import { Estimate } from '../value-objects/Estimate';
import { ValidationException } from '../exceptions/BaseExceptions';
import { DomainConstants } from '../utils/Constants';
import { TaskCreatedEvent } from '../events/TaskEvents';

/**
 * Abstract aggregate entity representing a task
 * Implements encapsulation with private fields and getters
 */
export abstract class BaseTask extends Entity<TaskId> {
  private _title: string;
  private _description: string;
  private _estimate: Estimate;
  private _priority: Priority;
  private _assigneeId: UserId | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  protected constructor(
    id: TaskId,
    title: string,
    description: string,
    estimate: Estimate,
    priority: Priority,
    assigneeId: UserId | null = null,
    emitEvent: boolean = true
  ) {
    super(id);
    this.validateTitle(title);
    this._title = title.trim();
    this._description = description?.trim() || '';
    this._estimate = estimate;
    this._priority = priority;
    this._assigneeId = assigneeId;
    this._createdAt = new Date();
    this._updatedAt = new Date();

    if (emitEvent) {
      new TaskCreatedEvent(this as unknown as Entity<string | number>, id, title);
    }
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length < DomainConstants.TASK.MIN_TITLE_LENGTH) {
      throw new ValidationException('Task title cannot be empty');
    }
    if (title.length > DomainConstants.TASK.MAX_TITLE_LENGTH) {
      throw new ValidationException(`Task title cannot exceed ${DomainConstants.TASK.MAX_TITLE_LENGTH} characters`);
    }
  }

  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get estimate(): Estimate { return this._estimate; }
  get priority(): Priority { return this._priority; }
  get assigneeId(): UserId | null { return this._assigneeId; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  public updateTitle(title: string): void {
    this.validateTitle(title);
    this._title = title.trim();
    this._updatedAt = new Date();
  }

  public updateDescription(description: string): void {
    this._description = description?.trim() || '';
    this._updatedAt = new Date();
  }

  public updateEstimate(estimate: Estimate): void {
    this._estimate = estimate;
    this._updatedAt = new Date();
  }

  public updatePriority(priority: Priority): void {
    this._priority = priority;
    this._updatedAt = new Date();
  }

  public assignTo(userId: UserId): void {
    this._assigneeId = userId;
    this._updatedAt = new Date();
  }

  public unassign(): void {
    this._assigneeId = null;
    this._updatedAt = new Date();
  }

  public abstract calculateStoryPoints(): number;
  public abstract canMoveTo(columnTitle: string): boolean;
  public abstract badgeColor(): string;
  public abstract get type(): string;
}