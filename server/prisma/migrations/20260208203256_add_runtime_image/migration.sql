-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "runtimeId" TEXT;

-- CreateTable
CREATE TABLE "RuntimeImage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "dockerId" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuntimeImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RuntimeImage_tag_key" ON "RuntimeImage"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "RuntimeImage_dockerId_key" ON "RuntimeImage"("dockerId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_runtimeId_fkey" FOREIGN KEY ("runtimeId") REFERENCES "RuntimeImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
