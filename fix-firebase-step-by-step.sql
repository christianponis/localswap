-- Fix Firebase Auth step by step - safer approach
-- Run this in Supabase SQL Editor

-- STEP 1: Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Items are viewable by everyone" ON items;
DROP POLICY IF EXISTS "Users can delete own items" ON items;
DROP POLICY IF EXISTS "Users can insert own items" ON items;
DROP POLICY IF EXISTS "Users can update own items" ON items;
DROP POLICY IF EXISTS "Chat participants can send messages" ON messages;
DROP POLICY IF EXISTS "Chat participants can view messages" ON messages;

-- STEP 2: Convert user_id in items table to TEXT if it's UUID
DO $$ 
DECLARE
    user_id_type text;
BEGIN
    -- Get current data type of user_id
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'items' 
    AND column_name = 'user_id' 
    AND table_schema = 'public';
    
    -- If it's UUID, convert to TEXT
    IF user_id_type = 'uuid' THEN
        RAISE NOTICE 'Converting user_id from UUID to TEXT';
        ALTER TABLE items ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    ELSE
        RAISE NOTICE 'user_id is already type: %', user_id_type;
    END IF;
END $$;

-- STEP 3: Convert sender_id in messages table to TEXT if needed
DO $$ 
DECLARE
    sender_id_type text;
BEGIN
    SELECT data_type INTO sender_id_type
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'sender_id' 
    AND table_schema = 'public';
    
    IF sender_id_type = 'uuid' THEN
        RAISE NOTICE 'Converting sender_id from UUID to TEXT';
        ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::TEXT;
    ELSE
        RAISE NOTICE 'sender_id is already type: %', sender_id_type;
    END IF;
END $$;

-- STEP 4: Handle chats/conversations table conversion
DO $$ 
BEGIN
    -- If chats table exists, rename and modify it
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chats') THEN
        RAISE NOTICE 'Found chats table, converting to conversations';
        
        -- Rename table
        ALTER TABLE chats RENAME TO conversations;
        
        -- Rename columns if they exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'buyer_id') THEN
            ALTER TABLE conversations RENAME COLUMN buyer_id TO requester_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'seller_id') THEN
            ALTER TABLE conversations RENAME COLUMN seller_id TO owner_id;
        END IF;
        
        -- Convert ID columns to TEXT
        ALTER TABLE conversations ALTER COLUMN requester_id TYPE TEXT USING requester_id::TEXT;
        ALTER TABLE conversations ALTER COLUMN owner_id TYPE TEXT USING owner_id::TEXT;
        
        -- Add missing columns
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES items(id) ON DELETE CASCADE;
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked'));
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Update messages table reference
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'chat_id') THEN
            ALTER TABLE messages RENAME COLUMN chat_id TO conversation_id;
        END IF;
        
    ELSE
        RAISE NOTICE 'No chats table found, creating conversations table';
        
        -- Create conversations table from scratch
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          item_id UUID REFERENCES items(id) ON DELETE CASCADE,
          requester_id TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(item_id, requester_id)
        );
    END IF;
    
    -- Ensure messages has conversation_id column
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
END $$;

-- STEP 5: Create simple policies without auth functions first (for testing)
CREATE POLICY "Allow all reads on items" ON items FOR SELECT USING (true);
CREATE POLICY "Allow authenticated inserts on items" ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated updates on items" ON items FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated deletes on items" ON items FOR DELETE USING (true);

CREATE POLICY "Allow all reads on conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated operations on conversations" ON conversations FOR ALL WITH CHECK (true);

CREATE POLICY "Allow all reads on messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow authenticated operations on messages" ON messages FOR ALL WITH CHECK (true);

-- STEP 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(requester_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_item ON conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- STEP 7: Grant permissions
GRANT ALL ON items TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Database setup completed successfully! Tables are now ready for Firebase Auth.';
    RAISE NOTICE 'You can now test the application - policies are set to allow all operations for testing.';
    RAISE NOTICE 'Later you can run a separate script to add proper Firebase Auth policies.';
END $$;