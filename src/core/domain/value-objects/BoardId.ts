import { ValidationException } from '../exceptions/ValidationException';

/**
 * BoardId - Immutable value object for board identifiers
 * Demonstrates domain-specific value object pattern
 */
export class BoardId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('Board ID cannot be empty');
    }
    if (!/^[a-zA-Z0-9-]+$/.test(value)) {
      throw new ValidationException('Board ID contains invalid characters');
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  public equals(other: BoardId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}