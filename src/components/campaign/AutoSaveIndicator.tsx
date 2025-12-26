// ============================================================================
// AUTO-SAVE INDICATOR - Shows save status in game UI
// ============================================================================

import { useCampaign } from '@/contexts/CampaignContext';
import { Save, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { formatLastPlayed } from '@/lib/campaignStorage';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function AutoSaveIndicator() {
  const { isDirty, lastSaved, activeCampaign } = useCampaign();
  
  if (!activeCampaign) return null;
  
  const getStatusIcon = () => {
    if (isDirty) {
      return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
    }
    if (lastSaved) {
      return <Cloud className="h-4 w-4 text-emerald-500" />;
    }
    return <CloudOff className="h-4 w-4 text-muted-foreground" />;
  };
  
  const getStatusText = () => {
    if (isDirty) {
      return 'Saving...';
    }
    if (lastSaved) {
      return `Saved ${formatLastPlayed(lastSaved)}`;
    }
    return 'Not saved';
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-card/50 backdrop-blur border border-border/30 text-xs text-muted-foreground">
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs">
          <div className="font-medium">{activeCampaign.meta.name}</div>
          <div className="text-muted-foreground">{getStatusText()}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
