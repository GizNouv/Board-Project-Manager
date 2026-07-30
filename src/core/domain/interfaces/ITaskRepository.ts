import { TaskId } from '../value-objects/TaskId';
import { BaseTask } from '../entities/BaseTask';
import { ColumnId } from '../value-objects/ColumnId';
import { Result } from '../utils/Result';

/**
 * Repository interface for Task entities
 * Domain-specific operations instead of generic CRUD
 */
export interface ITaskRepository {
  findById(id: TaskId): Promise<Result<BaseTask>>;
  findAll(): Promise<Result<BaseTask[]>>;
  findByColumnId(columnId: ColumnId): Promise<Result<BaseTask[]>>;
  findByType(type: string): Promise<Result<BaseTask[]>>;
  save(task: BaseTask): Promise<Result<void>>;
  delete(id: TaskId): Promise<Result<void>>;
  update(task: BaseTask): Promise<Result<void>>;
  moveTask(taskId: TaskId, fromColumnId: ColumnId, toColumnId: ColumnId): Promise<Result<void>>;
  reorderTask(taskId: TaskId, columnId: ColumnId, position: number): Promise<Result<void>>;
}