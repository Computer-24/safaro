/*
  Warnings:

  - You are about to drop the column `supervisorId` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'APPROVER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "supervisorId",
ADD COLUMN     "approverId" TEXT,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
