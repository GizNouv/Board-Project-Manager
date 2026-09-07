import { ValidationException } from '../exceptions/ValidationException';
import type { Priority as PriorityType } from '@/types/shared/task';
import { PRIORITIES } from '@/types/shared/task';

/**
 * Priority - Immutable value object representing task priority
 * Demonstrates encapsulation and validation in constructors
 * Uses shared type from @/types/shared/task as single source of truth
 */
export class Priority {
  private readonly _value: PriorityType;

  constructor(value: PriorityType) {
    if (!PRIORITIES.includes(value)) {
      throw new ValidationException(`Invalid priority level: ${value}`);
    }
    this._value = value;
  }

  get value(): PriorityType {
    return this._value;
  }

  public isHigherThan(other: Priority): boolean {
    return PRIORITIES.indexOf(this._value) > PRIORITIES.indexOf(other._value);
  }

  public isLowerThan(other: Priority): boolean {
    return PRIORITIES.indexOf(this._value) < PRIORITIES.indexOf(other._value);
  }

  public equals(other: Priority): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}