import { Board as PrismaBoard, Column as PrismaColumn, Task as PrismaTask } from '@prisma/client';
import { Board, BoardId, UserId, Column } from '../../domain';
import { Mapper } from './Mapper';
import { ColumnMapper } from './ColumnMapper';
import { TaskMapper } from './TaskMapper';

type PrismaBoardWithRelations = PrismaBoard & {
  columns?: (PrismaColumn & {
    tasks?: (PrismaTask & {
      assignee?: { id: string } | null;
    })[];
  })[];
};

/**
 * BoardMapper - Converts between Prisma Board models and Domain Board entities
 * Supports optional column mapping for eager loading scenarios
 * Dependency direction: Infrastructure -> Domain
 */
export class BoardMapper implements Mapper<Board, PrismaBoardWithRelations> {
  private columnMapper = new ColumnMapper();

  public toDomain(prismaBoard: PrismaBoardWithRelations): Board {
    const board = new Board(
      new BoardId(prismaBoard.id),
      prismaBoard.title,
      new UserId(prismaBoard.ownerId)
    );

    // If columns are included, add them to the board
    if (prismaBoard.columns && prismaBoard.columns.length > 0) {
      const sortedColumns = [...prismaBoard.columns].sort((a, b) => a.order - b.order);
      for (const prismaColumn of sortedColumns) {
        const column = this.columnMapper.toDomain(prismaColumn);
        board.addColumn(column);
      }
    }

    return board;
  }

  public toPersistence(board: Board): PrismaBoard {
    return {
      id: board.id.toString(),
      title: board.title,
      ownerId: board.ownerId.toString(),
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  }

  public toPersistenceUpdate(board: Board): Partial<PrismaBoard> {
    return {
      title: board.title,
      ownerId: board.ownerId.toString(),
      updatedAt: new Date(),
    };
  }

  /**
   * Maps a board with its columns in one operation
   * Useful for aggregate root persistence
   */
  public toDomainWithColumns(prismaBoard: PrismaBoardWithRelations): Board {
    return this.toDomain(prismaBoard);
  }
}