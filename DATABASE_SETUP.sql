-- Add images column to items table
-- Run this in your Supabase SQL editor

-- Add images column as JSON array to store image URLs
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN items.images IS 'Array of image URLs for the item';

-- Create an index for better performance when querying by images
CREATE INDEX IF NOT EXISTS idx_items_images ON items USING gin(images);

-- Example of how to insert with images:
-- INSERT INTO items (title, description, category, type, images, user_id) 
-- VALUES ('Test Item', 'Description', 'electronics', 'vendo', 
--         '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]'::jsonb, 
--         'user-uuid-here');