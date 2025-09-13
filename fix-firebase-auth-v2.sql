-- Fix database for Firebase Auth - Version 2 (with proper type casting)
-- Run this in Supabase SQL Editor

-- First, let's check the current user_id column type and convert if needed
DO $$ 
BEGIN
    -- Check if user_id is UUID type and convert to TEXT for Firebase compatibility
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'items' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        -- Convert user_id from UUID to TEXT for Firebase compatibility
        ALTER TABLE items ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
    END IF;
END $$;

-- Check if 'chats' table exists and rename to 'conversations'
DO $$ 
BEGIN
    -- Check if chats table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chats') THEN
        -- Rename chats to conversations if it exists
        ALTER TABLE chats RENAME TO conversations;
        
        -- Update column names and types if needed
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'buyer_id') THEN
            ALTER TABLE conversations RENAME COLUMN buyer_id TO requester_id;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'seller_id') THEN
            ALTER TABLE conversations RENAME COLUMN seller_id TO owner_id;
        END IF;
        
        -- Ensure requester_id and owner_id are TEXT type
        ALTER TABLE conversations ALTER COLUMN requester_id TYPE TEXT;
        ALTER TABLE conversations ALTER COLUMN owner_id TYPE TEXT;
        
        -- Add missing columns if needed
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES items(id) ON DELETE CASCADE;
        ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked'));
        
        -- Update messages table reference if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'chat_id') THEN
            ALTER TABLE messages RENAME COLUMN chat_id TO conversation_id;
        END IF;
    END IF;
END $$;

-- Create conversations table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  requester_id TEXT NOT NULL, -- Firebase UID of person asking
  owner_id TEXT NOT NULL,     -- Firebase UID of item owner
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique conversation per item-requester pair
  UNIQUE(item_id, requester_id)
);

-- Update messages table if conversation_id column doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Ensure sender_id in messages is TEXT type for Firebase
ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT;

-- Drop old policies for items (they use auth.uid for Supabase Auth)
DROP POLICY IF EXISTS "Items are viewable by everyone" ON items;
DROP POLICY IF EXISTS "Users can delete own items" ON items;
DROP POLICY IF EXISTS "Users can insert own items" ON items;
DROP POLICY IF EXISTS "Users can update own items" ON items;

-- Create new policies for items (Firebase Auth compatible with TEXT casting)
CREATE POLICY "Users can view all active items" ON items
  FOR SELECT USING (status IN ('active', 'sold', 'reserved'));

CREATE POLICY "Users can manage their own items" ON items
  FOR ALL USING (user_id = (auth.jwt() ->> 'sub')::TEXT);

CREATE POLICY "Users can create items" ON items
  FOR INSERT WITH CHECK (user_id = (auth.jwt() ->> 'sub')::TEXT);

-- Drop old policies for messages
DROP POLICY IF EXISTS "Chat participants can send messages" ON messages;
DROP POLICY IF EXISTS "Chat participants can view messages" ON messages;

-- Create new policies for messages (Firebase Auth compatible)
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (
        requester_id = (auth.jwt() ->> 'sub')::TEXT OR 
        owner_id = (auth.jwt() ->> 'sub')::TEXT
      )
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = (auth.jwt() ->> 'sub')::TEXT AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (
        requester_id = (auth.jwt() ->> 'sub')::TEXT OR 
        owner_id = (auth.jwt() ->> 'sub')::TEXT
      )
    )
  );

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (
    sender_id != (auth.jwt() ->> 'sub')::TEXT AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (
        requester_id = (auth.jwt() ->> 'sub')::TEXT OR 
        owner_id = (auth.jwt() ->> 'sub')::TEXT
      )
    )
  );

-- Create policies for conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    requester_id = (auth.jwt() ->> 'sub')::TEXT OR 
    owner_id = (auth.jwt() ->> 'sub')::TEXT
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    requester_id = (auth.jwt() ->> 'sub')::TEXT
  );

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    requester_id = (auth.jwt() ->> 'sub')::TEXT OR 
    owner_id = (auth.jwt() ->> 'sub')::TEXT
  );

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(requester_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_item ON conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Update conversation timestamp trigger
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

-- Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;