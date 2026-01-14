// ============================================================================
// CAMPAIGN SYNC STATUS - Shows sync status badge for individual campaigns
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { CloudSyncService } from '@/services/cloudSyncService';
import { Cloud, CloudOff, Upload, Check, Loader2 } from 'lucide-react';

interface CampaignSyncStatusProps {
  campaignId: string;
  variant?: 'badge' | 'icon' | 'button';
  showUpload?: boolean;
  className?: string;
}

export function CampaignSyncStatus({ 
  campaignId, 
  variant = 'badge',
  showUpload = true,
  className 
}: CampaignSyncStatusProps) {
  const { isAuthenticated } = useAuth();
  const [isSynced, setIsSynced] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Check if this campaign is synced
      setIsSynced(CloudSyncService.isCampaignSynced(campaignId));
      
      // Refresh synced status when service updates
      const refresh = async () => {
        await CloudSyncService.refreshSyncedCampaigns();
        setIsSynced(CloudSyncService.isCampaignSynced(campaignId));
      };
      
      // Initial refresh
      refresh();
    }
  }, [isAuthenticated, campaignId]);

  const handleUpload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return;
    
    setIsUploading(true);
    const result = await CloudSyncService.uploadCampaign(campaignId);
    if (result.success) {
      setIsSynced(true);
    }
    setIsUploading(false);
  };

  if (!isAuthenticated) {
    if (variant === 'icon') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CloudOff className={`h-4 w-4 text-muted-foreground ${className}`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Sign in to enable cloud sync</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  }

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {isUploading ? (
              <Loader2 className={`h-4 w-4 animate-spin text-primary ${className}`} />
            ) : isSynced ? (
              <Cloud className={`h-4 w-4 text-green-500 ${className}`} />
            ) : showUpload ? (
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${className}`}
                onClick={handleUpload}
              >
                <Upload className="h-3 w-3" />
              </Button>
            ) : (
              <CloudOff className={`h-4 w-4 text-muted-foreground ${className}`} />
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSynced ? 'Synced to cloud' : 'Not synced'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'button') {
    if (isSynced) {
      return (
        <Badge variant="secondary" className={`text-xs ${className}`}>
          <Check className="h-3 w-3 mr-1" />
          Synced
        </Badge>
      );
    }
    
    if (!showUpload) return null;
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleUpload}
        disabled={isUploading}
        className={className}
      >
        {isUploading ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <Upload className="h-3 w-3 mr-1" />
        )}
        Backup
      </Button>
    );
  }

  // Default badge variant
  if (isSynced) {
    return (
      <Badge variant="secondary" className={`text-xs ${className}`}>
        <Cloud className="h-3 w-3 mr-1 text-green-500" />
        Cloud
      </Badge>
    );
  }

  if (!showUpload) {
    return (
      <Badge variant="outline" className={`text-xs text-muted-foreground ${className}`}>
        <CloudOff className="h-3 w-3 mr-1" />
        Local
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`text-xs cursor-pointer hover:bg-muted ${className}`}
      onClick={handleUpload}
    >
      {isUploading ? (
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
      ) : (
        <Upload className="h-3 w-3 mr-1" />
      )}
      Backup
    </Badge>
  );
}
