/*
  Warnings:

  - You are about to drop the column `userScript` on the `Job` table. All the data in the column will be lost.
  - Added the required column `scriptId` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "userScript",
ADD COLUMN     "scriptId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "integrityHash" TEXT NOT NULL,
    "encryptedPath" TEXT NOT NULL,
    "encryptionKeyId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_datasetHash_fkey" FOREIGN KEY ("datasetHash") REFERENCES "Dataset"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
