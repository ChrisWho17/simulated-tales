-- Fix overly permissive RLS policies on npc_portraits and generated_sounds tables
-- These should only allow service_role to modify data

-- Drop existing overly permissive policies on npc_portraits
DROP POLICY IF EXISTS "Service role can delete NPC portraits" ON public.npc_portraits;
DROP POLICY IF EXISTS "Service role can insert NPC portraits" ON public.npc_portraits;
DROP POLICY IF EXISTS "Service role can update NPC portraits" ON public.npc_portraits;

-- Create properly restricted policies for npc_portraits (service_role only)
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

-- Drop existing overly permissive policies on generated_sounds
DROP POLICY IF EXISTS "Service role can delete sounds" ON public.generated_sounds;
DROP POLICY IF EXISTS "Service role can insert sounds" ON public.generated_sounds;
DROP POLICY IF EXISTS "Service role can update sounds" ON public.generated_sounds;

-- Create properly restricted policies for generated_sounds (service_role only)
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