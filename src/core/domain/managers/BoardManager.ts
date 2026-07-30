import { Board } from '../entities/Board';
import { Column } from '../entities/Column';
import { BaseTask } from '../entities/BaseTask';
import { BoardId } from '../value-objects/BoardId';
import { ColumnId } from '../value-objects/ColumnId';
import { TaskId } from '../value-objects/TaskId';
import { UserId } from '../value-objects/UserId';
import { EntityNotFoundException } from '../exceptions/EntityNotFoundException';
import { ValidationException } from '../exceptions/ValidationException';

/**
 * BoardManager - Coordinates board operations
 * Principle: Manager pattern - coordinates entities without database access
 * Principle: Encapsulation - manages board state changes
 */
export class BoardManager {
  private _board: Board;

  constructor(board: Board) {
    this._board = board;
  }

  get board(): Board {
    return this._board;
  }

  public updateBoardTitle(title: string): void {
    this._board.updateTitle(title);
  }

  public addColumn(column: Column): void {
    this._board.addColumn(column);
  }

  public removeColumn(columnId: ColumnId): void {
    this._board.removeColumn(columnId);
  }

  public reorderColumn(columnId: ColumnId, newPosition: number): void {
    this._board.reorderColumn(columnId, newPosition);
  }

  public moveTask(taskId: TaskId, fromColumnId: ColumnId, toColumnId: ColumnId): void {
    this._board.moveTask(taskId, fromColumnId, toColumnId);
  }

  public reorderTaskInColumn(columnId: ColumnId, taskId: TaskId, newPosition: number): void {
    const column = this._board.findColumn(columnId);
    if (!column) {
      throw new EntityNotFoundException('Column', columnId.toString());
    }
    column.reorderTask(taskId, newPosition);
  }

  public getColumnTasks(columnId: ColumnId): BaseTask[] {
    const column = this._board.findColumn(columnId);
    if (!column) {
      throw new EntityNotFoundException('Column', columnId.toString());
    }
    return column.tasks;
  }

  public getTaskById(taskId: TaskId): BaseTask | null {
    return this._board.findTaskInBoard(taskId);
  }

  public getTotalTasksCount(): number {
    return this._board.getTotalTasks();
  }

  public getColumnCount(): number {
    return this._board.columnCount;
  }

  public getColumns(): Column[] {
    return this._board.columns;
  }

  public getBoardStats(): {
    totalTasks: number;
    totalColumns: number;
    columns: { title: string; taskCount: number }[];
  } {
    const columns = this._board.columns.map(column => ({
      title: column.title,
      taskCount: column.taskCount
    }));

    return {
      totalTasks: this._board.getTotalTasks(),
      totalColumns: this._board.columnCount,
      columns
    };
  }

  public validateBoardStructure(): boolean {
    // Check if board has at least one column
    if (this._board.columnCount === 0) {
      return false;
    }

    // Check for duplicate column titles
    const titles = this._board.columns.map(c => c.title.toLowerCase());
    const uniqueTitles = new Set(titles);
    if (titles.length !== uniqueTitles.size) {
      return false;
    }

    return true;
  }
}