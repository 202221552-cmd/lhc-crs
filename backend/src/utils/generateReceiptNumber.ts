import { prisma } from '../index';

export async function generateReceiptNumber(type: 'RECEIPT' | 'PAYMENT' = 'RECEIPT'): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${y}${m}${d}`;
  const typeChar = type === 'RECEIPT' ? 'R' : 'P';
  const seqKey = `receipt_${typeChar}_${datePrefix}`;

  const seq = await prisma.systemSequence.upsert({
    where: { key: seqKey },
    update: { current: { increment: 1 } },
    create: { key: seqKey, current: 1 },
  });

  return `${datePrefix}${typeChar}${String(seq.current).padStart(4, '0')}`;
}
