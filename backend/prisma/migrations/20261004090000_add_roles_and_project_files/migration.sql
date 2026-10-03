-- Adds read-only accounts, and persisted project files (CAD uploads +
-- generated PDFs) backed by S3-compatible object storage.

-- Existing accounts were created before roles existed and were implicitly
-- full admins, so the default backfills them correctly.
ALTER TABLE "AdminUser" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'admin';

CREATE TABLE "ProjectFile" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectFile_projectId_idx" ON "ProjectFile"("projectId");

ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
