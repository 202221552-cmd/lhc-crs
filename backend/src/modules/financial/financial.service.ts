import { prisma } from '../../index.js';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors.js';
import { eventBus, createEvent, Events } from '../../shared/infrastructure/event-bus.js';
import { logger } from '../../shared/logger.js';
import { DB_CONFIG } from '../../config/database.js';
import { generateReceiptNumber } from '../../utils/generateReceiptNumber.js';

// ==================== Installment Service ====================

export class InstallmentService {
  // Get installments with optimized query
  async findMany(filters: {
    studentId?: string;
    subscriptionId?: string;
    subscriptionType?: string;
    status?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
  }) {
    const where: any = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.subscriptionId) where.subscriptionId = filters.subscriptionId;
    if (filters.subscriptionType) where.subscriptionType = filters.subscriptionType;
    if (filters.status) where.status = filters.status;
    if (filters.dueDateFrom || filters.dueDateTo) {
      where.dueDate = {};
      if (filters.dueDateFrom) where.dueDate.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) where.dueDate.lte = new Date(filters.dueDateTo);
    }

    return prisma.installment.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { installmentNumber: 'asc' }],
    });
  }

  // Get student balance (cached-friendly)
  async getStudentBalance(studentId: string) {
    const result = await prisma.$queryRawUnsafe<Array<{ balance: number; unpaid_count: bigint }>>(
      `SELECT 
        COALESCE(SUM(CASE WHEN status IN ('PENDING','OVERDUE','PARTIAL') THEN remaining_amount ELSE 0 END), 0) as balance,
        COUNT(CASE WHEN status IN ('PENDING','OVERDUE','PARTIAL') THEN 1 END) as unpaid_count
      FROM installments WHERE student_id = $1`,
      studentId,
    );
    return {
      balance: Number(result[0]?.balance || 0),
      totalInstallments: Number(result[0]?.unpaid_count || 0),
    };
  }

  // Create installment with event emission
  async create(data: {
    studentId: string;
    subscriptionId?: string;
    subscriptionType?: string;
    category?: string;
    dueDate: string;
    amount: number;
    notes?: string;
  }) {
    const { studentId, category = 'SUBSCRIPTION', ...rest } = data;

    // For EXTRA categories, use convention
    const isExtra = category !== 'SUBSCRIPTION';
    const body: any = {
      studentId,
      dueDate: new Date(rest.dueDate),
      amount: rest.amount,
      notes: rest.notes || null,
    };

    if (isExtra) {
      body.subscriptionType = 'EXTRA';
      body.subscriptionId = `EXTRA-${category}`;
    } else {
      body.subscriptionType = rest.subscriptionType || null;
      body.subscriptionId = rest.subscriptionId || null;
    }

    // Get next installment number
    const existing = await prisma.installment.findFirst({
      where: { studentId, subscriptionId: body.subscriptionId },
      orderBy: { installmentNumber: 'desc' },
      select: { installmentNumber: true },
    });
    body.installmentNumber = (existing?.installmentNumber || 0) + 1;
    body.totalInstallments = body.installmentNumber;
    body.remainingAmount = rest.amount;
    body.paidAmount = 0;
    body.status = 'PENDING';

    const installment = await prisma.installment.create({ data: body });

    eventBus.publish(createEvent(Events.INSTALLMENT_CREATED, studentId, {
      installmentId: installment.id,
      amount: rest.amount,
      dueDate: rest.dueDate,
      category,
    }));

    return installment;
  }

  // Pay student with FIFO deduction
  async payStudent(data: {
    studentId: string;
    amount: number;
    paymentMethod: string;
    paymentWallet?: string;
    paymentBank?: string;
    senderInfo?: string;
    referenceNumber?: string;
    notes?: string;
  }) {
    const { studentId, amount: payAmount, paymentMethod, ...meta } = data;

    // Get unpaid installments (including overdue)
    const installments = await prisma.installment.findMany({
      where: { studentId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      orderBy: { dueDate: 'asc' },
    });

    if (installments.length === 0) {
      throw new ValidationError('لا توجد دفعات مستحقة لهذا الطالب');
    }

    const totalRemaining = installments.reduce((s, i) => s + Number(i.remainingAmount), 0);
    if (payAmount > totalRemaining) {
      throw new ValidationError(
        `المبلغ المدفوع (${payAmount}) أكبر من الرصيد المستحق (${totalRemaining})`,
      );
    }

    let remaining = payAmount;
    const updatedInsts: any[] = [];

    // FIFO deduction
    for (const inst of installments) {
      if (remaining <= 0) break;
      const deduct = Math.min(remaining, Number(inst.remainingAmount));
      const newPaid = Number(inst.paidAmount) + deduct;
      const newRemaining = Number(inst.remainingAmount) - deduct;
      const newStatus = newRemaining === 0 ? 'PAID' : 'PARTIAL';

      await prisma.installment.update({
        where: { id: inst.id },
        data: {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus,
          paymentDate: newStatus === 'PAID' ? new Date() : inst.paymentDate,
          paymentMethod: paymentMethod,
          paymentWallet: paymentMethod === 'WALLET' ? (meta.paymentWallet || null) : inst.paymentWallet,
          paymentBank: paymentMethod === 'CLICK' ? (meta.paymentBank || null) : inst.paymentBank,
          senderInfo: paymentMethod === 'CLICK' ? (meta.senderInfo || null) : inst.senderInfo,
          referenceNumber: meta.referenceNumber || inst.referenceNumber,
        },
      });

      updatedInsts.push({
        id: inst.id,
        installmentNumber: inst.installmentNumber,
        amount: Number(inst.amount),
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
      });
      remaining -= deduct;
    }

    // Create transaction record
    const receiptNumber = await generateReceiptNumber('RECEIPT');

    const transaction = await prisma.financialTransaction.create({
      data: {
        studentId,
        type: 'RECEIPT',
        amount: payAmount,
        paymentMethod,
        status: 'COMPLETED',
        receiptNumber,
        referenceNumber: meta.referenceNumber || null,
        paymentWallet: paymentMethod === 'WALLET' ? (meta.paymentWallet || null) : null,
        paymentBank: paymentMethod === 'CLICK' ? (meta.paymentBank || null) : null,
        senderInfo: paymentMethod === 'CLICK' ? (meta.senderInfo || null) : null,
        notes: meta.notes || `دفع على ${updatedInsts.length} دفعات`,
      },
      include: { student: { select: { id: true, fullNameAr: true } } },
    });

    eventBus.publish(createEvent(Events.PAYMENT_COMPLETED, studentId, {
      receiptNumber,
      amount: payAmount,
      installmentsCount: updatedInsts.length,
    }));

    return {
      transaction,
      installments: updatedInsts,
      paidAmount: payAmount,
      balanceBefore: totalRemaining,
      balanceAfter: totalRemaining - payAmount,
    };
  }
}

// Singleton
export const installmentService = new InstallmentService();
