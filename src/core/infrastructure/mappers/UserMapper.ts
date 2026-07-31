import { User as PrismaUser } from '@prisma/client';
import { User, UserId } from '../../domain';
import { Mapper } from './Mapper';

type PrismaUserWithRelations = PrismaUser & {
  boards?: Array<{ id: string }>;
  assignedTasks?: Array<{ id: string }>;
  comments?: Array<{ id: string }>;
  attachments?: Array<{ id: string }>;
};

/**
 * UserMapper - Converts between Prisma User models and Domain User entities
 * Simple bidirectional mapping with proper Value Object instantiation
 * Dependency direction: Infrastructure -> Domain
 */
export class UserMapper implements Mapper<User, PrismaUserWithRelations> {
  public toDomain(prismaUser: PrismaUserWithRelations): User {
    return new User(
      new UserId(prismaUser.id),
      prismaUser.name,
      prismaUser.email
    );
  }

  public toPersistence(user: User): PrismaUser {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: '', // Password must be set separately for security
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public toPersistenceUpdate(user: User): Partial<PrismaUser> {
    return {
      name: user.name,
      email: user.email,
      updatedAt: new Date(),
    };
  }
}