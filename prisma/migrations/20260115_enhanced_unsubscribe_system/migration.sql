-- Create SubscriptionStatus enum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled');

-- Add subscription_status and unsubscribed_at columns to User table
ALTER TABLE "User" 
ADD COLUMN "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
ADD COLUMN "unsubscribed_at" TIMESTAMP(3);

-- Drop the old subscribed boolean column
ALTER TABLE "User" DROP COLUMN "subscribed";