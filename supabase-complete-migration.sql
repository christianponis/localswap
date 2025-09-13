-- LocalSwap Complete Database Migration
-- Run this in Supabase SQL Editor

-- Enable PostGIS for geolocation features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('offer', 'request')),
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS geography point
  address_hint TEXT, -- Human readable location hint
  image_urls TEXT[] DEFAULT '{}', -- Array of image URLs
  user_id TEXT NOT NULL, -- Firebase UID
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'reserved', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
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

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,    -- Firebase UID
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_location ON items USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(requester_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_item ON conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update conversation timestamp when message added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update timestamps
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all active items" ON items;
DROP POLICY IF EXISTS "Users can manage their own items" ON items;
DROP POLICY IF EXISTS "Users can create items" ON items;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;

-- RLS Policies for items
CREATE POLICY "Users can view all active items" ON items
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their own items" ON items
  FOR ALL USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create items" ON items
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    requester_id = auth.jwt() ->> 'sub' OR 
    owner_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    requester_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (
    requester_id = auth.jwt() ->> 'sub' OR 
    owner_id = auth.jwt() ->> 'sub'
  );

-- RLS Policies for messages  
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (
        requester_id = auth.jwt() ->> 'sub' OR 
        owner_id = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.jwt() ->> 'sub' AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (
        requester_id = auth.jwt() ->> 'sub' OR 
        owner_id = auth.jwt() ->> 'sub'
      )
    )
  );

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (
    sender_id != auth.jwt() ->> 'sub' AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (
        requester_id = auth.jwt() ->> 'sub' OR 
        owner_id = auth.jwt() ->> 'sub'
      )
    )
  );

-- Grant permissions
GRANT ALL ON items TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create storage bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('items', 'items', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy for storage bucket
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'items' AND auth.role() = 'authenticated');

CREATE POLICY "Images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'items');

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'items' AND auth.uid()::text = (storage.foldername(name))[1]);