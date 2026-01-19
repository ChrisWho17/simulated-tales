-- Fix inventory_sync_logs RLS policy to restrict SELECT access
-- Logs should only be accessible by service role for administrative/debugging purposes

-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view their session logs" ON public.inventory_sync_logs;

-- Create a new policy that only allows service role to view logs
CREATE POLICY "Only service role can view inventory logs"
ON public.inventory_sync_logs
FOR SELECT
USING (auth.role() = 'service_role');
