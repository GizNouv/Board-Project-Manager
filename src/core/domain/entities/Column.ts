import { Entity } from './Entity';
import { ColumnId } from '../value-objects/ColumnId';
import { BaseTask } from './BaseTask';
import { TaskId } from '../value-objects/TaskId';
import { EntityNotFoundException, ValidationException, DuplicateEntityException } from '../exceptions/BaseExceptions';
import { DomainConstants } from '../utils/Constants';
import { TaskReorderedEvent } from '../events/TaskEvents';
import { DomainValidator } from '../validators/DomainValidator';

export class Column extends Entity<ColumnId> {
  private _title: string;
  private _boardId: string;
  private _tasks: BaseTask[] = [];
  private _order: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(id: ColumnId, title: string, boardId: string, order: number = 0) {
    super(id);
    this.validateTitle(title);
    this._title = title.trim();
    this._boardId = boardId;
    this._order = order;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length < DomainConstants.COLUMN.MIN_TITLE_LENGTH) {
      throw new ValidationException('Column title cannot be empty');
    }
    if (title.length > DomainConstants.COLUMN.MAX_TITLE_LENGTH) {
      throw new ValidationException(`Column title cannot exceed ${DomainConstants.COLUMN.MAX_TITLE_LENGTH} characters`);
    }
  }

  get title(): string { return this._title; }
  get boardId(): string { return this._boardId; }
  get tasks(): BaseTask[] { return [...this._tasks]; }
  get order(): number { return this._order; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get taskCount(): number { return this._tasks.length; }

  public updateTitle(title: string): void {
    this.validateTitle(title);
    this._title = title.trim();
    this._updatedAt = new Date();
  }

  public updateOrder(order: number): void {
    this._order = order;
    this._updatedAt = new Date();
  }

  public addTask(task: BaseTask, skipValidation: boolean = false): void {
    if (!task) {
      throw new ValidationException('Task cannot be null');
    }

    if (this._tasks.some(t => t.id.equals(task.id))) {
      throw new DuplicateEntityException('Task', task.id.toString());
    }

    if (!skipValidation) {
      if (!task.canMoveTo(this._title)) {
        throw new ValidationException(`Task cannot be moved to column "${this._title}"`);
      }
    }

    this._tasks.push(task);
    this._updatedAt = new Date();
  }

  public removeTask(taskId: TaskId): void {
    const taskIndex = this._tasks.findIndex(t => t.id.equals(taskId));
    if (taskIndex === -1) {
      throw new EntityNotFoundException('Task', taskId.toString());
    }
    this._tasks.splice(taskIndex, 1);
    this._updatedAt = new Date();
  }

  public reorderTask(taskId: TaskId, newOrder: number): void {
    const taskIndex = this._tasks.findIndex(t => t.id.equals(taskId));
    if (taskIndex === -1) {
      throw new EntityNotFoundException('Task', taskId.toString());
    }

    if (newOrder < 0 || newOrder >= this._tasks.length) {
      throw new ValidationException('Invalid position for task reordering');
    }

    if (taskIndex === newOrder) {
      return;
    }

    const [task] = this._tasks.splice(taskIndex, 1);
    this._tasks.splice(newOrder, 0, task);
    this._updatedAt = new Date();

    new TaskReorderedEvent(
      this as unknown as Entity<string>,
      taskId,
      this.id,
      newOrder
    );
  }

  public moveTaskToColumn(taskId: TaskId, targetColumn: Column): void {
    if (!targetColumn) {
      throw new ValidationException('Target column cannot be null');
    }

    const task = this.findTask(taskId);
    if (!task) {
      throw new EntityNotFoundException('Task', taskId.toString());
    }

    this.removeTask(taskId);
    targetColumn.addTask(task);
  }

  public findTask(taskId: TaskId): BaseTask | null {
    return this._tasks.find(t => t.id.equals(taskId)) || null;
  }

  public getTaskByType<T extends BaseTask>(taskType: new (...args: any[]) => T): T[] {
    return this._tasks.filter(task => task instanceof taskType) as T[];
  }

  public clearTasks(): void {
    this._tasks = [];
    this._updatedAt = new Date();
  }

  public hasTask(taskId: TaskId): boolean {
    return this._tasks.some(t => t.id.equals(taskId));
  }

  public validate(): boolean {
    return DomainValidator.validateColumn(this);
  }
}