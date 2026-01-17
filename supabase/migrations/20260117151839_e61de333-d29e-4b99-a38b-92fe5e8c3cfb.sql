-- Create inventory sync debug logs table
CREATE TABLE public.inventory_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  campaign_id TEXT,
  app_version TEXT NOT NULL,
  build_number TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('pickup', 'drop', 'consume', 'loot_tag', 'drop_tag', 'use_tag', 'match_attempt', 'warning', 'error')),
  item_name TEXT,
  matched_to TEXT,
  instance_id TEXT,
  confidence TEXT,
  source TEXT,
  pattern_used TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient querying by session and time
CREATE INDEX idx_inventory_sync_logs_session ON public.inventory_sync_logs(session_id, created_at DESC);

-- Index for version-based filtering
CREATE INDEX idx_inventory_sync_logs_version ON public.inventory_sync_logs(app_version, build_number);

-- Index for event type filtering
CREATE INDEX idx_inventory_sync_logs_event_type ON public.inventory_sync_logs(event_type);

-- Enable RLS but allow public inserts for anonymous logging
ALTER TABLE public.inventory_sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert logs (debugging purposes)
CREATE POLICY "Anyone can insert inventory sync logs"
ON public.inventory_sync_logs
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view logs (or service role)
CREATE POLICY "Authenticated users can view their session logs"
ON public.inventory_sync_logs
FOR SELECT
USING (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

-- Allow service role full access for cleanup
CREATE POLICY "Service role can manage logs"
ON public.inventory_sync_logs
FOR ALL
USING (auth.role() = 'service_role');

-- Add comment for table documentation
COMMENT ON TABLE public.inventory_sync_logs IS 'Debug logs for inventory sync system. Tracks all item additions, removals, and matching attempts with version tagging for troubleshooting.';