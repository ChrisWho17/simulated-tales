import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import { CampaignProvider } from "@/contexts/CampaignContext";
import Index from "./pages/Index";
import Campaigns from "./pages/Campaigns";
import NotFound from "./pages/NotFound";
import LoadoutTest from "./pages/LoadoutTest";
import "@/styles/living-world-engine.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GameProvider>
      <CampaignProvider>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CampaignProvider>
    </GameProvider>
  </QueryClientProvider>
);

export default App;
