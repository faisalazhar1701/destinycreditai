-- Add new enum values to support ACTIVE and UNSUBSCRIBED statuses
-- This migration adds the new values without using them in the same statement

-- Add the new enum values (this must be done in a separate step)
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'UNSUBSCRIBED';

-- Now we need a separate migration step to update existing values
-- This would typically be done in a subsequent migration, but we'll include instructions

-- For now, ensure all existing 'active' values remain compatible
-- and all 'canceled' values are handled appropriately
-- Note: The actual value update will need to happen in a separate transaction