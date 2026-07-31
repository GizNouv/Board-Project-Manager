import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { UserApplicationService } from '../application/services/UserApplicationService';

/**
 * Dependency Injection Container
 * Singleton instances for the application
 */
class Container {
  private static instance: Container;
  private _userApplicationService: UserApplicationService | null = null;

  private constructor() {}

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public get userApplicationService(): UserApplicationService {
    if (!this._userApplicationService) {
      const userRepository = new PrismaUserRepository();
      this._userApplicationService = new UserApplicationService(userRepository);
    }
    return this._userApplicationService;
  }
}

export const container = Container.getInstance();