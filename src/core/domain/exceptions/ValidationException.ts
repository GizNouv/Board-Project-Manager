import { DomainException } from './DomainException';

/**
 * ValidationException - Thrown when domain validation fails
 * Demonstrates specific exception types for different error scenarios
 */
export class ValidationException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}