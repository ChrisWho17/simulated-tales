import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import { CampaignProvider } from "@/contexts/CampaignContext";
import { InventoryProvider, InventoryAction } from "@/game/inventorySystem";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import NotFound from "./pages/NotFound";
import LoadoutTest from "./pages/LoadoutTest";
import InventoryTest from "./pages/InventoryTest";
import SoundGeneratorPage from "./pages/SoundGenerator";
import SoundSeederPage from "./pages/SoundSeeder";
import "@/styles/untold-story-engine.css";

const queryClient = new QueryClient();

// Narrative action handler for inventory changes
const handleInventoryNarrativeAction = (action: InventoryAction) => {
  if (action.narrativeHook) {
    console.log('[INVENTORY→NARRATIVE]', action.narrativeHook);
    // This will be picked up by the game's narrative system
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GameProvider>
      <CampaignProvider>
        <InventoryProvider onNarrativeAction={handleInventoryNarrativeAction}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/campaigns/new" element={<Index />} />
                <Route path="/play" element={<Index />} />
                <Route path="/loadout-test" element={<LoadoutTest />} />
                <Route path="/inventory-test" element={<InventoryTest />} />
                <Route path="/sound-generator" element={<SoundGeneratorPage />} />
                <Route path="/sound-seeder" element={<SoundSeederPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </InventoryProvider>
      </CampaignProvider>
    </GameProvider>
  </QueryClientProvider>
);

export default App;
