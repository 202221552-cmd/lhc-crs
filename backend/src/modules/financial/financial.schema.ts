import { z } from 'zod';

// Pagination & filters
export const TransactionQuerySchema = z.object({
  studentId: z.string().optional(),
  type: z.enum(['RECEIPT', 'PAYMENT', 'REFUND', 'ADJUSTMENT']).optional(),
  status: z.enum(['COMPLETED', 'VOID']).optional(),
  dateFrom: z.string().datetime({ offset: true }).optional(),
  dateTo: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(50),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const ReceiptBodySchema = z.object({
  studentId: z.string().min(1, 'الطالب مطلوب'),
  subscriptionId: z.string().optional(),
  subscriptionType: z.string().optional(),
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من 0'),
  paymentMethod: z.enum(['CASH', 'BANK', 'CARD', 'TRANSFER', 'WALLET', 'CLICK', 'ENTITY', 'CHECK']).default('CASH'),
  paymentWallet: z.string().optional(),
  paymentBank: z.string().optional(),
  senderInfo: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const PayStudentBodySchema = z.object({
  studentId: z.string().min(1, 'الطالب مطلوب'),
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من 0'),
  paymentMethod: z.enum(['CASH', 'BANK', 'CARD', 'TRANSFER', 'WALLET', 'CLICK', 'ENTITY', 'CHECK']).default('CASH'),
  paymentWallet: z.string().optional(),
  paymentBank: z.string().optional(),
  senderInfo: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const InstallmentCreateSchema = z.object({
  studentId: z.string().min(1, 'الطالب مطلوب'),
  subscriptionId: z.string().optional(),
  subscriptionType: z.string().optional(),
  category: z.enum(['SUBSCRIPTION', 'PENALTY', 'FINE', 'PRIVILEGE', 'OTHER']).default('SUBSCRIPTION'),
  dueDate: z.string().min(1, 'التاريخ مطلوب'),
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من 0'),
  notes: z.string().optional(),
});

export const InstallmentUpdateSchema = z.object({
  amount: z.number().positive().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const InstallmentQuerySchema = z.object({
  studentId: z.string().optional(),
  subscriptionId: z.string().optional(),
  subscriptionType: z.string().optional(),
  status: z.enum(['PENDING', 'PAID', 'PARTIAL', 'OVERDUE']).optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
});

export const VoidTransactionSchema = z.object({
  reason: z.string().min(1, 'سبب الإلغاء مطلوب'),
});

export const PaymentBodySchema = z.object({
  studentId: z.string().optional(),
  amount: z.number().positive(),
  paymentMethod: z.string().default('CASH'),
  expenseCategory: z.string().optional(),
  beneficiary: z.string().optional(),
  notes: z.string().optional(),
});
