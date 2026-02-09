-- AlterTable
ALTER TABLE "Script" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Untitled',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
