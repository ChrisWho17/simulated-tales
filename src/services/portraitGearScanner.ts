// Portrait gear scan — asks the scan-portrait-gear edge function what equipment
// is visible on a character portrait. Pure reconciliation lives in
// game/portraitGearScan; this file only owns the round trip.

import { supabase } from '@/integrations/supabase/client';
import { GearScanResult, sanitizeScannedGear } from '@/game/portraitGearScan';

/** A slow scan must never hold up the Begin Adventure button. */
const SCAN_TIMEOUT_MS = 25000;

export interface PortraitScanRequest {
  /** Data URL or https URL of the portrait. */
  imageUrl: string;
  genre?: string;
  characterClass?: string;
}

export async function scanPortraitForGear({
  imageUrl,
  genre,
  characterClass,
}: PortraitScanRequest): Promise<GearScanResult> {
  if (!imageUrl) {
    return { items: [], error: 'No portrait to scan' };
  }

  try {
    const invocation = supabase.functions.invoke('scan-portrait-gear', {
      body: { imageUrl, genre, characterClass },
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gear scan timed out')), SCAN_TIMEOUT_MS)
    );

    const { data, error } = await Promise.race([invocation, timeout]);

    if (error) {
      console.error('[PortraitGearScan] Edge function error:', error);
      return { items: [], error: error.message || 'Gear scan failed' };
    }

    // The edge function already shapes its output; sanitizing again is what
    // decides confidence cut-offs, equip slots and duplicate handling, and it
    // keeps a stale deployment from writing junk into an inventory.
    const items = sanitizeScannedGear(data?.items);

    if (items.length === 0) {
      return { items: [], error: data?.error };
    }

    console.log(
      `[PortraitGearScan] ${items.length} visible item(s):`,
      items.map(item => item.name).join(', ')
    );
    return { items };
  } catch (error) {
    console.error('[PortraitGearScan] Scan failed:', error);
    return {
      items: [],
      error: error instanceof Error ? error.message : 'Gear scan failed',
    };
  }
}
