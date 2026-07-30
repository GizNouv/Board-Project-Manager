import { ValidationException } from '../exceptions/ValidationException';

/**
 * TaskId - Immutable value object for task identifiers
 * Demonstrates value object creation with validation
 */
export class TaskId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('Task ID cannot be empty');
    }
    if (!/^[a-zA-Z0-9-]+$/.test(value)) {
      throw new ValidationException('Task ID contains invalid characters');
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  public equals(other: TaskId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}