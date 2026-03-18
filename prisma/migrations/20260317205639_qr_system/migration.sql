-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_mozoId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'MOZO',
ALTER COLUMN "mozoId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "needsAttention" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_mozoId_fkey" FOREIGN KEY ("mozoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
