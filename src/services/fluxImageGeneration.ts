// FLUX.1 Portrait Generation - Secure server-side implementation via edge function
import { supabase } from '@/integrations/supabase/client';

export async function generatePortraitWithFlux(prompt: string): Promise<string> {
  console.log('[Portrait] Calling edge function with prompt:', prompt.substring(0, 100) + '...');
  
  const { data, error } = await supabase.functions.invoke('generate-npc-portrait', {
    body: {
      npc: {
        id: `portrait-${Date.now()}`,
        meta: {
          name: 'Character',
          description: 'Custom character portrait',
        }
      },
      prompt: prompt,
      config: {
        genre: 'modern',
        emotion: 'neutral',
      }
    }
  });

  if (error) {
    console.error('[Portrait] Edge function error:', error);
    throw new Error(`Portrait generation failed: ${error.message}`);
  }

  if (!data?.imageUrl) {
    console.error('[Portrait] No image URL in response:', data);
    throw new Error('No image generated');
  }

  console.log('[Portrait] Successfully generated portrait');
  return data.imageUrl;
}
