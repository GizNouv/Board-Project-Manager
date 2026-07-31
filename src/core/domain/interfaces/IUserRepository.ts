import { UserId } from '../value-objects/UserId';
import { User } from '../entities/User';
import { Result } from '../utils/Result';

export interface IUserRepository {
  findById(id: UserId): Promise<Result<User>>;
  findByEmail(email: string): Promise<Result<User>>;
  findAll(): Promise<Result<User[]>>;
  save(user: User): Promise<Result<User>>;
  delete(id: UserId): Promise<Result<void>>;
  update(user: User): Promise<Result<User>>;
  updatePassword(userId: UserId, hashedPassword: string): Promise<Result<void>>;
}