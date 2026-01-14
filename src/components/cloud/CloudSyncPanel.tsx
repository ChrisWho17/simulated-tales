// ============================================================================
// CLOUD SYNC PANEL - UI for managing cloud saves and sync
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { CloudSyncService, CloudSave, SyncStatus, SyncConflict } from '@/services/cloudSyncService';
import { loadCampaignIndex } from '@/lib/campaignStorage';
import { CampaignMetadata } from '@/types/campaign';
import { AuthModal } from './AuthModal';
import { CloudConflictModal } from './CloudConflictModal';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Upload, 
  Download, 
  Trash2, 
  Check, 
  AlertTriangle,
  Loader2,
  LogOut,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPlayTime, formatLastPlayed } from '@/lib/campaignStorage';

export function CloudSyncPanel() {
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [cloudSaves, setCloudSaves] = useState<CloudSave[]>([]);
  const [localCampaigns, setLocalCampaigns] = useState<CampaignMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  // Subscribe to sync status changes
  useEffect(() => {
    return CloudSyncService.onStatusChange(setSyncStatus);
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [cloud, local] = await Promise.all([
        CloudSyncService.listCloudSaves(),
        Promise.resolve(loadCampaignIndex()),
      ]);
      setCloudSaves(cloud);
      setLocalCampaigns(local);
      setLastSync(CloudSyncService.getLastSyncTime());
    } catch (e) {
      console.error('[CloudSync] Failed to refresh data:', e);
    }
    setIsLoading(false);
  };

  const handleFullSync = async () => {
    setIsLoading(true);
    const result = await CloudSyncService.fullSync();
    
    if (result.conflicts.length > 0) {
      setConflicts(result.conflicts);
      setShowConflictModal(true);
    }
    
    if (result.errors.length > 0) {
      result.errors.forEach(err => toast.error(err));
    } else if (result.success) {
      toast.success(`Sync complete! Uploaded: ${result.uploaded}, Downloaded: ${result.downloaded}`);
    }
    
    await refreshData();
    setIsLoading(false);
  };

  const handleUploadCampaign = async (campaignId: string) => {
    setIsLoading(true);
    const result = await CloudSyncService.uploadCampaign(campaignId);
    
    if (result.success) {
      toast.success('Campaign uploaded to cloud');
      await refreshData();
    } else {
      toast.error(result.error || 'Upload failed');
    }
    setIsLoading(false);
  };

  const handleDownloadCampaign = async (campaignId: string) => {
    setIsLoading(true);
    const result = await CloudSyncService.downloadCampaign(campaignId);
    
    if (result.success) {
      toast.success('Campaign downloaded from cloud');
      await refreshData();
    } else {
      toast.error(result.error || 'Download failed');
    }
    setIsLoading(false);
  };

  const handleDeleteCloudSave = async (campaignId: string) => {
    if (!confirm('Delete this cloud save? This cannot be undone.')) return;
    
    setIsLoading(true);
    const result = await CloudSyncService.deleteCloudSave(campaignId);
    
    if (result.success) {
      toast.success('Cloud save deleted');
      await refreshData();
    } else {
      toast.error(result.error || 'Delete failed');
    }
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setCloudSaves([]);
    setSyncStatus('idle');
    setLastSync(null);
    toast.success('Signed out');
  };

  const handleConflictResolved = async () => {
    setShowConflictModal(false);
    setConflicts([]);
    await refreshData();
  };

  // Get status icon
  const StatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'synced':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Cloud className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Check which campaigns are synced
  const cloudCampaignIds = new Set(cloudSaves.map(s => s.campaign_id));
  const localCampaignIds = new Set(localCampaigns.map(c => c.id));

  if (authLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon />
              <CardTitle className="text-lg">Cloud Sync</CardTitle>
            </div>
            {isAuthenticated && (
              <Badge variant={syncStatus === 'synced' ? 'default' : 'outline'}>
                {syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Not synced'}
              </Badge>
            )}
          </div>
          <CardDescription>
            {isAuthenticated 
              ? `Signed in as ${user?.email}` 
              : 'Sign in to sync your saves across devices'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isAuthenticated ? (
            <Button onClick={() => setShowAuthModal(true)} className="w-full">
              <Cloud className="h-4 w-4 mr-2" />
              Sign In for Cloud Sync
            </Button>
          ) : (
            <>
              {/* Sync actions */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleFullSync} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync All
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  disabled={isLoading}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              {lastSync && (
                <p className="text-xs text-muted-foreground text-center">
                  Last synced: {formatLastPlayed(lastSync)}
                </p>
              )}

              <Separator />

              {/* Local campaigns */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Local Campaigns ({localCampaigns.length})
                </h4>
                <ScrollArea className="h-48">
                  {localCampaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No local campaigns</p>
                  ) : (
                    <div className="space-y-2">
                      {localCampaigns.map(campaign => (
                        <div 
                          key={campaign.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {campaign.characterName} • Lv.{campaign.characterLevel} • {formatPlayTime(campaign.playTime)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {cloudCampaignIds.has(campaign.id) ? (
                              <Badge variant="secondary" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Synced
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUploadCampaign(campaign.id)}
                                disabled={isLoading}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <Separator />

              {/* Cloud saves */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Cloud Saves ({cloudSaves.length})
                </h4>
                <ScrollArea className="h-48">
                  {cloudSaves.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No cloud saves</p>
                  ) : (
                    <div className="space-y-2">
                      {cloudSaves.map(save => (
                        <div 
                          key={save.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{save.campaign_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {save.character_name} • Lv.{save.character_level} • {formatPlayTime(save.play_time)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {!localCampaignIds.has(save.campaign_id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadCampaign(save.campaign_id)}
                                disabled={isLoading}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteCloudSave(save.campaign_id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      
      <CloudConflictModal 
        open={showConflictModal}
        conflicts={conflicts}
        onResolved={handleConflictResolved}
        onClose={() => setShowConflictModal(false)}
      />
    </>
  );
}
