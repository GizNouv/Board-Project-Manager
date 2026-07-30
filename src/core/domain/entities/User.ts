import { Entity } from './Entity';
import { UserId } from '../value-objects/UserId';
import { ValidationException } from '../exceptions/BaseExceptions';
import { DomainConstants } from '../utils/Constants';

/**
 * User aggregate root
 * Simple entity for user management
 */
export class User extends Entity<UserId> {
  private _name: string;
  private _email: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(id: UserId, name: string, email: string) {
    super(id);
    this.validateName(name);
    this.validateEmail(email);
    this._name = name.trim();
    this._email = email.trim().toLowerCase();
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  private validateName(name: string): void {
    if (!name || name.trim().length < DomainConstants.USER.MIN_NAME_LENGTH) {
      throw new ValidationException('User name cannot be empty');
    }
    if (name.length > DomainConstants.USER.MAX_NAME_LENGTH) {
      throw new ValidationException(`User name cannot exceed ${DomainConstants.USER.MAX_NAME_LENGTH} characters`);
    }
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new ValidationException('Invalid email address');
    }
  }

  get name(): string { return this._name; }
  get email(): string { return this._email; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  public updateName(name: string): void {
    this.validateName(name);
    this._name = name.trim();
    this._updatedAt = new Date();
  }

  public updateEmail(email: string): void {
    this.validateEmail(email);
    this._email = email.trim().toLowerCase();
    this._updatedAt = new Date();
  }

  public equals(other: User): boolean {
    return this.id.equals(other.id);
  }
}