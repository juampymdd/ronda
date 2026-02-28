-- DropForeignKey
ALTER TABLE "Ronda" DROP CONSTRAINT "Ronda_tableId_fkey";

-- AlterTable
ALTER TABLE "Ronda" ADD COLUMN     "tableGroupId" TEXT,
ALTER COLUMN "tableId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "tableGroupId" TEXT;

-- CreateTable
CREATE TABLE "TableGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_tableGroupId_fkey" FOREIGN KEY ("tableGroupId") REFERENCES "TableGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ronda" ADD CONSTRAINT "Ronda_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ronda" ADD CONSTRAINT "Ronda_tableGroupId_fkey" FOREIGN KEY ("tableGroupId") REFERENCES "TableGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
