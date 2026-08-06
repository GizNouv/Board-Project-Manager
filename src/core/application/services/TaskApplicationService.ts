import {
  ITaskRepository,
  IColumnRepository,
  IBoardRepository,
  TaskFactory,
  TaskType,
  TaskId,
  ColumnId,
  BoardId,
  UserId,
  BaseTask,
  Result,
  ResultFactory,
  DomainException,
  EntityNotFoundException,
  ValidationException,
  DuplicateEntityException
} from '../../domain';
import { CreateTaskDTO, UpdateTaskDTO, MoveTaskDTO, ReorderTaskDTO } from '../dto/TaskDTOs';

export class TaskApplicationService {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly columnRepository: IColumnRepository,
    private readonly boardRepository: IBoardRepository
  ) { }

  async createTask(dto: CreateTaskDTO): Promise<Result<BaseTask>> {
    // Load the board that contains the target column
    const boardResult = await this.boardRepository.findBoardByColumnId(new ColumnId(dto.columnId));
    if (boardResult.isFailure()) {
      return ResultFactory.failure(boardResult.error);
    }

    const board = boardResult.value;

    // Find the target column in the board
    const column = board.findColumn(new ColumnId(dto.columnId));
    if (!column) {
      return ResultFactory.failure(new EntityNotFoundException('Column', dto.columnId));
    }

    // Create the task using TaskFactory
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

    // Add task to column (validates movement)
    column.addTask(task);

    // Persist the entire board aggregate
    const saveResult = await this.boardRepository.saveBoardWithColumns(board);
    if (saveResult.isFailure()) {
      return ResultFactory.failure(saveResult.error);
    }

    return ResultFactory.success(task);
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
      return taskResult;
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

    const updateResult = await this.taskRepository.update(task);
    if (updateResult.isFailure()) {
      return updateResult;
    }

    return ResultFactory.success(task);
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