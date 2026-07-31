import { Board as PrismaBoard, Column as PrismaColumn } from '@prisma/client';
import { Board, BoardId, UserId, Column } from '../../domain';
import { Mapper } from './Mapper';
import { ColumnMapper } from './ColumnMapper';

type PrismaBoardWithColumns = PrismaBoard & {
  columns?: PrismaColumn[];
};

/**
 * BoardMapper - Converts between Prisma Board models and Domain Board entities
 * Supports optional column mapping for eager loading scenarios
 * Dependency direction: Infrastructure -> Domain
 */
export class BoardMapper implements Mapper<Board, PrismaBoardWithColumns> {
  private columnMapper = new ColumnMapper();

  public toDomain(prismaBoard: PrismaBoardWithColumns): Board {
    const board = new Board(
      new BoardId(prismaBoard.id),
      prismaBoard.title,
      new UserId(prismaBoard.ownerId)
    );

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

  public toDomainWithColumns(prismaBoard: PrismaBoardWithColumns): Board {
    return this.toDomain(prismaBoard);
  }
}