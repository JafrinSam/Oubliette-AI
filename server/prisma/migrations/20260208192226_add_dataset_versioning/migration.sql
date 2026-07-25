/*
  Warnings:

  - You are about to drop the column `datasetHash` on the `Job` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,version]` on the table `Dataset` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `datasetId` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_datasetHash_fkey";

-- DropIndex
DROP INDEX "Dataset_hash_key";

-- AlterTable
ALTER TABLE "Dataset" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Untitled Dataset',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "datasetHash",
ADD COLUMN     "datasetId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_name_version_key" ON "Dataset"("name", "version");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
