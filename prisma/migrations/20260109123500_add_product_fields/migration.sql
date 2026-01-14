-- Add product fields if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'productName') THEN
    ALTER TABLE "User" ADD COLUMN "productName" TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'productId') THEN
    ALTER TABLE "User" ADD COLUMN "productId" TEXT;
  END IF;
END $$;