/*
  Warnings:

  - The values [ticket,investigation,action] on the enum `ItemType` will be removed. If these variants are still used in the database, this will fail.
  - The values [Critical,High,Medium,Low] on the enum `Severity` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ItemType_new" AS ENUM ('TICKET', 'INVESTIGATION', 'ACTION');
ALTER TABLE "InboxItem" ALTER COLUMN "type" TYPE "ItemType_new" USING ("type"::text::"ItemType_new");
ALTER TYPE "ItemType" RENAME TO "ItemType_old";
ALTER TYPE "ItemType_new" RENAME TO "ItemType";
DROP TYPE "public"."ItemType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Severity_new" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
ALTER TABLE "public"."Ticket" ALTER COLUMN "severity" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "severity" TYPE "Severity_new" USING ("severity"::text::"Severity_new");
ALTER TYPE "Severity" RENAME TO "Severity_old";
ALTER TYPE "Severity_new" RENAME TO "Severity";
DROP TYPE "public"."Severity_old";
ALTER TABLE "Ticket" ALTER COLUMN "severity" SET DEFAULT 'MEDIUM';
COMMIT;

-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_investigationId_fkey";

-- DropForeignKey
ALTER TABLE "InboxItem" DROP CONSTRAINT "InboxItem_actionId_fkey";

-- DropForeignKey
ALTER TABLE "InboxItem" DROP CONSTRAINT "InboxItem_investigationId_fkey";

-- DropForeignKey
ALTER TABLE "InboxItem" DROP CONSTRAINT "InboxItem_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "Investigation" DROP CONSTRAINT "Investigation_ticketId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ALTER COLUMN "severity" SET DEFAULT 'MEDIUM';

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
