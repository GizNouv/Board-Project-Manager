import { ValidationException } from '../exceptions/ValidationException';

/**
 * Estimate - Immutable value object representing task time estimate
 * Demonstrates value object immutability and validation
 */
export class Estimate {
  private readonly _value: number;
  private readonly _unit: 'hours' | 'days';

  constructor(value: number, unit: 'hours' | 'days' = 'hours') {
    if (value < 0) {
      throw new ValidationException('Estimate cannot be negative');
    }
    if (unit === 'hours' && value > 100) {
      throw new ValidationException('Estimate cannot exceed 100 hours');
    }
    if (unit === 'days' && value > 20) {
      throw new ValidationException('Estimate cannot exceed 20 days');
    }
    this._value = value;
    this._unit = unit;
  }

  get value(): number {
    return this._value;
  }

  get unit(): 'hours' | 'days' {
    return this._unit;
  }

  public toHours(): number {
    return this._unit === 'hours' ? this._value : this._value * 8;
  }

  public toDays(): number {
    return this._unit === 'days' ? this._value : this._value / 8;
  }

  public isGreaterThan(other: Estimate): boolean {
    return this.toHours() > other.toHours();
  }

  public isLessThan(other: Estimate): boolean {
    return this.toHours() < other.toHours();
  }

  public equals(other: Estimate): boolean {
    return this._value === other._value && this._unit === other._unit;
  }
}