-- AlterTable
ALTER TABLE "ModelVersion" ADD COLUMN     "auditReport" JSONB,
ADD COLUMN     "isAudited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "securityScore" DOUBLE PRECISION DEFAULT 0.0;
