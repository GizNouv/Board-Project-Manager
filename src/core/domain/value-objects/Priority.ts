import { ValidationException } from '../exceptions/ValidationException';

/**
 * Priority - Immutable value object representing task priority
 * Demonstrates encapsulation and validation in constructors
 */
export enum PriorityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class Priority {
  private readonly _value: PriorityLevel;

  constructor(value: PriorityLevel) {
    if (!Object.values(PriorityLevel).includes(value)) {
      throw new ValidationException(`Invalid priority level: ${value}`);
    }
    this._value = value;
  }

  get value(): PriorityLevel {
    return this._value;
  }

  public isHigherThan(other: Priority): boolean {
    const order = [PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH, PriorityLevel.CRITICAL];
    return order.indexOf(this._value) > order.indexOf(other._value);
  }

  public isLowerThan(other: Priority): boolean {
    const order = [PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH, PriorityLevel.CRITICAL];
    return order.indexOf(this._value) < order.indexOf(other._value);
  }

  public equals(other: Priority): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}