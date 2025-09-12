-- Add 'kind' column to items table to distinguish between objects and services
ALTER TABLE items 
ADD COLUMN kind TEXT DEFAULT 'object' CHECK (kind IN ('object', 'service'));

-- Update existing records to have 'object' as default kind
UPDATE items SET kind = 'object' WHERE kind IS NULL;

-- Make kind NOT NULL after setting defaults
ALTER TABLE items ALTER COLUMN kind SET NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN items.kind IS 'Type of listing: object (physical items) or service (offered services)';