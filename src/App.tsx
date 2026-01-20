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
import { StartupIntegrityMonitor } from "@/components/game/StartupIntegrityMonitor";
import { RecoveryBoundary } from "@/components/error/RecoveryBoundary";
import { repairCorruptedStorage } from "@/lib/storageRepair";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import LoadoutTest from "./pages/LoadoutTest";
import InventoryTest from "./pages/InventoryTest";
import AchievementGallery from "./pages/AchievementGallery";
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
    console.log('[INVENTORY→NARRATIVE]', action.narrativeHook);
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
                        <StartupIntegrityMonitor />
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/campaigns" element={<Campaigns />} />
                            <Route path="/campaigns/new" element={<Index />} />
                            <Route path="/play" element={<Index />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/loadout-test" element={<LoadoutTest />} />
                            <Route path="/inventory-test" element={<InventoryTest />} />
                            <Route path="/achievements" element={<AchievementGallery />} />
                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
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
