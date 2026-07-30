import { BaseTask } from '../entities/BaseTask';
import { Column } from '../entities/Column';
import { Board } from '../entities/Board';
import { User } from '../entities/User';
import { Priority } from '../value-objects/Priority';
import { Estimate } from '../value-objects/Estimate';
import { ValidationException } from '../exceptions/ValidationException';

/**
 * DomainValidator - Pure domain validation logic
 * Principle: Single Responsibility - handles all domain validation
 * Principle: Encapsulation - validation rules are encapsulated here
 */
export class DomainValidator {
  /**
   * Validate task state
   */
  public static validateTask(task: BaseTask): boolean {
    if (!task) {
      throw new ValidationException('Task cannot be null');
    }

    // Validate title
    if (!task.title || task.title.trim().length === 0) {
      throw new ValidationException('Task title cannot be empty');
    }

    if (task.title.length > 200) {
      throw new ValidationException('Task title cannot exceed 200 characters');
    }

    // Validate estimate
    if (!task.estimate) {
      throw new ValidationException('Task estimate is required');
    }

    // Validate priority
    if (!task.priority) {
      throw new ValidationException('Task priority is required');
    }

    return true;
  }

  /**
   * Validate column state
   */
  public static validateColumn(column: Column): boolean {
    if (!column) {
      throw new ValidationException('Column cannot be null');
    }

    if (!column.title || column.title.trim().length === 0) {
      throw new ValidationException('Column title cannot be empty');
    }

    if (!column.boardId || column.boardId.trim().length === 0) {
      throw new ValidationException('Column must belong to a board');
    }

    // Validate column has unique task IDs
    const taskIds = column.tasks.map(t => t.id.toString());
    const uniqueIds = new Set(taskIds);
    if (taskIds.length !== uniqueIds.size) {
      throw new ValidationException('Column contains duplicate tasks');
    }

    return true;
  }

  /**
   * Validate board state
   */
  public static validateBoard(board: Board): boolean {
    if (!board) {
      throw new ValidationException('Board cannot be null');
    }

    if (!board.title || board.title.trim().length === 0) {
      throw new ValidationException('Board title cannot be empty');
    }

    if (board.title.length > 100) {
      throw new ValidationException('Board title cannot exceed 100 characters');
    }

    // Validate board has at least one column (optional constraint)
    if (board.columnCount === 0) {
      throw new ValidationException('Board must have at least one column');
    }

    return true;
  }

  /**
   * Validate user state
   */
  public static validateUser(user: User): boolean {
    if (!user) {
      throw new ValidationException('User cannot be null');
    }

    if (!user.name || user.name.trim().length === 0) {
      throw new ValidationException('User name cannot be empty');
    }

    if (user.name.length > 100) {
      throw new ValidationException('User name cannot exceed 100 characters');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      throw new ValidationException('Invalid email address format');
    }

    return true;
  }

  /**
   * Validate task movement between columns
   */
  public static validateTaskMovement(task: BaseTask, fromColumn: Column, toColumn: Column): boolean {
    if (!task) {
      throw new ValidationException('Task cannot be null');
    }

    if (!fromColumn) {
      throw new ValidationException('Source column cannot be null');
    }

    if (!toColumn) {
      throw new ValidationException('Destination column cannot be null');
    }

    // Check if task is in source column
    if (!fromColumn.hasTask(task.id)) {
      throw new ValidationException('Task not found in source column');
    }

    // Check if task can be moved to destination
    if (!task.canMoveTo(toColumn.title)) {
      throw new ValidationException(`Task cannot be moved to column "${toColumn.title}"`);
    }

    // Check for circular movement (optional)
    if (fromColumn.id.equals(toColumn.id)) {
      throw new ValidationException('Task cannot be moved to the same column');
    }

    return true;
  }

  /**
   * Validate priority levels
   */
  public static validatePriority(priority: Priority): boolean {
    if (!priority) {
      throw new ValidationException('Priority cannot be null');
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(priority.value)) {
      throw new ValidationException(`Invalid priority value: ${priority.value}`);
    }

    return true;
  }

  /**
   * Validate estimate values
   */
  public static validateEstimate(estimate: Estimate): boolean {
    if (!estimate) {
      throw new ValidationException('Estimate cannot be null');
    }

    if (estimate.value < 0) {
      throw new ValidationException('Estimate cannot be negative');
    }

    if (estimate.unit === 'hours' && estimate.value > 100) {
      throw new ValidationException('Estimate cannot exceed 100 hours');
    }

    if (estimate.unit === 'days' && estimate.value > 20) {
      throw new ValidationException('Estimate cannot exceed 20 days');
    }

    return true;
  }

  /**
   * Validate business rules for boards
   */
  public static validateBusinessRules(board: Board): boolean {
    // Rule: A board cannot have more than 20 columns
    if (board.columnCount > 20) {
      throw new ValidationException('Board cannot have more than 20 columns');
    }

    // Rule: Total tasks per board cannot exceed 1000
    const totalTasks = board.getTotalTasks();
    if (totalTasks > 1000) {
      throw new ValidationException('Board cannot contain more than 1000 tasks');
    }

    // Rule: Column titles must be unique
    const titles = board.columns.map(c => c.title.toLowerCase());
    const uniqueTitles = new Set(titles);
    if (titles.length !== uniqueTitles.size) {
      throw new ValidationException('Column titles must be unique');
    }

    return true;
  }

  /**
   * Validate task dependencies for features
   */
  public static validateTaskDependencies(task: BaseTask, allTasks: BaseTask[]): boolean {
    // This would check if all task dependencies exist in the system
    // Simplified implementation - actual implementation would depend on task type
    return true;
  }
}