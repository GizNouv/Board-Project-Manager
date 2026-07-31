// Entities
export { Entity } from './entities/Entity';
export { BaseTask } from './entities/BaseTask';
export { BugTask } from './entities/BugTask';
export { FeatureTask } from './entities/FeatureTask';
export { EpicTask } from './entities/EpicTask';
export { Column } from './entities/Column';
export { Board } from './entities/Board';
export { User } from './entities/User';

// Value Objects
export { Priority, PriorityLevel } from './value-objects/Priority';
export { Estimate } from './value-objects/Estimate';
export { TaskId } from './value-objects/TaskId';
export { UserId } from './value-objects/UserId';
export { ColumnId } from './value-objects/ColumnId';
export { BoardId } from './value-objects/BoardId';

// Interfaces
export type { ITaskRepository } from './interfaces/ITaskRepository';
export type { IUserRepository } from './interfaces/IUserRepository';
export type { IColumnRepository } from './interfaces/IColumnRepository';
export type { IBoardRepository } from './interfaces/IBoardRepository';

// Exceptions
export type {DomainError} from './exceptions';
export {
  DomainException,
  ValidationException,
  EntityNotFoundException,
  DuplicateEntityException,
  InvalidStateTransitionException,
  TaskMovementException,
  TaskAssignmentException,
  TaskDependencyException
} from './exceptions';

// Events
export type {IDomainEvent} from './events';
export {
  DomainEvent,
  TaskCreatedEvent,
  TaskMovedEvent,
  TaskDeletedEvent,
  TaskReorderedEvent,
  BoardCreatedEvent,
  ColumnAddedEvent,
  ColumnRemovedEvent
} from './events';

// Specifications
export type {
  ISpecification
} from './specifications/ISpecification';
export {
  BaseSpecification,
  AndSpecification,
  OrSpecification,
  NotSpecification,
  TaskMovableSpecification,
  EstimateRangeSpecification,
  PriorityChangeSpecification,
  TaskAssigneeSpecification,
  TaskTypeSpecification
} from './specifications';

// Managers
export { BoardManager } from './managers/BoardManager';
export { ColumnManager } from './managers/ColumnManager';

// Factories
export { TaskFactory, TaskType, type TaskCreationParams } from './factories/TaskFactory';

// Validators
export { DomainValidator } from './validators/DomainValidator';

// Utils 
export type {Result} from './utils/Result';
export { Success, Failure, ResultFactory } from './utils/Result';
export { DomainConstants } from './utils/Constants';