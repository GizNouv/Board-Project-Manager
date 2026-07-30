import { ValidationException } from '../exceptions/ValidationException';

/**
 * ColumnId - Immutable value object for column identifiers
 * Demonstrates consistent value object pattern
 */
export class ColumnId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('Column ID cannot be empty');
    }
    if (!/^[a-zA-Z0-9-]+$/.test(value)) {
      throw new ValidationException('Column ID contains invalid characters');
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  public equals(other: ColumnId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}