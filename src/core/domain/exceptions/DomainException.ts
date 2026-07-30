/**
 * DomainException - Base exception for all domain-level errors
 * Demonstrates encapsulation by providing structured error handling
 */
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}