-- Create storage bucket for sound effects
INSERT INTO storage.buckets (id, name, public)
VALUES ('sound-effects', 'sound-effects', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to sound effects
CREATE POLICY "Public can read sound effects"
ON storage.objects FOR SELECT
USING (bucket_id = 'sound-effects');

-- Allow authenticated users to upload (for admin tool)
CREATE POLICY "Authenticated users can upload sound effects"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sound-effects');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update sound effects"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sound-effects');

-- Create a table to track generated sounds
CREATE TABLE public.generated_sounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  prompt TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_sounds ENABLE ROW LEVEL SECURITY;

-- Public read access for sounds
CREATE POLICY "Anyone can read generated sounds"
ON public.generated_sounds FOR SELECT
USING (true);

-- Only authenticated can insert
CREATE POLICY "Authenticated can insert sounds"
ON public.generated_sounds FOR INSERT
WITH CHECK (true);