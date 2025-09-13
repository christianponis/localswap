-- Check existing database structure
-- Run this in Supabase SQL Editor to see what already exists

-- Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('items', 'conversations', 'messages')
ORDER BY table_name;

-- Check items table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if storage buckets exist
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'items';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('items', 'conversations', 'messages');