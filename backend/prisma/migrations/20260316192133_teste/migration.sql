-- CreateEnum
CREATE TYPE "FaceMatchDecision" AS ENUM ('APPROVED', 'REVIEW', 'REJECTED');

-- AlterEnum
ALTER TYPE "RecordMethod" ADD VALUE 'FACIAL';

-- CreateTable
CREATE TABLE "face_templates" (
    "id" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "engine" TEXT NOT NULL DEFAULT 'insightface',
    "version" TEXT NOT NULL DEFAULT 'arcface',
    "samples_count" INTEGER NOT NULL DEFAULT 0,
    "quality_score" DOUBLE PRECISION,
    "liveness_passed" BOOLEAN,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "face_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_validation_events" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "decision" "FaceMatchDecision" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "template_id" TEXT,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "time_record_id" TEXT,

    CONSTRAINT "face_validation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "face_templates_user_id_idx" ON "face_templates"("user_id");

-- CreateIndex
CREATE INDEX "face_templates_company_id_idx" ON "face_templates"("company_id");

-- CreateIndex
CREATE INDEX "face_validation_events_user_id_idx" ON "face_validation_events"("user_id");

-- CreateIndex
CREATE INDEX "face_validation_events_company_id_idx" ON "face_validation_events"("company_id");

-- CreateIndex
CREATE INDEX "face_validation_events_template_id_idx" ON "face_validation_events"("template_id");

-- CreateIndex
CREATE INDEX "face_validation_events_time_record_id_idx" ON "face_validation_events"("time_record_id");

-- AddForeignKey
ALTER TABLE "face_templates" ADD CONSTRAINT "face_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_templates" ADD CONSTRAINT "face_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_validation_events" ADD CONSTRAINT "face_validation_events_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "face_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_validation_events" ADD CONSTRAINT "face_validation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_validation_events" ADD CONSTRAINT "face_validation_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_validation_events" ADD CONSTRAINT "face_validation_events_time_record_id_fkey" FOREIGN KEY ("time_record_id") REFERENCES "time_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
