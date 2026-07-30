export interface DomainError {
  code: string;
  message: string;
}

export abstract class DomainException extends Error implements DomainError {
  public abstract readonly code: string;

  protected constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationException extends DomainException {
  public readonly code: string = 'DOMAIN_VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
  }
}

export class EntityNotFoundException extends DomainException {
  public readonly code: string = 'ENTITY_NOT_FOUND';

  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`);
  }
}

export class DuplicateEntityException extends DomainException {
  public readonly code: string = 'DUPLICATE_ENTITY';

  constructor(entityName: string, identifier: string) {
    super(`${entityName} with identifier ${identifier} already exists`);
  }
}

export class InvalidStateTransitionException extends DomainException {
  public readonly code: string = 'INVALID_STATE_TRANSITION';

  constructor(currentState: string, targetState: string, entityName: string = 'Entity') {
    super(`Cannot transition ${entityName} from ${currentState} to ${targetState}`);
  }
}