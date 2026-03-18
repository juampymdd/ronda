-- CreateTable: Category
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#a855f7',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- Seed categories from existing product data
INSERT INTO "Category" ("id", "name", "color", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    category,
    CASE category
        WHEN 'Cervezas' THEN '#f59e0b'
        WHEN 'Tragos'   THEN '#06b6d4'
        WHEN 'Tapeo'    THEN '#10b981'
        WHEN 'Platos'   THEN '#ef4444'
        ELSE '#a855f7'
    END,
    NOW(),
    NOW()
FROM (SELECT DISTINCT category FROM "Product") AS distinct_cats;

-- Add categoryId column as nullable first
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

-- Populate categoryId from existing category string
UPDATE "Product" p
SET "categoryId" = c.id
FROM "Category" c
WHERE c.name = p.category;

-- Make categoryId NOT NULL now that it's populated
ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;

-- Drop old category string column
ALTER TABLE "Product" DROP COLUMN "category";

-- Add foreign key
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
