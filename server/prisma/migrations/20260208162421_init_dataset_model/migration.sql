-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "datasetHash" TEXT NOT NULL,
    "userScript" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "containerId" TEXT,
    "exitCode" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "logPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_hash_key" ON "Dataset"("hash");
