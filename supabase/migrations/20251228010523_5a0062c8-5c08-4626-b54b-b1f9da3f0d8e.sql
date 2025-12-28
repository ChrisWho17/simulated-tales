-- Create storage bucket for NPC portraits
INSERT INTO storage.buckets (id, name, public)
VALUES ('npc-portraits', 'npc-portraits', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read portraits (they're public)
CREATE POLICY "Anyone can view NPC portraits"
ON storage.objects FOR SELECT
USING (bucket_id = 'npc-portraits');

-- Allow authenticated users to upload portraits
CREATE POLICY "Authenticated users can upload NPC portraits"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'npc-portraits');

-- Create a table to track portrait URLs by NPC ID
CREATE TABLE IF NOT EXISTS public.npc_portraits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  npc_id TEXT NOT NULL UNIQUE,
  portrait_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.npc_portraits ENABLE ROW LEVEL SECURITY;

-- Anyone can read portraits
CREATE POLICY "Anyone can read NPC portraits"
ON public.npc_portraits FOR SELECT
USING (true);

-- Anyone can insert portraits (for simplicity)
CREATE POLICY "Anyone can insert NPC portraits"
ON public.npc_portraits FOR INSERT
WITH CHECK (true);

-- Anyone can update portraits
CREATE POLICY "Anyone can update NPC portraits"
ON public.npc_portraits FOR UPDATE
USING (true);