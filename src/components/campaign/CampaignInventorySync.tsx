// ============================================================================
// CAMPAIGN INVENTORY SYNC - Bridges inventory state with campaign system
// Uses UnifiedInventoryBridge as single source of truth (Phase 3)
// ============================================================================

import React, { useEffect, useRef, useCallback } from 'react';
import { useCampaignOptional } from '@/contexts/CampaignContext';
import { useInventoryOptional, ACTIONS, InventoryState } from '@/game/inventorySystem';
import { 
  saveInventoryForCampaign, 
  loadInventoryForCampaign 
} from '@/lib/campaignStorage';
import {
  initializeStartingGear,
  needsStartingGear,
} from '@/game/storyInventoryBridge';
import { unifiedInventory } from '@/game/unifiedInventoryBridge';
import { setLogCampaignId, forceFlush } from '@/services/inventorySyncLogger';

interface CampaignInventorySyncProps {
  children: React.ReactNode;
}

export function CampaignInventorySync({ children }: CampaignInventorySyncProps) {
  const campaign = useCampaignOptional();
  const inventory = useInventoryOptional();
  
  const lastCampaignIdRef = useRef<string | null>(null);
  const isSyncingRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitializedGearRef = useRef<Set<string>>(new Set());
  
  const activeCampaignId = campaign?.activeCampaignId ?? null;
  const activeCampaign = campaign?.activeCampaign ?? null;
  
  // Load inventory and initialize starting gear when campaign changes
  useEffect(() => {
    if (!inventory) return;
    
    const previousCampaignId = lastCampaignIdRef.current;
    
    // Campaign changed - handle transition
    if (previousCampaignId !== activeCampaignId) {
      console.log(`[CampaignInventorySync] Campaign changed: ${previousCampaignId} → ${activeCampaignId}`);
      
      // Update logger campaign context
      setLogCampaignId(activeCampaignId);
      
      // Step 1: Save inventory for previous campaign (if any)
      if (previousCampaignId && inventory.state.items.length > 0) {
        saveInventoryForCampaign(previousCampaignId, inventory.state);
        console.log(`[CampaignInventorySync] Saved ${inventory.state.items.length} items for previous campaign`);
      }
      
      // Step 2: ALWAYS clear inventory first to prevent bleed
      isSyncingRef.current = true;
      inventory.dispatch({ type: ACTIONS.CLEAR_INVENTORY });
      unifiedInventory.clearInventory({ silent: true }); // Sync unified inventory
      console.log(`[CampaignInventorySync] Cleared inventory (both systems)`);
      
      // Step 3: Load inventory for new campaign (if any)
      if (activeCampaignId) {
        const savedInventory = loadInventoryForCampaign(activeCampaignId);
        if (savedInventory && (savedInventory as any).items?.length > 0) {
          inventory.dispatch({ type: ACTIONS.LOAD_STATE, payload: savedInventory });
          unifiedInventory.loadState(savedInventory as InventoryState, { silent: true }); // Sync unified inventory
          console.log(`[CampaignInventorySync] Loaded inventory for new campaign (both systems)`);
        } else {
          console.log(`[CampaignInventorySync] No saved inventory - will initialize starting gear`);
        }
      }
      
      isSyncingRef.current = false;
      lastCampaignIdRef.current = activeCampaignId;
    }
  }, [activeCampaignId, inventory]);
  
  // Initialize starting gear for new campaigns with empty inventory
  useEffect(() => {
    if (!inventory || !activeCampaign || !activeCampaignId || isSyncingRef.current) return;
    
    // Check if we've already initialized gear for this campaign
    if (hasInitializedGearRef.current.has(activeCampaignId)) return;
    
    // Check if inventory is empty and needs starting gear
    if (needsStartingGear(inventory.state)) {
      const genre = activeCampaign.meta?.primaryGenre || 'fantasy';
      const playerClass = activeCampaign.player?.classId || 'default';
      
      console.log(`[CampaignInventorySync] Initializing starting gear for ${genre}/${playerClass}`);
      
      // Mark as initialized BEFORE adding items to prevent loops
      hasInitializedGearRef.current.add(activeCampaignId);
      
      // Small delay to ensure state is settled
      setTimeout(() => {
        if (needsStartingGear(inventory.state)) {
          initializeStartingGear(inventory, genre, playerClass);
          console.log(`[CampaignInventorySync] Starting gear initialized`);
        }
      }, 100);
    } else {
      // Inventory already has items, mark as initialized
      hasInitializedGearRef.current.add(activeCampaignId);
    }
  }, [activeCampaign, activeCampaignId, inventory, inventory?.state.items.length]);
  
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
        forceFlush(); // Flush any pending inventory sync logs
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
