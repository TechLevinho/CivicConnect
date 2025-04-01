-- Drop existing columns if they exist
ALTER TABLE "issues" 
DROP COLUMN IF EXISTS "coordinates",
DROP COLUMN IF EXISTS "category",
DROP COLUMN IF EXISTS "assigned_org_id",
DROP COLUMN IF EXISTS "image_url";

-- Add new columns
ALTER TABLE "issues" 
ADD COLUMN IF NOT EXISTS "latitude" text,
ADD COLUMN IF NOT EXISTS "longitude" text;

-- Update existing issues to have null coordinates
UPDATE "issues" 
SET "latitude" = NULL, "longitude" = NULL 
WHERE "latitude" IS NULL OR "longitude" IS NULL; 