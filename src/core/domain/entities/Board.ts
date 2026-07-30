import { Entity } from './Entity';
import { BoardId } from '../value-objects/BoardId';
import { UserId } from '../value-objects/UserId';
import { Column } from './Column';
import { BaseTask } from './BaseTask';
import { TaskId } from '../value-objects/TaskId';
import { ColumnId } from '../value-objects/ColumnId';
import { EntityNotFoundException, ValidationException, DuplicateEntityException } from '../exceptions/BaseExceptions';
import { DomainConstants } from '../utils/Constants';
import { BoardCreatedEvent, ColumnAddedEvent, ColumnRemovedEvent } from '../events/BoardEvents';
import { TaskMovedEvent } from '../events/TaskEvents';
import { DomainValidator } from '../validators/DomainValidator';

/**
 * Aggregate Root - Board
 * Manages columns and tasks, enforcing business rules
 * Uses composition to manage child entities
 */
export class Board extends Entity<BoardId> {
  private _title: string;
  private _ownerId: UserId;
  private _columns: Column[] = [];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(id: BoardId, title: string, ownerId: UserId) {
    super(id);
    this.validateTitle(title);
    this._title = title.trim();
    this._ownerId = ownerId;
    this._createdAt = new Date();
    this._updatedAt = new Date();

    new BoardCreatedEvent(this as unknown as Entity, id, this._title, ownerId.toString());
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length < DomainConstants.BOARD.MIN_TITLE_LENGTH) {
      throw new ValidationException('Board title cannot be empty');
    }
    if (title.length > DomainConstants.BOARD.MAX_TITLE_LENGTH) {
      throw new ValidationException(`Board title cannot exceed ${DomainConstants.BOARD.MAX_TITLE_LENGTH} characters`);
    }
  }

  get title(): string { return this._title; }
  get ownerId(): UserId { return this._ownerId; }
  get columns(): Column[] { return [...this._columns]; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get columnCount(): number { return this._columns.length; }

  public updateTitle(title: string): void {
    this.validateTitle(title);
    this._title = title.trim();
    this._updatedAt = new Date();
  }

  public addColumn(column: Column): void {
    if (!column) {
      throw new ValidationException('Column cannot be null');
    }

    if (this._columns.length >= DomainConstants.BOARD.MAX_COLUMNS) {
      throw new ValidationException(`Board cannot have more than ${DomainConstants.BOARD.MAX_COLUMNS} columns`);
    }

    if (this._columns.some(c => c.id.equals(column.id))) {
      throw new DuplicateEntityException('Column', column.id.toString());
    }

    this._columns.push(column);
    this._updatedAt = new Date();
    new ColumnAddedEvent(this as unknown as Entity, this.id, column.id, column.title);
  }

  public removeColumn(columnId: ColumnId): void {
    const columnIndex = this._columns.findIndex(c => c.id.equals(columnId));
    if (columnIndex === -1) {
      throw new EntityNotFoundException('Column', columnId.toString());
    }

    const column = this._columns[columnIndex];
    column.clearTasks();
    this._columns.splice(columnIndex, 1);
    this._updatedAt = new Date();
    new ColumnRemovedEvent(this as unknown as Entity, this.id, columnId);
  }

  public findColumn(columnId: ColumnId): Column | null {
    return this._columns.find(c => c.id.equals(columnId)) || null;
  }

  public findColumnByTitle(title: string): Column | null {
    return this._columns.find(c => c.title.toLowerCase() === title.toLowerCase()) || null;
  }

  /**
   * Moves a task from one column to another within the board.
   * This is the primary method for task movement in the domain.
   * Enforces business rules and emits domain events.
   */
  public moveTask(taskId: TaskId, fromColumnId: ColumnId, toColumnId: ColumnId): void {
    const fromColumn = this.findColumn(fromColumnId);
    if (!fromColumn) {
      throw new EntityNotFoundException('Column', fromColumnId.toString());
    }

    const toColumn = this.findColumn(toColumnId);
    if (!toColumn) {
      throw new EntityNotFoundException('Column', toColumnId.toString());
    }

    const task = fromColumn.findTask(taskId);
    if (!task) {
      throw new EntityNotFoundException('Task', taskId.toString());
    }

    // Validate movement using specification
    DomainValidator.validateTaskMovement(task, fromColumn, toColumn);

    // Perform the movement using column's internal method
    fromColumn.moveTaskToColumn(taskId, toColumn);
    
    this._updatedAt = new Date();

    // Emit domain event
    new TaskMovedEvent(this as unknown as Entity, taskId, fromColumnId, toColumnId);
  }

  public findTaskInBoard(taskId: TaskId): BaseTask | null {
    for (const column of this._columns) {
      const task = column.findTask(taskId);
      if (task) {
        return task;
      }
    }
    return null;
  }

  public reorderColumn(columnId: ColumnId, newPosition: number): void {
    const columnIndex = this._columns.findIndex(c => c.id.equals(columnId));
    if (columnIndex === -1) {
      throw new EntityNotFoundException('Column', columnId.toString());
    }

    if (newPosition < 0 || newPosition >= this._columns.length) {
      throw new ValidationException('Invalid position for column reordering');
    }

    const [column] = this._columns.splice(columnIndex, 1);
    this._columns.splice(newPosition, 0, column);
    this._updatedAt = new Date();
  }

  /**
   * Reorders a task within a specific column
   */
  public reorderTaskInColumn(columnId: ColumnId, taskId: TaskId, newPosition: number): void {
    const column = this.findColumn(columnId);
    if (!column) {
      throw new EntityNotFoundException('Column', columnId.toString());
    }
    column.reorderTask(taskId, newPosition);
    this._updatedAt = new Date();
  }

  public getTotalTasks(): number {
    return this._columns.reduce((total, column) => total + column.taskCount, 0);
  }

  public getTaskByType<T extends BaseTask>(taskType: new (...args: any[]) => T): T[] {
    const tasks: T[] = [];
    for (const column of this._columns) {
      tasks.push(...column.getTaskByType(taskType));
    }
    return tasks;
  }

  public validate(): boolean {
    return DomainValidator.validateBusinessRules(this);
  }
}