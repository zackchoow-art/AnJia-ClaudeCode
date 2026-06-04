// ============================================================================
// Shared error handling utilities
// ============================================================================

export class ApplicationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('DATABASE_ERROR', message, details);
    this.name = 'DatabaseError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string) {
    super('AUTHORIZATION_ERROR', message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

/**
 * 创建标准化的错误响应
 */
export function errorResponse(error: unknown, status = 500): Response {
  const timestamp = new Date().toISOString();
  
  if (error instanceof ApplicationError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        },
        timestamp
      }),
      { 
        status: error instanceof ValidationError ? 400 
              : error instanceof AuthorizationError ? 403
              : error instanceof NotFoundError ? 404
              : status,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  
  // 未知错误,不暴露内部细节
  console.error('Unexpected error:', error);
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      },
      timestamp
    }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * 创建标准化的成功响应
 */
export function successResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}
