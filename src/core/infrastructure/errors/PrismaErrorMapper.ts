import {
  DomainException,
  EntityNotFoundException,
  ValidationException,
  DuplicateEntityException
} from '../../domain/exceptions';

function isPrismaKnownRequestError(error: unknown): error is { 
  code: string; 
  meta?: Record<string, unknown>;
  message: string;
} {
  return error instanceof Error && 
         'code' in error && 
         typeof (error as any).code === 'string' &&
         (error as any).code.startsWith('P');
}

function isPrismaValidationError(error: unknown): error is { message: string } {
  return error instanceof Error && 
         error.name === 'PrismaClientValidationError';
}

export class PrismaErrorMapper {
  public static map(error: unknown): DomainException {
    if (isPrismaKnownRequestError(error)) {
      switch (error.code) {
        case 'P2000':
          return new ValidationException(`Value too long: ${error.message}`);
        case 'P2001':
          return new EntityNotFoundException('Record', error.message);
        case 'P2002':
          const target = error.meta?.target as string || 'unknown';
          return new DuplicateEntityException('Record', target);
        case 'P2003':
          return new ValidationException(`Invalid relation: ${error.message}`);
        case 'P2025':
          return new EntityNotFoundException('Record', error.message);
        default:
          return new ValidationException(`Database error (${error.code}): ${error.message}`);
      }
    }

    if (isPrismaValidationError(error)) {
      return new ValidationException(`Validation error: ${error.message}`);
    }

    if (error instanceof Error) {
      return new ValidationException(`Unexpected error: ${error.message}`);
    }

    return new ValidationException('Unknown database error occurred');
  }

  public static isNotFoundError(error: unknown): boolean {
    if (isPrismaKnownRequestError(error)) {
      return error.code === 'P2025' || error.code === 'P2001';
    }
    return false;
  }

  public static isDuplicateError(error: unknown): boolean {
    if (isPrismaKnownRequestError(error)) {
      return error.code === 'P2002';
    }
    return false;
  }
}