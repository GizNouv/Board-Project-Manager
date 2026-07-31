import { Attachment as PrismaAttachment, User as PrismaUser } from '@prisma/client';
import { Mapper } from './Mapper';
import { ValidationException } from '../../domain/exceptions';

export class Attachment {
  private readonly _id: string;
  private readonly _fileName: string;
  private readonly _fileUrl: string;
  private readonly _fileSize: number;
  private readonly _mimeType: string;
  private readonly _taskId: string;
  private readonly _uploadedBy: string;
  private readonly _uploaderName: string;
  private readonly _createdAt: Date;

  constructor(
    id: string,
    fileName: string,
    fileUrl: string,
    fileSize: number,
    mimeType: string,
    taskId: string,
    uploadedBy: string,
    uploaderName: string,
    createdAt: Date
  ) {
    if (!fileName || fileName.trim().length === 0) {
      throw new ValidationException('File name cannot be empty');
    }
    if (fileSize <= 0) {
      throw new ValidationException('File size must be greater than 0');
    }
    if (!fileUrl || fileUrl.trim().length === 0) {
      throw new ValidationException('File URL cannot be empty');
    }

    this._id = id;
    this._fileName = fileName;
    this._fileUrl = fileUrl;
    this._fileSize = fileSize;
    this._mimeType = mimeType;
    this._taskId = taskId;
    this._uploadedBy = uploadedBy;
    this._uploaderName = uploaderName;
    this._createdAt = createdAt;
  }

  get id(): string { return this._id; }
  get fileName(): string { return this._fileName; }
  get fileUrl(): string { return this._fileUrl; }
  get fileSize(): number { return this._fileSize; }
  get mimeType(): string { return this._mimeType; }
  get taskId(): string { return this._taskId; }
  get uploadedBy(): string { return this._uploadedBy; }
  get uploaderName(): string { return this._uploaderName; }
  get createdAt(): Date { return this._createdAt; }
}

type PrismaAttachmentWithRelations = PrismaAttachment & {
  user?: PrismaUser;
};

/**
 * AttachmentMapper - Converts between Prisma Attachment models and Domain Attachment value objects
 * Creates lightweight domain objects for attachments
 * Dependency direction: Infrastructure -> Domain
 */
export class AttachmentMapper implements Mapper<Attachment, PrismaAttachmentWithRelations> {
  public toDomain(prismaAttachment: PrismaAttachmentWithRelations): Attachment {
    const uploaderName = prismaAttachment.user?.name || 'Unknown User';

    return new Attachment(
      prismaAttachment.id,
      prismaAttachment.fileName,
      prismaAttachment.fileUrl,
      prismaAttachment.fileSize,
      prismaAttachment.mimeType,
      prismaAttachment.taskId,
      prismaAttachment.uploadedBy,
      uploaderName,
      prismaAttachment.createdAt
    );
  }

  public toPersistence(attachment: Attachment): PrismaAttachment {
    return {
      id: attachment.id,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      taskId: attachment.taskId,
      uploadedBy: attachment.uploadedBy,
      createdAt: attachment.createdAt,
    };
  }

  public toPersistenceCreate(attachment: Omit<Attachment, 'id' | 'createdAt'>): Omit<PrismaAttachment, 'id' | 'createdAt'> {
    return {
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      taskId: attachment.taskId,
      uploadedBy: attachment.uploadedBy,
    };
  }

  public toPersistenceUpdate(attachment: Attachment): Partial<PrismaAttachment> {
    return {
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
    };
  }
}