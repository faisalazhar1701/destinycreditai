-- Add subscription status field to User table
ALTER TABLE "User" ADD COLUMN "subscribed" BOOLEAN NOT NULL DEFAULT true;