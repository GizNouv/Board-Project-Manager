import { Column } from '../entities/Column';
import { BaseTask } from '../entities/BaseTask';
import { TaskId } from '../value-objects/TaskId';
import { EntityNotFoundException } from '../exceptions/EntityNotFoundException';
import { ValidationException } from '../exceptions/ValidationException';

/**
 * ColumnManager - Coordinates column operations
 * Principle: Manager pattern - handles column entity coordination
 * Principle: Composition - works with Column entities
 */
export class ColumnManager {
  private _column: Column;

  constructor(column: Column) {
    this._column = column;
  }

  get column(): Column {
    return this._column;
  }

  public updateTitle(title: string): void {
    this._column.updateTitle(title);
  }

  public addTask(task: BaseTask): void {
    this._column.addTask(task);
  }

  public removeTask(taskId: TaskId): void {
    this._column.removeTask(taskId);
  }

  public moveTaskToColumn(taskId: TaskId, targetColumn: Column): void {
    this._column.moveTaskToColumn(taskId, targetColumn);
  }

  public reorderTask(taskId: TaskId, newPosition: number): void {
    this._column.reorderTask(taskId, newPosition);
  }

  public findTask(taskId: TaskId): BaseTask | null {
    return this._column.findTask(taskId);
  }

  public getTasks(): BaseTask[] {
    return this._column.tasks;
  }

  public getTaskCount(): number {
    return this._column.taskCount;
  }

  public getTasksByType<T extends BaseTask>(taskType: new (...args: any[]) => T): T[] {
    return this._column.getTaskByType(taskType);
  }

  public clearColumn(): void {
    this._column.clearTasks();
  }

  public hasTask(taskId: TaskId): boolean {
    return this._column.hasTask(taskId);
  }

  public getColumnStats(): {
    totalTasks: number;
    columnTitle: string;
    taskTypes: Map<string, number>;
  } {
    const taskTypes = new Map<string, number>();
    const tasks = this._column.tasks;

    tasks.forEach(task => {
      const type = task.type;
      taskTypes.set(type, (taskTypes.get(type) || 0) + 1);
    });

    return {
      totalTasks: this._column.taskCount,
      columnTitle: this._column.title,
      taskTypes
    };
  }

  public validateTaskPosition(taskId: TaskId, position: number): boolean {
    if (position < 0 || position >= this._column.taskCount) {
      return false;
    }
    return this._column.hasTask(taskId);
  }

  public canMoveTaskToColumn(taskId: TaskId, targetColumn: Column): boolean {
    const task = this._column.findTask(taskId);
    if (!task) {
      return false;
    }
    return task.canMoveTo(targetColumn.title);
  }
}