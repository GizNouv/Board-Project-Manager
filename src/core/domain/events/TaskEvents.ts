import { DomainEvent } from './IDomainEvent';
import { Entity } from '../entities/Entity';
import { TaskId } from '../value-objects/TaskId';
import { ColumnId } from '../value-objects/ColumnId';

export class TaskCreatedEvent extends DomainEvent {
  public readonly taskId: TaskId;
  public readonly title: string;

  constructor(aggregate: Entity, taskId: TaskId, title: string) {
    super(aggregate, 'TaskCreatedEvent');
    this.taskId = taskId;
    this.title = title;
  }
}

export class TaskMovedEvent extends DomainEvent {
  public readonly taskId: TaskId;
  public readonly fromColumnId: ColumnId;
  public readonly toColumnId: ColumnId;

  constructor(
    aggregate: Entity,
    taskId: TaskId,
    fromColumnId: ColumnId,
    toColumnId: ColumnId
  ) {
    super(aggregate, 'TaskMovedEvent');
    this.taskId = taskId;
    this.fromColumnId = fromColumnId;
    this.toColumnId = toColumnId;
  }
}

export class TaskDeletedEvent extends DomainEvent {
  public readonly taskId: TaskId;

  constructor(aggregate: Entity, taskId: TaskId) {
    super(aggregate, 'TaskDeletedEvent');
    this.taskId = taskId;
  }
}

export class TaskReorderedEvent extends DomainEvent {
  public readonly taskId: TaskId;
  public readonly columnId: ColumnId;
  public readonly newPosition: number;

  constructor(
    aggregate: Entity,
    taskId: TaskId,
    columnId: ColumnId,
    newPosition: number
  ) {
    super(aggregate, 'TaskReorderedEvent');
    this.taskId = taskId;
    this.columnId = columnId;
    this.newPosition = newPosition;
  }
}