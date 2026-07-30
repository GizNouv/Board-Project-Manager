import { DomainEvent } from './IDomainEvent';
import { Entity } from '../entities/Entity';
import { BoardId } from '../value-objects/BoardId';
import { ColumnId } from '../value-objects/ColumnId';

export class BoardCreatedEvent extends DomainEvent {
  public readonly boardId: BoardId;
  public readonly title: string;
  public readonly ownerId: string;

  constructor(aggregate: Entity, boardId: BoardId, title: string, ownerId: string) {
    super(aggregate, 'BoardCreatedEvent');
    this.boardId = boardId;
    this.title = title;
    this.ownerId = ownerId;
  }
}

export class ColumnAddedEvent extends DomainEvent {
  public readonly boardId: BoardId;
  public readonly columnId: ColumnId;
  public readonly columnTitle: string;

  constructor(aggregate: Entity, boardId: BoardId, columnId: ColumnId, columnTitle: string) {
    super(aggregate, 'ColumnAddedEvent');
    this.boardId = boardId;
    this.columnId = columnId;
    this.columnTitle = columnTitle;
  }
}

export class ColumnRemovedEvent extends DomainEvent {
  public readonly boardId: BoardId;
  public readonly columnId: ColumnId;

  constructor(aggregate: Entity, boardId: BoardId, columnId: ColumnId) {
    super(aggregate, 'ColumnRemovedEvent');
    this.boardId = boardId;
    this.columnId = columnId;
  }
}