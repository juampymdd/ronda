-- AlterTable
ALTER TABLE "Ronda" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedById" TEXT;

-- AddForeignKey
ALTER TABLE "Ronda" ADD CONSTRAINT "Ronda_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
