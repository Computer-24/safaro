/*
  Warnings:

  - You are about to drop the `InboxItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `companyId` to the `Action` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Action` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Investigation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Investigation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Made the column `approverId` on table `Ticket` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('POSITIVE', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('BEHAVIOR', 'CONDITION', 'NEAR_MISS', 'EQUIPMENT', 'PPE', 'HOUSEKEEPING', 'ERGONOMICS', 'CHEMICAL', 'FIRE_SAFETY', 'ELECTRICAL', 'ENVIRONMENT', 'SECURITY', 'OTHER');

-- AlterEnum
ALTER TYPE "Severity" ADD VALUE 'NONE';

-- DropForeignKey
ALTER TABLE "InboxItem" DROP CONSTRAINT "InboxItem_actionId_fkey";

-- DropForeignKey
ALTER TABLE "InboxItem" DROP CONSTRAINT "InboxItem_investigationId_fkey";

-- DropForeignKey
ALTER TABLE "InboxItem" DROP CONSTRAINT "InboxItem_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_approverId_fkey";

-- DropIndex
DROP INDEX "Ticket_archivedAt_idx";

-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Investigation" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "observationType" "ObservationType" NOT NULL DEFAULT 'NEGATIVE',
ADD COLUMN     "updatedById" TEXT,
DROP COLUMN "category",
ADD COLUMN     "category" "TicketCategory" NOT NULL,
ALTER COLUMN "severity" SET DEFAULT 'NONE',
ALTER COLUMN "approverId" SET NOT NULL;

-- DropTable
DROP TABLE "InboxItem";

-- CreateTable
CREATE TABLE "InboxTicket" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboxTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxInvestigation" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboxInvestigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxAction" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboxAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InboxTicket_ticketId_key" ON "InboxTicket"("ticketId");

-- CreateIndex
CREATE INDEX "InboxTicket_isNew_idx" ON "InboxTicket"("isNew");

-- CreateIndex
CREATE INDEX "InboxTicket_createdAt_idx" ON "InboxTicket"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InboxInvestigation_investigationId_key" ON "InboxInvestigation"("investigationId");

-- CreateIndex
CREATE INDEX "InboxInvestigation_isNew_idx" ON "InboxInvestigation"("isNew");

-- CreateIndex
CREATE INDEX "InboxInvestigation_createdAt_idx" ON "InboxInvestigation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InboxAction_actionId_key" ON "InboxAction"("actionId");

-- CreateIndex
CREATE INDEX "InboxAction_isNew_idx" ON "InboxAction"("isNew");

-- CreateIndex
CREATE INDEX "InboxAction_createdAt_idx" ON "InboxAction"("createdAt");

-- CreateIndex
CREATE INDEX "Action_companyId_idx" ON "Action"("companyId");

-- CreateIndex
CREATE INDEX "Investigation_companyId_idx" ON "Investigation"("companyId");

-- CreateIndex
CREATE INDEX "Ticket_companyId_idx" ON "Ticket"("companyId");

-- CreateIndex
CREATE INDEX "Ticket_category_idx" ON "Ticket"("category");

-- CreateIndex
CREATE INDEX "Ticket_observationType_idx" ON "Ticket"("observationType");

-- CreateIndex
CREATE INDEX "Ticket_severity_idx" ON "Ticket"("severity");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxTicket" ADD CONSTRAINT "InboxTicket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxInvestigation" ADD CONSTRAINT "InboxInvestigation_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxAction" ADD CONSTRAINT "InboxAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
