import { DomainException } from './DomainException';

/**
 * EntityNotFoundException - Thrown when an entity cannot be found
 * Demonstrates domain-specific error handling
 */
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id ${id} not found`);
  }
}