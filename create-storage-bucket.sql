-- Create storage bucket for item images
-- Run this in Supabase SQL Editor after creating tables

-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('items', 'items', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage bucket
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'items' AND auth.role() = 'authenticated');

CREATE POLICY "Images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'items');

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'items' AND auth.uid()::text = (storage.foldername(name))[1]);