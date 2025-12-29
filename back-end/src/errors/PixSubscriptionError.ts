/**
 * Custom error class for PIX subscription operations
 */
export class PixSubscriptionError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'PixSubscriptionError';
  }
}

/**
 * Error for invalid file uploads
 */
export class InvalidFileError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'InvalidFileError';
  }
}

/**
 * Error for unauthorized access
 */
export class UnauthorizedError extends Error {
  constructor(
    public message: string = 'Acesso negado',
    public statusCode: number = 403,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Error for resource not found
 */
export class NotFoundError extends Error {
  constructor(
    public message: string = 'Recurso não encontrado',
    public statusCode: number = 404,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Error for invalid state transitions
 */
export class InvalidStateError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 409,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'InvalidStateError';
  }
}
