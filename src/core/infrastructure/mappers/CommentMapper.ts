import { Comment as PrismaComment, User as PrismaUser } from '@prisma/client';
import { Mapper } from './Mapper';
import { ValidationException } from '../../domain/exceptions';

export class Comment {
  private readonly _id: string;
  private readonly _content: string;
  private readonly _taskId: string;
  private readonly _authorId: string;
  private readonly _authorName: string;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  constructor(
    id: string,
    content: string,
    taskId: string,
    authorId: string,
    authorName: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    if (!content || content.trim().length === 0) {
      throw new ValidationException('Comment content cannot be empty');
    }
    if (content.length > 5000) {
      throw new ValidationException('Comment content cannot exceed 5000 characters');
    }

    this._id = id;
    this._content = content;
    this._taskId = taskId;
    this._authorId = authorId;
    this._authorName = authorName;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string { return this._id; }
  get content(): string { return this._content; }
  get taskId(): string { return this._taskId; }
  get authorId(): string { return this._authorId; }
  get authorName(): string { return this._authorName; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
}

type PrismaCommentWithRelations = PrismaComment & {
  author?: PrismaUser;
};

/**
 * CommentMapper - Converts between Prisma Comment models and Domain Comment value objects
 * Creates lightweight domain objects for comments
 * Dependency direction: Infrastructure -> Domain
 */
export class CommentMapper implements Mapper<Comment, PrismaCommentWithRelations> {
  public toDomain(prismaComment: PrismaCommentWithRelations): Comment {
    const authorName = prismaComment.author?.name || 'Unknown User';

    return new Comment(
      prismaComment.id,
      prismaComment.content,
      prismaComment.taskId,
      prismaComment.authorId,
      authorName,
      prismaComment.createdAt,
      prismaComment.updatedAt
    );
  }

  public toPersistence(comment: Comment): PrismaComment {
    return {
      id: comment.id,
      content: comment.content,
      taskId: comment.taskId,
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  public toPersistenceCreate(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Omit<PrismaComment, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      content: comment.content,
      taskId: comment.taskId,
      authorId: comment.authorId,
    };
  }

  public toPersistenceUpdate(comment: Comment): Partial<PrismaComment> {
    return {
      content: comment.content,
      updatedAt: new Date(),
    };
  }
}