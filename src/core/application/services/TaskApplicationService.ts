import {
  ITaskRepository,
  IColumnRepository,
  TaskFactory,
  TaskType,
  TaskId,
  ColumnId,
  UserId,
  BaseTask,
  Result,
  ResultFactory,
  EntityNotFoundException,
  ValidationException,
  DuplicateEntityException
} from '../../domain';
import { CreateTaskDTO, UpdateTaskDTO, MoveTaskDTO, ReorderTaskDTO } from '../dto/TaskDTOs';

export class TaskApplicationService {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly columnRepository: IColumnRepository
  ) {}

  async createTask(dto: CreateTaskDTO): Promise<Result<BaseTask>> {
    const columnResult = await this.columnRepository.findById(new ColumnId(dto.columnId));
    if (columnResult.isFailure()) {
      return ResultFactory.failure(columnResult.error);
    }

    const task = TaskFactory.createTask(
      dto.type.toLowerCase() as TaskType,
      {
        title: dto.title,
        description: dto.description,
        estimate: dto.estimate,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        severity: dto.severity,
        complexity: dto.complexity
      }
    );

    const column = columnResult.value;
    column.addTask(task);

    const updateResult = await this.columnRepository.update(column);
    if (updateResult.isFailure()) {
      return ResultFactory.failure(updateResult.error);
    }

    return await this.taskRepository.save(task);
  }

  async getTask(id: string): Promise<Result<BaseTask>> {
    return await this.taskRepository.findById(new TaskId(id));
  }

  async getAllTasks(): Promise<Result<BaseTask[]>> {
    return await this.taskRepository.findAll();
  }

  async getTasksByColumn(columnId: string): Promise<Result<BaseTask[]>> {
    return await this.taskRepository.findByColumnId(new ColumnId(columnId));
  }

  async updateTask(id: string, dto: UpdateTaskDTO): Promise<Result<BaseTask>> {
    const taskResult = await this.taskRepository.findById(new TaskId(id));
    if (taskResult.isFailure()) {
      return ResultFactory.failure(taskResult.error);
    }

    const task = taskResult.value;

    if (dto.title !== undefined) {
      task.updateTitle(dto.title);
    }

    if (dto.description !== undefined) {
      task.updateDescription(dto.description);
    }

    if (dto.estimate) {
      const { Estimate } = require('../../domain');
      const estimate = new Estimate(dto.estimate.value, dto.estimate.unit || 'hours');
      task.updateEstimate(estimate);
    }

    if (dto.priority) {
      const { Priority } = require('../../domain');
      const priority = new Priority(dto.priority);
      task.updatePriority(priority);
    }

    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId) {
        task.assignTo(new UserId(dto.assigneeId));
      } else {
        task.unassign();
      }
    }

    return await this.taskRepository.update(task);
  }

  async moveTask(dto: MoveTaskDTO): Promise<Result<void>> {
    return await this.taskRepository.moveTask(
      new TaskId(dto.taskId),
      new ColumnId(dto.fromColumnId),
      new ColumnId(dto.toColumnId)
    );
  }

  async reorderTask(dto: ReorderTaskDTO): Promise<Result<void>> {
    return await this.taskRepository.reorderTask(
      new TaskId(dto.taskId),
      new ColumnId(dto.columnId),
      dto.position
    );
  }

  async deleteTask(id: string): Promise<Result<void>> {
    return await this.taskRepository.delete(new TaskId(id));
  }
}