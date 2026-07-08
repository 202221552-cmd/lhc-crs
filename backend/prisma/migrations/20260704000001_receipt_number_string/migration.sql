-- AlterTable: receiptNumber from Int to String (YYYYMMDD + daily sequence)
ALTER TABLE "FinancialTransaction" ALTER COLUMN "receiptNumber" SET DATA TYPE TEXT USING "receiptNumber"::text;
ALTER TABLE "FinancialTransaction" ALTER COLUMN "receiptNumber" SET DEFAULT '';
