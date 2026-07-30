import { ValidationException } from '../exceptions/ValidationException';

/**
 * UserId - Immutable value object for user identifiers
 * Demonstrates domain-specific value object creation
 */
export class UserId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('User ID cannot be empty');
    }
    if (!/^[a-zA-Z0-9-]+$/.test(value)) {
      throw new ValidationException('User ID contains invalid characters');
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  public equals(other: UserId): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}