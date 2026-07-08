// Database configuration
// Prisma client singleton is exported from ../index.ts (legacy)
// This file provides DB query configuration constants

export const DB_CONFIG = {
  // Connection pool sizing for Prisma
  pool: {
    min: 2,
    max: 25,
  },

  // Query timeouts (ms)
  timeout: {
    normal: 5_000,
    report: 30_000,
    batch: 60_000,
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 50,
    maxLimit: 500,
  },

  // Retry logic
  retry: {
    maxAttempts: 3,
    baseDelayMs: 100,
  },
} as const;

export const SQL = {
  // Efficient overdue installment query
  overdueInstallments: `
    SELECT id, student_id, amount, remaining_amount, due_date
    FROM installments
    WHERE status = 'OVERDUE' AND due_date < CURRENT_DATE
    ORDER BY due_date ASC
    LIMIT $1
  `,

  // Student balance (aggregated)
  studentBalance: `
    SELECT 
      COALESCE(SUM(CASE WHEN status IN ('PENDING','OVERDUE','PARTIAL') THEN remaining_amount ELSE 0 END), 0) as balance,
      COUNT(CASE WHEN status IN ('PENDING','OVERDUE','PARTIAL') THEN 1 END) as unpaid_count
    FROM installments
    WHERE student_id = $1
  `,

  // Financial summary (cached friendly)
  financialSummary: `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'RECEIPT' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as total_received,
      COALESCE(SUM(CASE WHEN type = 'PAYMENT' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as total_payments,
      COUNT(CASE WHEN type = 'RECEIPT' AND status = 'COMPLETED' THEN 1 END) as receipt_count
    FROM financial_transactions
    WHERE date >= $1 AND date <= $2
  `,
} as const;
