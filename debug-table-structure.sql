-- Debug current table structure to understand the UUID vs TEXT issue
-- Run this first to see the current state

-- Check items table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check messages table structure  
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if conversations or chats table exists and their structure
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('conversations', 'chats')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check existing policies to see which ones are causing the issue
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('items', 'messages', 'conversations', 'chats');

-- Check for any foreign key constraints that might be causing issues
SELECT
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('items', 'messages', 'conversations', 'chats')
AND tc.constraint_type = 'FOREIGN KEY';