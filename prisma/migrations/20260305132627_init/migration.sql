-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "scoreGlobal" INTEGER NOT NULL DEFAULT 0,
    "scoreSocial" INTEGER NOT NULL DEFAULT 0,
    "scoreWeb" INTEGER NOT NULL DEFAULT 0,
    "scoreGBP" INTEGER NOT NULL DEFAULT 0,
    "scoreFunnel" INTEGER NOT NULL DEFAULT 0,
    "scoreBranding" INTEGER NOT NULL DEFAULT 0,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "answersJSON" JSONB NOT NULL,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);
