-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'IMAGE';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN "image_url" TEXT;
