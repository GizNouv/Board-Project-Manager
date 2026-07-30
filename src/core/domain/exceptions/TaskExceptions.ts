import { DomainException } from './BaseExceptions';

export class TaskMovementException extends DomainException {
  public readonly code: string = 'TASK_MOVEMENT_ERROR';

  constructor(message: string) {
    super(message);
  }
}

export class TaskAssignmentException extends DomainException {
  public readonly code: string = 'TASK_ASSIGNMENT_ERROR';

  constructor(message: string) {
    super(message);
  }
}

export class TaskDependencyException extends DomainException {
  public readonly code: string = 'TASK_DEPENDENCY_ERROR';

  constructor(message: string) {
    super(message);
  }
}