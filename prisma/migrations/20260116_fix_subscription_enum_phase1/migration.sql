-- Phase 1: Add new enum values (must be done separately from using them)
-- This migration adds the new 'ACTIVE' and 'UNSUBSCRIBED' values to the enum type

ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'UNSUBSCRIBED';