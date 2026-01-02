-- ============================================================================
-- FIX RLS POLICIES: Restrict INSERT/UPDATE to service role only
-- Since this is a single-player game without user auth, we restrict writes 
-- to service role (edge functions) while keeping reads public
-- ============================================================================

-- Drop existing permissive policies on npc_portraits
DROP POLICY IF EXISTS "Anyone can insert NPC portraits" ON public.npc_portraits;
DROP POLICY IF EXISTS "Anyone can update NPC portraits" ON public.npc_portraits;

-- Create restrictive policies - only service role can write
-- Public SELECT is fine for a single-player game
CREATE POLICY "Service role can insert NPC portraits" 
ON public.npc_portraits 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update NPC portraits" 
ON public.npc_portraits 
FOR UPDATE 
TO service_role
USING (true);

CREATE POLICY "Service role can delete NPC portraits" 
ON public.npc_portraits 
FOR DELETE 
TO service_role
USING (true);

-- Drop existing permissive policy on generated_sounds
DROP POLICY IF EXISTS "Authenticated can insert sounds" ON public.generated_sounds;

-- Create restrictive policy - only service role can insert
CREATE POLICY "Service role can insert sounds" 
ON public.generated_sounds 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update sounds" 
ON public.generated_sounds 
FOR UPDATE 
TO service_role
USING (true);

CREATE POLICY "Service role can delete sounds" 
ON public.generated_sounds 
FOR DELETE 
TO service_role
USING (true);