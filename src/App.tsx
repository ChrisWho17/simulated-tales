import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import { CampaignProvider } from "@/contexts/CampaignContext";
import { InventoryProvider, InventoryAction } from "@/game/inventorySystem";
import { CampaignInventorySync } from "@/components/campaign/CampaignInventorySync";
import { ScreenEffectsProvider } from "@/components/game/ScreenEffects";
import { SessionStatsProvider } from "@/components/game/SessionStats";
import { AchievementsProvider } from "@/components/game/Achievements";
import { AccessibilityProvider } from "@/components/game/AccessibilitySettings";
import { SessionAchievementBridge } from "@/components/game/SessionAchievementBridge";
import { SessionStatsBridge } from "@/components/game/SessionStatsBridge";
import { bridgePlayerStateToUnifiedInventory } from "@/game/unifiedInventoryBridge";
import { DeferredStartupIntegrityMonitor } from "@/components/game/DeferredStartupIntegrityMonitor";
import { PwaUpdatePrompt } from "@/components/PwaUpdatePrompt";
import { RecoveryBoundary } from "@/components/error/RecoveryBoundary";
import { VersionHotfixesBadgeGate } from "@/components/adventure/VersionHotfixesBadgeGate";
import { WhatsNewModal } from "@/components/adventure/WhatsNewModal";
import { DevOnlyRoute } from "@/components/routing/DevOnlyRoute";
import { devLog } from "@/lib/devLog";

import { repairCorruptedStorage } from "@/lib/storageRepair";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AchievementGallery from "./pages/AchievementGallery";

// Workshop / diagnostic harnesses: lazy so they stay out of the main bundle,
// and gated by DevOnlyRoute so they are unreachable on the public play surface.
const LoadoutTest = lazy(() => import("./pages/LoadoutTest"));
const InventoryTest = lazy(() => import("./pages/InventoryTest"));
const DebugPwa = lazy(() => import("./pages/DebugPwa"));

import "@/styles/untold-story-engine.css";

// CRITICAL: Run storage repair BEFORE React renders to prevent crashes
const repairResult = repairCorruptedStorage();
if (repairResult.wasCorrupted) {
  console.warn('[App] Storage was corrupted and repaired:', repairResult.repaired);
}

const queryClient = new QueryClient();

// Initialize the unified inventory bridge (Phase 3)
bridgePlayerStateToUnifiedInventory();

// Narrative action handler for inventory changes
const handleInventoryNarrativeAction = (action: InventoryAction) => {
  if (action.narrativeHook) {
    devLog.log('[INVENTORY→NARRATIVE]', action.narrativeHook);
    // This will be picked up by the game's narrative system
  }
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <RecoveryBoundary>
      <AccessibilityProvider>
        <ScreenEffectsProvider>
          <SessionStatsProvider>
            <AchievementsProvider>
              {/* Bridge to connect session stats to achievements */}
              <SessionAchievementBridge />
              {/* Bridge to connect EventBus game events to session stats */}
              <SessionStatsBridge />
              <GameProvider>
                <CampaignProvider>
                  <InventoryProvider onNarrativeAction={handleInventoryNarrativeAction}>
                    <CampaignInventorySync>
                      <TooltipProvider>
                        <DeferredStartupIntegrityMonitor />
                        <PwaUpdatePrompt />
                        <WhatsNewModal />
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                          <VersionHotfixesBadgeGate />
                          <Suspense fallback={null}>
                            <Routes>
                              <Route path="/" element={<Index />} />
                              <Route path="/campaigns" element={<Campaigns />} />
                              <Route path="/campaigns/new" element={<Index />} />
                              <Route path="/play" element={<Index />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/achievements" element={<AchievementGallery />} />
                              {/* Dev / workshop harnesses — hidden on the public play surface */}
                              <Route path="/loadout-test" element={<DevOnlyRoute><LoadoutTest /></DevOnlyRoute>} />
                              <Route path="/inventory-test" element={<DevOnlyRoute><InventoryTest /></DevOnlyRoute>} />
                              <Route path="/debug/pwa" element={<DevOnlyRoute><DebugPwa /></DevOnlyRoute>} />
                              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </BrowserRouter>


                      </TooltipProvider>
                    </CampaignInventorySync>
                  </InventoryProvider>
                </CampaignProvider>
              </GameProvider>
            </AchievementsProvider>
          </SessionStatsProvider>
        </ScreenEffectsProvider>
      </AccessibilityProvider>
    </RecoveryBoundary>
  </QueryClientProvider>
);

export default App;
