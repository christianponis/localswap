-- Check current database schema to see what columns exist
-- Run this in Supabase SQL Editor

-- Check items table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if specific columns exist
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'latitude') THEN 'YES' ELSE 'NO' END as has_latitude,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'longitude') THEN 'YES' ELSE 'NO' END as has_longitude,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'kind') THEN 'YES' ELSE 'NO' END as has_kind,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'location') THEN 'YES' ELSE 'NO' END as has_location;