import { prisma } from '../prisma/client';
import {
  IUserRepository,
  User,
  UserId,
  Result,
  ResultFactory,
  EntityNotFoundException,
  DuplicateEntityException,
  DomainException
} from '../../domain';
import { UserMapper } from '../mappers/UserMapper';
import { PrismaErrorMapper } from '../errors/PrismaErrorMapper';

export class PrismaUserRepository implements IUserRepository {
  private userMapper = new UserMapper();

  async findById(id: UserId): Promise<Result<User>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: id.toString() }
      });

      if (!user) {
        return ResultFactory.failure(new EntityNotFoundException('User', id.toString()));
      }

      return ResultFactory.success(this.userMapper.toDomain(user));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findByEmail(email: string): Promise<Result<User>> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return ResultFactory.failure(new EntityNotFoundException('User', email));
      }

      return ResultFactory.success(this.userMapper.toDomain(user));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async findAll(): Promise<Result<User[]>> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return ResultFactory.success(users.map(user => this.userMapper.toDomain(user)));
    } catch (error) {
      throw PrismaErrorMapper.map(error);
    }
  }

  async save(user: User): Promise<Result<User>> {
    try {
      const data = this.userMapper.toPersistence(user);

      await prisma.user.create({
        data
      });

      return ResultFactory.success(user);
    } catch (error) {
      if (PrismaErrorMapper.isDuplicateError(error)) {
        return ResultFactory.failure(new DuplicateEntityException('User', user.email));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async delete(id: UserId): Promise<Result<void>> {
    try {
      await prisma.user.delete({
        where: { id: id.toString() }
      });

      return ResultFactory.success(undefined);
    } catch (error) {
      if (PrismaErrorMapper.isNotFoundError(error)) {
        return ResultFactory.failure(new EntityNotFoundException('User', id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async update(user: User): Promise<Result<User>> {
    try {
      const data = this.userMapper.toPersistenceUpdate(user);

      await prisma.user.update({
        where: { id: user.id.toString() },
        data
      });

      return ResultFactory.success(user);
    } catch (error) {
      if (PrismaErrorMapper.isNotFoundError(error)) {
        return ResultFactory.failure(new EntityNotFoundException('User', user.id.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }

  async updatePassword(userId: UserId, hashedPassword: string): Promise<Result<void>> {
    try {
      await prisma.user.update({
        where: { id: userId.toString() },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      return ResultFactory.success(undefined);
    } catch (error) {
      if (PrismaErrorMapper.isNotFoundError(error)) {
        return ResultFactory.failure(new EntityNotFoundException('User', userId.toString()));
      }
      throw PrismaErrorMapper.map(error);
    }
  }
}