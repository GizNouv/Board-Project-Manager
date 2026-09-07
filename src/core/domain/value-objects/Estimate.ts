import { EstimateUnit, TaskEstimateUnitEnum } from '@/types';
import { ValidationException } from '../exceptions/ValidationException';
import { TASK_DEFAULTS } from '@/constants/task-defaults';

/**
 * Estimate - Immutable value object representing task time estimate
 * Demonstrates value object immutability and validation
 */
export class Estimate {
  private readonly _value: number;
  private readonly _unit: EstimateUnit;

  constructor(value: number, unit: EstimateUnit = TASK_DEFAULTS.estimateUnit) {
    if (value < 0) {
      throw new ValidationException('Estimate cannot be negative');
    }
    if (unit === TaskEstimateUnitEnum.HOURS && value > 100) {
      throw new ValidationException('Estimate cannot exceed 100 hours');
    }
    if (unit === TaskEstimateUnitEnum.DAYS && value > 20) {
      throw new ValidationException('Estimate cannot exceed 20 days');
    }
    this._value = value;
    this._unit = unit;
  }

  get value(): number {
    return this._value;
  }

  get unit(): EstimateUnit {
    return this._unit;
  }

  public toHours(): number {
    return this._unit === TaskEstimateUnitEnum.HOURS ? this._value : this._value * 8;
  }

  public toDays(): number {
    return this._unit === TaskEstimateUnitEnum.DAYS ? this._value : this._value / 8;
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