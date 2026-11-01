-- AlterEnum
ALTER TYPE "Category" ADD VALUE 'HORTALICAS' BEFORE 'OUTROS';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "fee_cents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN "small_order_fee_cents" INTEGER NOT NULL DEFAULT 5000;
