-- Add new enum values to the existing SubscriptionStatus enum
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'UNSUBSCRIBED';

-- Update existing records to use the new enum values
-- Convert 'active' to 'ACTIVE' and 'canceled' to 'UNSUBSCRIBED'
UPDATE "User" 
SET "subscription_status" = 'ACTIVE'
WHERE "subscription_status" = 'active';

UPDATE "User" 
SET "subscription_status" = 'UNSUBSCRIBED'
WHERE "subscription_status" = 'canceled';

-- The enum type now supports all values, but we've migrated the data to use the new naming convention