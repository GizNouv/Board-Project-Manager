import { UserId } from '../value-objects/UserId';
import { User } from '../entities/User';

/**
 * IUserRepository - Repository interface for User entities
 * Demonstrates repository abstraction for different aggregates
 */
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
  update(user: User): Promise<void>;
}