-- Add icon field to Category table
ALTER TABLE "Category" ADD COLUMN "icon" TEXT NOT NULL DEFAULT 'Tag';
