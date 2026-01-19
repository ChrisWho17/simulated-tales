-- Fix: inventory_sync_logs allows anyone to insert (security issue)
-- Drop the overly permissive policy and require authentication or service role

DROP POLICY IF EXISTS "Anyone can insert inventory sync logs" ON public.inventory_sync_logs;

-- Create a new policy that only allows authenticated users or service role to insert
CREATE POLICY "Authenticated users can insert inventory sync logs" 
ON public.inventory_sync_logs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

-- Fix: npc_portraits service role policies use USING(true) which is flagged
-- These are actually correct for service role operations since the RLS is RESTRICTIVE
-- and only service_role can match. However, we can make them explicit.

-- First drop the existing service role policies
DROP POLICY IF EXISTS "Service role can delete NPC portraits" ON public.npc_portraits;
DROP POLICY IF EXISTS "Service role can insert NPC portraits" ON public.npc_portraits;
DROP POLICY IF EXISTS "Service role can update NPC portraits" ON public.npc_portraits;

-- Recreate with explicit service role check
CREATE POLICY "Service role can delete NPC portraits" 
ON public.npc_portraits 
FOR DELETE 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert NPC portraits" 
ON public.npc_portraits 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update NPC portraits" 
ON public.npc_portraits 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- Fix: generated_sounds service role policies use USING(true)
DROP POLICY IF EXISTS "Service role can delete sounds" ON public.generated_sounds;
DROP POLICY IF EXISTS "Service role can insert sounds" ON public.generated_sounds;
DROP POLICY IF EXISTS "Service role can update sounds" ON public.generated_sounds;

-- Recreate with explicit service role check
CREATE POLICY "Service role can delete sounds" 
ON public.generated_sounds 
FOR DELETE 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert sounds" 
ON public.generated_sounds 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update sounds" 
ON public.generated_sounds 
FOR UPDATE 
USING (auth.role() = 'service_role');