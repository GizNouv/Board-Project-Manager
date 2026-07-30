import { DomainException } from './DomainException';

/**
 * TaskMovementException - Thrown when task movement violates domain rules
 * Demonstrates business-specific exception handling
 */
export class TaskMovementException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}