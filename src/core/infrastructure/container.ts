import { PrismaTaskRepository } from './repositories/PrismaTaskRepository';
import { PrismaColumnRepository } from './repositories/PrismaColumnRepository';
import { PrismaBoardRepository } from './repositories/PrismaBoardRepository';
import { PrismaUserRepository } from './repositories/PrismaUserRepository';
import { TaskApplicationService } from '@/core/application/services/TaskApplicationService';
import { BoardApplicationService } from '@/core/application/services/BoardApplicationService';
import { UserApplicationService } from '@/core/application/services/UserApplicationService';

class Container {
  private static instance: Container;
  
  private taskRepository: PrismaTaskRepository;
  private columnRepository: PrismaColumnRepository;
  private boardRepository: PrismaBoardRepository;
  private userRepository: PrismaUserRepository;
  
  private taskService: TaskApplicationService | null = null;
  private boardService: BoardApplicationService | null = null;
  private userService: UserApplicationService | null = null;

  private constructor() {
    this.taskRepository = new PrismaTaskRepository();
    this.columnRepository = new PrismaColumnRepository();
    this.boardRepository = new PrismaBoardRepository();
    this.userRepository = new PrismaUserRepository();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  // ✅ Add missing getters
  getTaskService(): TaskApplicationService {
    if (!this.taskService) {
      this.taskService = new TaskApplicationService(
        this.taskRepository,
        this.columnRepository,
        this.boardRepository
      );
    }
    return this.taskService;
  }

  getBoardService(): BoardApplicationService {
    if (!this.boardService) {
      this.boardService = new BoardApplicationService(
        this.boardRepository,
        this.columnRepository
      );
    }
    return this.boardService;
  }

  getUserService(): UserApplicationService {
    if (!this.userService) {
      this.userService = new UserApplicationService(this.userRepository);
    }
    return this.userService;
  }
}

export const container = Container.getInstance();