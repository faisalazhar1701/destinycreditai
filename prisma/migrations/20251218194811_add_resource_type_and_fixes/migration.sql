/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ResourceLink" ADD COLUMN     "description" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'EXTERNAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;
