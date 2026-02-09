/*
  Warnings:

  - A unique constraint covering the columns `[name,version]` on the table `Script` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Script" ADD COLUMN     "isLatest" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Script_name_version_key" ON "Script"("name", "version");
