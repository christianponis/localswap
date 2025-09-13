-- Chat/Messages schema for LocalSwap

-- Conversations table - tracks chats between users about items
CREATE TABLE conversations (
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

-- Messages table - individual messages in conversations  
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,    -- Firebase UID
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for faster queries
  INDEX (conversation_id, created_at),
  INDEX (sender_id)
);

-- Update conversations timestamp when new message added
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- RLS policies for security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can see conversations they're part of
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT USING (
    auth.uid()::text = requester_id OR 
    auth.uid()::text = owner_id
  );

-- Users can create conversations as requesters
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid()::text = requester_id);

-- Users can see messages in their conversations
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (requester_id = auth.uid()::text OR owner_id = auth.uid()::text)
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (requester_id = auth.uid()::text OR owner_id = auth.uid()::text)
    )
  );

-- Users can mark their own received messages as read
CREATE POLICY "Users can mark messages as read" ON messages
  FOR UPDATE USING (
    sender_id != auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND (requester_id = auth.uid()::text OR owner_id = auth.uid()::text)
    )
  );