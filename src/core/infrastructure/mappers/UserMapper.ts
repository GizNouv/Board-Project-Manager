import { User as PrismaUser } from '@prisma/client';
import { User, UserId } from '../../domain';

type PrismaUserWithRelations = PrismaUser & {
  boards?: Array<{ id: string }>;
  assignedTasks?: Array<{ id: string }>;
  comments?: Array<{ id: string }>;
  attachments?: Array<{ id: string }>;
};

export class UserMapper {
  public static toDomain(prismaUser: PrismaUserWithRelations): User {
    return new User(
      new UserId(prismaUser.id),
      prismaUser.name,
      prismaUser.email,
      prismaUser.password
    );
  }

  public static toPersistence(user: User): PrismaUser {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public static toPersistenceUpdate(user: User): Partial<PrismaUser> {
    return {
      name: user.name,
      email: user.email,
      password: user.password,
      updatedAt: new Date(),
    };
  }
}