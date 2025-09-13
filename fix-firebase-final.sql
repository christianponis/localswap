-- Fix Firebase Auth - Final version handling foreign key constraints properly
-- Run this in Supabase SQL Editor

-- STEP 1: Drop all existing policies first
DROP POLICY IF EXISTS "Items are viewable by everyone" ON items;
DROP POLICY IF EXISTS "Users can delete own items" ON items;
DROP POLICY IF EXISTS "Users can insert own items" ON items;
DROP POLICY IF EXISTS "Users can update own items" ON items;
DROP POLICY IF EXISTS "Chat participants can send messages" ON messages;
DROP POLICY IF EXISTS "Chat participants can view messages" ON messages;

-- STEP 2: Handle the chats to conversations migration with foreign key constraints
DO $$ 
BEGIN
    RAISE NOTICE 'Starting chats to conversations migration...';
    
    -- Drop the foreign key constraint from messages first
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;
    
    -- Rename chats table to conversations
    ALTER TABLE chats RENAME TO conversations;
    RAISE NOTICE 'Renamed chats to conversations';
    
    -- Rename columns in conversations table
    ALTER TABLE conversations RENAME COLUMN buyer_id TO requester_id;
    ALTER TABLE conversations RENAME COLUMN seller_id TO owner_id;
    RAISE NOTICE 'Renamed buyer_id to requester_id, seller_id to owner_id';
    
    -- Convert ID columns to TEXT for Firebase compatibility
    ALTER TABLE conversations ALTER COLUMN requester_id TYPE TEXT USING requester_id::TEXT;
    ALTER TABLE conversations ALTER COLUMN owner_id TYPE TEXT USING owner_id::TEXT;
    RAISE NOTICE 'Converted requester_id and owner_id to TEXT';
    
    -- Add missing columns if they don't exist
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked'));
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- Add unique constraint for item_id + requester_id if not exists
    ALTER TABLE conversations ADD CONSTRAINT unique_item_requester UNIQUE (item_id, requester_id);
    
    -- Rename chat_id to conversation_id in messages table
    ALTER TABLE messages RENAME COLUMN chat_id TO conversation_id;
    RAISE NOTICE 'Renamed chat_id to conversation_id in messages';
    
    -- Re-add the foreign key constraint with new names
    ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey 
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Re-added foreign key constraint';
END $$;

-- STEP 3: Convert user_id and sender_id to TEXT for Firebase
DO $$ 
DECLARE
    user_id_type text;
    sender_id_type text;
BEGIN
    -- Convert user_id in items table
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'user_id' AND table_schema = 'public';
    
    IF user_id_type = 'uuid' THEN
        RAISE NOTICE 'Converting items.user_id from UUID to TEXT';
        ALTER TABLE items ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    END IF;
    
    -- Convert sender_id in messages table
    SELECT data_type INTO sender_id_type
    FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'sender_id' AND table_schema = 'public';
    
    IF sender_id_type = 'uuid' THEN
        RAISE NOTICE 'Converting messages.sender_id from UUID to TEXT';
        ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::TEXT;
    END IF;
END $$;

-- STEP 4: Create simple permissive policies for initial testing
-- These allow all operations - we'll add proper Firebase Auth policies later

-- Items policies
CREATE POLICY "Allow reads on items" ON items 
    FOR SELECT USING (true);

CREATE POLICY "Allow inserts on items" ON items 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow updates on items" ON items 
    FOR UPDATE USING (true);

CREATE POLICY "Allow deletes on items" ON items 
    FOR DELETE USING (true);

-- Conversations policies
CREATE POLICY "Allow reads on conversations" ON conversations 
    FOR SELECT USING (true);

CREATE POLICY "Allow inserts on conversations" ON conversations 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow updates on conversations" ON conversations 
    FOR UPDATE USING (true);

-- Messages policies
CREATE POLICY "Allow reads on messages" ON messages 
    FOR SELECT USING (true);

CREATE POLICY "Allow inserts on messages" ON messages 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow updates on messages" ON messages 
    FOR UPDATE USING (true);

-- STEP 5: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_requester ON conversations(requester_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_item ON conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- STEP 6: Create trigger to update conversation timestamp
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

-- STEP 7: Grant all necessary permissions
GRANT ALL ON items TO authenticated;
GRANT ALL ON conversations TO authenticated; 
GRANT ALL ON messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success notification
DO $$ 
BEGIN
    RAISE NOTICE '✅ Database migration completed successfully!';
    RAISE NOTICE '📋 Summary:';
    RAISE NOTICE '   - Renamed chats → conversations';
    RAISE NOTICE '   - Renamed buyer_id → requester_id, seller_id → owner_id';
    RAISE NOTICE '   - Renamed chat_id → conversation_id'; 
    RAISE NOTICE '   - Converted UUID columns to TEXT for Firebase compatibility';
    RAISE NOTICE '   - Added permissive policies for testing';
    RAISE NOTICE '   - Created performance indexes';
    RAISE NOTICE '   - Added conversation timestamp trigger';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your app should now work with the real database!';
    RAISE NOTICE '   Try publishing an item and sending messages.';
END $$;