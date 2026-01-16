-- Update existing subscription status values to use new naming convention
-- This migration runs after the enum values have been added

-- Update 'active' values to 'ACTIVE'
UPDATE "User" 
SET "subscription_status" = 'ACTIVE'
WHERE "subscription_status" = 'active';

-- Update 'canceled' values to 'UNSUBSCRIBED' 
UPDATE "User"
SET "subscription_status" = 'UNSUBSCRIBED'
WHERE "subscription_status" = 'canceled';