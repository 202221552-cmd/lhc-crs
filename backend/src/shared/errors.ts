// Custom error classes for structured error handling

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} برقم ${id} غير موجود` : `${resource} غير موجود`,
      404,
      'NOT_FOUND',
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'يرجى تسجيل الدخول') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'ليس لديك صلاحية لهذه العملية') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'طلبات كثيرة جداً — حاول لاحقاً') {
    super(message, 429, 'RATE_LIMITED');
  }
}

// Prisma error mapper
export function mapPrismaError(err: any): AppError {
  if (err?.code === 'P2002') {
    const target = err.meta?.target as string[] | undefined;
    return new ConflictError(`القيمة موجودة مسبقاً${target ? ` (${target.join(', ')})` : ''}`);
  }
  if (err?.code === 'P2025') {
    return new NotFoundError('السجل');
  }
  if (err?.code === 'P2003') {
    return new ValidationError('المرجع غير موجود — تأكد من أن البيانات المرتبطة صحيحة');
  }
  if (err?.code === 'P2014') {
    return new ConflictError('لا يمكن الحذف — يوجد بيانات مرتبطة');
  }
  return new AppError(err?.message || 'حدث خطأ غير متوقع', 500, 'DATABASE_ERROR');
}
