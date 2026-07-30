import { DomainException } from "../exceptions";

/**
 * Result pattern for handling recoverable business failures
 * Avoids throwing exceptions for expected business outcomes
 */
export type Result<T, E = DomainException> = Success<T, E> | Failure<T, E>;

export class Success<T, E = DomainException> {
  private readonly _value: T;

  constructor(value: T) {
    this._value = value;
  }

  public isSuccess(): this is Success<T, E> {
    return true;
  }

  public isFailure(): this is Failure<T, E> {
    return false;
  }

  public get value(): T {
    return this._value;
  }

  public get error(): never {
    throw new Error('Cannot get error from success result');
  }

  public get<TResult>(
    onSuccess: (value: T) => TResult,
    onFailure: (error: E) => TResult
  ): TResult {
    return onSuccess(this._value);
  }

  public unwrap(): T {
    return this._value;
  }
}

export class Failure<T, E = DomainException> {
  private readonly _error: E;

  constructor(error: E) {
    this._error = error;
  }

  public isSuccess(): this is Success<T, E> {
    return false;
  }

  public isFailure(): this is Failure<T, E> {
    return true;
  }

  public get value(): never {
    throw new Error('Cannot get value from failed result');
  }

  public get error(): E {
    return this._error;
  }

  public get<TResult>(
    onSuccess: (value: T) => TResult,
    onFailure: (error: E) => TResult
  ): TResult {
    return onFailure(this._error);
  }

  public unwrap(): T {
    throw this._error;
  }
}

export class ResultFactory {
  public static success<T, E = DomainException>(value: T): Result<T, E> {
    return new Success<T, E>(value);
  }

  public static failure<T, E = DomainException>(error: E): Result<T, E> {
    return new Failure<T, E>(error);
  }
}