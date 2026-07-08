// ==================== API Types ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// ==================== Sort & Filter Types ====================

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  sort?: string;
  order?: SortOrder;
}

export interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchParams {
  query?: string;
}

// ==================== Enums ====================

export const InstallmentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  OVERDUE: 'OVERDUE',
} as const;
export type InstallmentStatus = (typeof InstallmentStatus)[keyof typeof InstallmentStatus];

export const TransactionType = {
  RECEIPT: 'RECEIPT',
  PAYMENT: 'PAYMENT',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  COMPLETED: 'COMPLETED',
  VOID: 'VOID',
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const EnrollmentStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  WITHDRAWN: 'WITHDRAWN',
  TRANSFERRED: 'TRANSFERRED',
} as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export const StudentStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  GRADUATED: 'GRADUATED',
} as const;
export type StudentStatus = (typeof StudentStatus)[keyof typeof StudentStatus];

export const SectionStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type SectionStatus = (typeof SectionStatus)[keyof typeof SectionStatus];

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  EXCUSED: 'EXCUSED',
  LATE: 'LATE',
} as const;
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

// ==================== Installment Categories ====================

export const INSTALLMENT_CATEGORIES = {
  SUBSCRIPTION: { value: 'SUBSCRIPTION', label: 'قسط اشتراك', color: '#6366f1' },
  PENALTY: { value: 'PENALTY', label: 'بدل مخالفة', color: '#ef4444' },
  FINE: { value: 'FINE', label: 'بدل غرامات', color: '#f97316' },
  PRIVILEGE: { value: 'PRIVILEGE', label: 'بدل امتيازات', color: '#eab308' },
  OTHER: { value: 'OTHER', label: 'بدل أخرى', color: '#6b7280' },
} as const;

export type InstallmentCategory = keyof typeof INSTALLMENT_CATEGORIES;
