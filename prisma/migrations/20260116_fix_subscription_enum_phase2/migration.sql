-- Phase 2: Update existing values to use new enum values
-- This migration must run after the new enum values are committed to the database

-- Update 'active' values to 'ACTIVE'
UPDATE "User" 
SET "subscription_status" = 'ACTIVE'
WHERE "subscription_status" = 'active';

-- Update 'canceled' values to 'UNSUBSCRIBED' 
UPDATE "User"
SET "subscription_status" = 'UNSUBSCRIBED'
WHERE "subscription_status" = 'canceled';