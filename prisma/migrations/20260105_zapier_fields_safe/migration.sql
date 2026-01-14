-- Check and add plan column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'plan') THEN
    ALTER TABLE "User" ADD COLUMN "plan" TEXT;
  END IF;
END $$;

-- Check and add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'status') THEN
    ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'REGISTERED';
  END IF;
END $$;

-- Check and add inviteToken column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'inviteToken') THEN
    ALTER TABLE "User" ADD COLUMN "inviteToken" TEXT;
  END IF;
END $$;

-- Check and add inviteExpiresAt column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'inviteExpiresAt') THEN
    ALTER TABLE "User" ADD COLUMN "inviteExpiresAt" TIMESTAMP(3);
  END IF;
END $$;

-- Create index on inviteToken if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'User' AND indexname = 'User_inviteToken_idx') THEN
    CREATE INDEX "User_inviteToken_idx" ON "User"("inviteToken");
  END IF;
END $$;

-- Update existing users to have proper status (only run where status is still default or missing)
UPDATE "User" 
SET "status" = CASE 
  WHEN "active" = true THEN 'ACTIVE'::"UserStatus"
  WHEN "active" = false AND "password" IS NOT NULL THEN 'INVITED'::"UserStatus"
  ELSE 'REGISTERED'::"UserStatus"
END
WHERE "status" IS NULL OR "status" = 'REGISTERED';