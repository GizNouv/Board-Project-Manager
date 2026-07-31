import {
  IUserRepository,
  User,
  UserId,
  Result,
  ResultFactory,
  EntityNotFoundException,
  ValidationException,
  DuplicateEntityException
} from '../../domain';
import { CreateUserDTO, UpdateUserDTO } from '../dto/UserDTOs';
import bcrypt from 'bcryptjs';

export class UserApplicationService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(dto: CreateUserDTO): Promise<Result<User>> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser.isSuccess()) {
      return ResultFactory.failure(new DuplicateEntityException('User', dto.email));
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = new User(
      new UserId(crypto.randomUUID()),
      dto.name,
      dto.email
    );

    return await this.userRepository.save(user);
  }

  async getUser(id: string): Promise<Result<User>> {
    return await this.userRepository.findById(new UserId(id));
  }

  async getUserByEmail(email: string): Promise<Result<User>> {
    return await this.userRepository.findByEmail(email);
  }

  async getAllUsers(): Promise<Result<User[]>> {
    return await this.userRepository.findAll();
  }

  async updateUser(id: string, dto: UpdateUserDTO): Promise<Result<User>> {
    const userResult = await this.userRepository.findById(new UserId(id));
    if (userResult.isFailure()) {
      return ResultFactory.failure(userResult.error);
    }

    const user = userResult.value;

    if (dto.name) {
      user.updateName(dto.name);
    }

    if (dto.email) {
      user.updateEmail(dto.email);
    }

    return await this.userRepository.update(user);
  }

  async deleteUser(id: string): Promise<Result<void>> {
    return await this.userRepository.delete(new UserId(id));
  }

  async validateCredentials(email: string, password: string): Promise<Result<User>> {
    return await this.userRepository.findByEmail(email);
  }
}