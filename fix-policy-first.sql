-- Fix database by dropping ALL policies first, then converting types
-- Run this in Supabase SQL Editor

-- STEP 1: Get all existing policies and drop them
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on items table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'items' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON items';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
    
    -- Drop all policies on messages table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON messages';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
    
    -- Drop all policies on conversations table (if exists)
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'conversations' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON conversations';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
    
    -- Drop all policies on chats table (if exists)
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'chats' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON chats';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
    
    RAISE NOTICE 'All policies dropped successfully';
END $$;

-- STEP 2: Drop foreign key constraints
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_item_id_fkey;

-- STEP 3: Disable RLS temporarily
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;

-- STEP 4: Now safely convert types and rename tables
DO $$ 
BEGIN
    RAISE NOTICE 'Starting table conversions...';
    
    -- Convert user_id in items table from UUID to TEXT
    ALTER TABLE items ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    RAISE NOTICE 'Converted items.user_id to TEXT';
    
    -- Convert sender_id in messages table from UUID to TEXT  
    ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::TEXT;
    RAISE NOTICE 'Converted messages.sender_id to TEXT';
    
    -- Rename chats table to conversations
    ALTER TABLE chats RENAME TO conversations;
    RAISE NOTICE 'Renamed chats to conversations';
    
    -- Rename columns and convert types in conversations
    ALTER TABLE conversations RENAME COLUMN buyer_id TO requester_id;
    ALTER TABLE conversations RENAME COLUMN seller_id TO owner_id;
    RAISE NOTICE 'Renamed buyer_id/seller_id to requester_id/owner_id';
    
    -- Convert the ID columns to TEXT
    ALTER TABLE conversations ALTER COLUMN requester_id TYPE TEXT USING requester_id::TEXT;
    ALTER TABLE conversations ALTER COLUMN owner_id TYPE TEXT USING owner_id::TEXT;
    RAISE NOTICE 'Converted requester_id/owner_id to TEXT';
    
    -- Add missing columns
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked'));
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- Rename chat_id to conversation_id in messages
    ALTER TABLE messages RENAME COLUMN chat_id TO conversation_id;
    RAISE NOTICE 'Renamed chat_id to conversation_id';
    
    -- Re-add foreign key constraints
    ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey 
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
    
    -- Add unique constraint
    ALTER TABLE conversations ADD CONSTRAINT unique_item_requester UNIQUE (item_id, requester_id);
    
    RAISE NOTICE 'All conversions completed successfully!';
END $$;

-- STEP 5: Re-enable RLS and create simple permissive policies
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;  
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow everything (for testing)
CREATE POLICY "items_all_access" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "conversations_all_access" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "messages_all_access" ON messages FOR ALL USING (true) WITH CHECK (true);

-- STEP 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_requester ON conversations(requester_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_item ON conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- STEP 7: Create conversation timestamp trigger
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

-- STEP 8: Grant permissions
GRANT ALL ON items TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final success message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY! 🎉';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ All policies removed and recreated';
    RAISE NOTICE '✅ UUID columns converted to TEXT for Firebase';
    RAISE NOTICE '✅ chats → conversations migration complete';
    RAISE NOTICE '✅ Foreign key constraints updated';
    RAISE NOTICE '✅ Performance indexes created';
    RAISE NOTICE '✅ Conversation timestamp trigger added';
    RAISE NOTICE '✅ Permissive policies for testing enabled';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your LocalSwap app should now work with real database!';
    RAISE NOTICE '📱 Try publishing items and sending messages!';
    RAISE NOTICE '';
END $$;