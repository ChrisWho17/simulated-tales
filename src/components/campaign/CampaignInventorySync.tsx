// ============================================================================
// CAMPAIGN INVENTORY SYNC - Bridges inventory state with campaign system
// Ensures complete isolation between campaigns
// ============================================================================

import React, { useEffect, useRef, useCallback } from 'react';
import { useCampaignOptional } from '@/contexts/CampaignContext';
import { useInventoryOptional, ACTIONS } from '@/game/inventorySystem';
import { 
  saveInventoryForCampaign, 
  loadInventoryForCampaign 
} from '@/lib/campaignStorage';

interface CampaignInventorySyncProps {
  children: React.ReactNode;
}

export function CampaignInventorySync({ children }: CampaignInventorySyncProps) {
  const campaign = useCampaignOptional();
  const inventory = useInventoryOptional();
  
  const lastCampaignIdRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const activeCampaignId = campaign?.activeCampaignId ?? null;
  
  // Load inventory when campaign changes
  useEffect(() => {
    if (!inventory) return;
    
    const previousCampaignId = lastCampaignIdRef.current;
    
    // Campaign changed - handle transition
    if (previousCampaignId !== activeCampaignId) {
      console.log(`[CampaignInventorySync] Campaign changed: ${previousCampaignId} → ${activeCampaignId}`);
      
      // Step 1: Save inventory for previous campaign (if any)
      if (previousCampaignId && inventory.state.items.length > 0) {
        saveInventoryForCampaign(previousCampaignId, inventory.state);
        console.log(`[CampaignInventorySync] Saved ${inventory.state.items.length} items for previous campaign`);
      }
      
      // Step 2: ALWAYS clear inventory first to prevent bleed
      isSyncingRef.current = true;
      inventory.dispatch({ type: ACTIONS.CLEAR_INVENTORY });
      console.log(`[CampaignInventorySync] Cleared inventory`);
      
      // Step 3: Load inventory for new campaign (if any)
      if (activeCampaignId) {
        const savedInventory = loadInventoryForCampaign(activeCampaignId);
        if (savedInventory) {
          inventory.dispatch({ type: ACTIONS.LOAD_STATE, payload: savedInventory });
          console.log(`[CampaignInventorySync] Loaded inventory for new campaign`);
        } else {
          console.log(`[CampaignInventorySync] No saved inventory for new campaign - starting fresh`);
        }
      }
      
      isSyncingRef.current = false;
      lastCampaignIdRef.current = activeCampaignId;
    }
  }, [activeCampaignId, inventory]);
  
  // Auto-save inventory when it changes (debounced)
  useEffect(() => {
    if (!inventory || !activeCampaignId || isSyncingRef.current) return;
    
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce save by 1 second
    saveTimeoutRef.current = setTimeout(() => {
      if (activeCampaignId && inventory.state.items.length >= 0) {
        saveInventoryForCampaign(activeCampaignId, inventory.state);
      }
    }, 1000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [inventory?.state, activeCampaignId]);
  
  // Save on visibility change (tab switch, minimize)
  useEffect(() => {
    if (!inventory || !activeCampaignId) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden && activeCampaignId) {
        saveInventoryForCampaign(activeCampaignId, inventory.state);
        console.log('[CampaignInventorySync] Saved on visibility change');
      }
    };
    
    const handleBeforeUnload = () => {
      if (activeCampaignId) {
        saveInventoryForCampaign(activeCampaignId, inventory.state);
        console.log('[CampaignInventorySync] Saved before unload');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [inventory, activeCampaignId]);
  
  return <>{children}</>;
}

export default CampaignInventorySync;
