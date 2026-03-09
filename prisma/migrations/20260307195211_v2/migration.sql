/*
  Warnings:

  - Added the required column `updatedAt` to the `Audit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Audit" ADD COLUMN     "competitorsJSON" JSONB,
ADD COLUMN     "lostClientsJSON" JSONB,
ADD COLUMN     "sectorPercentile" INTEGER,
ADD COLUMN     "sectorTemplateId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "city" SET DEFAULT '',
ALTER COLUMN "sector" SET DEFAULT '';

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_token_key" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "AdminSession_token_idx" ON "AdminSession"("token");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE INDEX "Audit_email_idx" ON "Audit"("email");

-- CreateIndex
CREATE INDEX "Audit_createdAt_idx" ON "Audit"("createdAt");

-- CreateIndex
CREATE INDEX "Audit_isUnlocked_idx" ON "Audit"("isUnlocked");

-- CreateIndex
CREATE INDEX "Audit_sector_idx" ON "Audit"("sector");

-- CreateIndex
CREATE INDEX "Audit_sectorTemplateId_idx" ON "Audit"("sectorTemplateId");
