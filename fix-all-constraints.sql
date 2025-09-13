-- Fix database by removing ALL constraints first, then converting types
-- Run this in Supabase SQL Editor

-- STEP 1: Drop all policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Dropping all policies...';
    
    -- Drop all policies from all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
        RAISE NOTICE 'Dropped policy: % on table %', r.policyname, r.tablename;
    END LOOP;
    
    RAISE NOTICE 'All policies dropped';
END $$;

-- STEP 2: Disable RLS on all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Disabling RLS on all tables...';
    
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('items', 'messages', 'chats', 'conversations', 'users')
    ) LOOP
        EXECUTE 'ALTER TABLE ' || r.tablename || ' DISABLE ROW LEVEL SECURITY';
        RAISE NOTICE 'Disabled RLS on: %', r.tablename;
    END LOOP;
END $$;

-- STEP 3: Drop ALL foreign key constraints
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Dropping all foreign key constraints...';
    
    -- Find and drop all foreign key constraints in the public schema
    FOR r IN (
        SELECT 
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || r.constraint_name;
        RAISE NOTICE 'Dropped FK constraint: % on table %', r.constraint_name, r.table_name;
    END LOOP;
    
    RAISE NOTICE 'All foreign key constraints dropped';
END $$;

-- STEP 4: Now safely convert column types
DO $$ 
BEGIN
    RAISE NOTICE 'Converting column types...';
    
    -- Convert user_id in items table from UUID to TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'user_id') THEN
        ALTER TABLE items ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
        RAISE NOTICE 'Converted items.user_id to TEXT';
    END IF;
    
    -- Convert sender_id in messages table from UUID to TEXT  
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'sender_id') THEN
        ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::TEXT;
        RAISE NOTICE 'Converted messages.sender_id to TEXT';
    END IF;
    
    RAISE NOTICE 'Type conversions completed';
END $$;

-- STEP 5: Handle chats to conversations migration
DO $$ 
BEGIN
    -- Check if chats table exists and rename to conversations
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chats') THEN
        RAISE NOTICE 'Migrating chats to conversations...';
        
        -- Rename table
        ALTER TABLE chats RENAME TO conversations;
        RAISE NOTICE 'Renamed chats to conversations';
        
        -- Rename and convert columns
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'buyer_id') THEN
            ALTER TABLE conversations RENAME COLUMN buyer_id TO requester_id;
            RAISE NOTICE 'Renamed buyer_id to requester_id';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'seller_id') THEN
            ALTER TABLE conversations RENAME COLUMN seller_id TO owner_id;
            RAISE NOTICE 'Renamed seller_id to owner_id';
        END IF;
        
        -- Convert ID columns to TEXT
        ALTER TABLE conversations ALTER COLUMN requester_id TYPE TEXT USING requester_id::TEXT;
        ALTER TABLE conversations ALTER COLUMN owner_id TYPE TEXT USING owner_id::TEXT;
        RAISE NOTICE 'Converted requester_id/owner_id to TEXT';
        
        -- Add missing columns
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked'));
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Rename chat_id to conversation_id in messages if exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'chat_id') THEN
            ALTER TABLE messages RENAME COLUMN chat_id TO conversation_id;
            RAISE NOTICE 'Renamed chat_id to conversation_id';
        END IF;
        
    ELSE
        RAISE NOTICE 'No chats table found, creating conversations from scratch';
        
        -- Create conversations table if it doesn't exist
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          item_id UUID,
          requester_id TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Ensure messages has conversation_id column
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID;
    END IF;
END $$;

-- STEP 6: Recreate only essential foreign key constraints (without user table references)
DO $$
BEGIN
    RAISE NOTICE 'Recreating essential foreign key constraints...';
    
    -- Only recreate FK that don't involve user tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        -- conversations.item_id -> items.id
        ALTER TABLE conversations ADD CONSTRAINT conversations_item_id_fkey 
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added conversations -> items FK';
        
        -- messages.conversation_id -> conversations.id  
        ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey 
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added messages -> conversations FK';
    END IF;
    
    -- Add unique constraints
    ALTER TABLE conversations ADD CONSTRAINT unique_item_requester UNIQUE (item_id, requester_id);
    
    RAISE NOTICE 'Essential constraints recreated';
END $$;

-- STEP 7: Re-enable RLS and create permissive policies
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create simple policies for testing
CREATE POLICY "items_all_access" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "conversations_all_access" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "messages_all_access" ON messages FOR ALL USING (true) WITH CHECK (true);

-- STEP 8: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_conversations_item ON conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_conversations_requester ON conversations(requester_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- STEP 9: Create timestamp trigger
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- STEP 10: Grant permissions
GRANT ALL ON items TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉 DATABASE MIGRATION FINALLY COMPLETED! 🎉🎉';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ ALL policies removed successfully';
    RAISE NOTICE '✅ ALL foreign key constraints handled';
    RAISE NOTICE '✅ UUID → TEXT conversions completed';
    RAISE NOTICE '✅ chats → conversations migration done';
    RAISE NOTICE '✅ Essential constraints recreated';
    RAISE NOTICE '✅ Performance indexes created';
    RAISE NOTICE '✅ Triggers and permissions set';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 LocalSwap is now ready for Firebase Auth!';
    RAISE NOTICE '📱 Test: Publish items and send messages!';
    RAISE NOTICE '';
END $$;