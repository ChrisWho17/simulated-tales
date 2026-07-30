// ============================================================================
// CAMPAIGN MANAGER UI - Main campaign selection/management screen
// Integrated with save recovery for automatic error handling
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from '@/contexts/CampaignContext';
import { CampaignMetadata, MAX_CAMPAIGNS } from '@/types/campaign';
import { formatPlayTime, formatLastPlayed, canCreateCampaign, loadCampaign as loadCampaignData, nuclearWipe, getStorageStats } from '@/lib/campaignStorage';
import { needsMigration, migrateAllData, MigrationResult } from '@/lib/campaignMigration';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MigrationPrompt } from './MigrationPrompt';
import { CampaignSyncStatus, CloudSyncIndicator } from '@/components/cloud';
import { useAuth } from '@/hooks/useAuth';
import { CloudSyncService } from '@/services/cloudSyncService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Play,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Clock,
  BookOpen,
  User,
  Swords,
  AlertTriangle,
  Sparkles,
  FileWarning,
  Bomb,
  HardDrive,
  Cloud,
  UserCircle,
  RefreshCw,
  Check,
  X,
  CloudDownload,
} from 'lucide-react';
import { UnifiedSaveArchitecture } from '@/services/unifiedSaveArchitecture';
import { supabase } from '@/integrations/supabase/client';
import { SaveRecoveryModal, AskAIHelpModal } from '@/components/campaign';
import { createFailureSnapshot } from '@/lib/saveRecovery/pipeline';
import { runInvariants } from '@/lib/saveRecovery/invariants';
import { Progress } from '@/components/ui/progress';
import { FailureSnapshot } from '@/lib/saveRecovery/types';

// Genre badge colors
const GENRE_COLORS: Record<string, string> = {
  fantasy: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  scifi: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  horror: 'bg-red-500/20 text-red-300 border-red-500/30',
  western: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  noir: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  romance: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  adventure: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  mystery: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  historical: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  superhero: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  postapocalyptic: 'bg-stone-500/20 text-stone-300 border-stone-500/30',
  steampunk: 'bg-amber-600/20 text-amber-200 border-amber-600/30',
  custom: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

interface CampaignManagerProps {
  onCreateNew: () => void;
  onSelectCampaign: () => void;
}

export function CampaignManager({ onCreateNew, onSelectCampaign }: CampaignManagerProps) {
  const navigate = useNavigate();
  const { campaigns, loadCampaign, deleteCampaign, duplicateCampaign, exportCampaign, importCampaign, activeCampaignId } = useCampaign();
  const { isAuthenticated } = useAuth();
  
  // Migration state - check on mount if old data needs migrating
  const [showMigration, setShowMigration] = useState(() => needsMigration());
  
  // Handle migration complete
  const handleMigrationComplete = useCallback((result: MigrationResult) => {
    setShowMigration(false);
    if (result.migratedCount > 0) {
      // Refresh page to reload campaigns
      window.location.reload();
    }
  }, []);
  
  // Handle skip migration
  const handleSkipMigration = useCallback(() => {
    setShowMigration(false);
  }, []);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<CampaignMetadata | null>(null);
  
  // Duplicate dialog
  const [duplicateTarget, setDuplicateTarget] = useState<CampaignMetadata | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  
  // Import file ref
  const importInputRef = useRef<HTMLInputElement>(null);
  
  // Recovery modal state
  const [recoverySnapshot, setRecoverySnapshot] = useState<FailureSnapshot | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showAskAIModal, setShowAskAIModal] = useState(false);
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);
  
  
  // Nuclear wipe state
  const [showNuclearConfirm, setShowNuclearConfirm] = useState(false);
  const [nuclearStep, setNuclearStep] = useState(0); // 0: initial, 1: confirm, 2: final
  const [storageStats, setStorageStats] = useState<ReturnType<typeof getStorageStats> | null>(() => getStorageStats());
  
  // Refresh cloud sync status on mount
  useEffect(() => {
    if (isAuthenticated) {
      CloudSyncService.refreshSyncedCampaigns();
    }
  }, [isAuthenticated]);
  
  const canCreate = canCreateCampaign();
  
  // Show migration prompt if old data exists
  if (showMigration) {
    return (
      <MigrationPrompt
        onComplete={handleMigrationComplete}
        onSkip={handleSkipMigration}
      />
    );
  }
  
  // Handle continue/load campaign with recovery
  const handleContinue = useCallback(async (campaign: CampaignMetadata) => {
    try {
      // First, try to load and validate the campaign
      const rawData = loadCampaignData(campaign.id);
      
      if (!rawData) {
        toast.error('Failed to load campaign data');
        return;
      }
      
      // Run invariants to check for issues
      const invariantResult = runInvariants(rawData);
      
      if (!invariantResult.valid) {
        // Campaign has issues - trigger recovery mode
        console.log('[CampaignManager] Campaign has issues, triggering recovery:', invariantResult.violations);
        
        const snapshot = createFailureSnapshot(
          campaign.id,
          rawData,
          'INVARIANT_FAILURE',
          `${invariantResult.violations.length} validation issue(s) detected`,
          invariantResult
        );
        
        setRecoverySnapshot(snapshot);
        setPendingCampaignId(campaign.id);
        setShowRecoveryModal(true);
        return;
      }
      
      // Campaign is valid, load normally - AWAIT the async function
      const success = await loadCampaign(campaign.id);
      if (success) {
        onSelectCampaign();
      } else {
        toast.error('Failed to load campaign');
      }
    } catch (err) {
      console.error('[CampaignManager] Error loading campaign:', err);
      toast.error('Failed to load campaign');
    }
  }, [loadCampaign, onSelectCampaign]);
  
  // Handle recovery success
  const handleRecovered = useCallback(async (save: unknown) => {
    if (pendingCampaignId) {
      // Re-save the recovered data and load - AWAIT the async function
      const success = await loadCampaign(pendingCampaignId);
      if (success) {
        toast.success('Campaign recovered and loaded');
        setShowRecoveryModal(false);
        setShowAskAIModal(false);
        setRecoverySnapshot(null);
        setPendingCampaignId(null);
        onSelectCampaign();
      }
    }
  }, [pendingCampaignId, loadCampaign, onSelectCampaign]);
  
  // Handle recovery abort
  const handleRecoveryAbort = useCallback(() => {
    setShowRecoveryModal(false);
    setShowAskAIModal(false);
    setRecoverySnapshot(null);
    setPendingCampaignId(null);
    toast.info('Recovery cancelled');
  }, []);
  
  // Switch between recovery and AI modals
  const handleSwitchToAI = useCallback(() => {
    setShowRecoveryModal(false);
    setShowAskAIModal(true);
  }, []);
  
  const handleSwitchToRecovery = useCallback(() => {
    setShowAskAIModal(false);
    setShowRecoveryModal(true);
  }, []);
  
  
  // Handle delete
  const handleDelete = useCallback(() => {
    if (deleteConfirm) {
      deleteCampaign(deleteConfirm.id);
      setDeleteConfirm(null);
      setStorageStats(getStorageStats()); // Refresh stats
      toast.success(`Deleted "${deleteConfirm.name}"`);
    }
  }, [deleteConfirm, deleteCampaign]);
  
  // Handle duplicate
  const handleDuplicate = useCallback(() => {
    if (duplicateTarget && duplicateName.trim()) {
      const result = duplicateCampaign(duplicateTarget.id, duplicateName.trim());
      if (result) {
        setStorageStats(getStorageStats()); // Refresh stats
        toast.success(`Created "${duplicateName.trim()}"`);
      } else {
        toast.error('Failed to duplicate campaign');
      }
      setDuplicateTarget(null);
      setDuplicateName('');
    }
  }, [duplicateTarget, duplicateName, duplicateCampaign]);
  
  // Handle export
  const handleExport = useCallback((campaign: CampaignMetadata) => {
    const json = exportCampaign(campaign.id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaign.name.replace(/[^a-z0-9]/gi, '_')}_campaign.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Campaign exported');
    }
  }, [exportCampaign]);
  
  // Handle import
  const handleImportClick = useCallback(() => {
    importInputRef.current?.click();
  }, []);
  
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const json = event.target?.result as string;
      const result = await importCampaign(json);
      if (result) {
        setStorageStats(getStorageStats()); // Refresh stats
        toast.success(`Imported "${result.meta.name}"`);
      } else {
        toast.error('Failed to import campaign');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [importCampaign]);
  
  // Handle opening nuclear wipe dialog
  const handleOpenNuclearWipe = useCallback(() => {
    setStorageStats(getStorageStats());
    setShowNuclearConfirm(true);
    setNuclearStep(0);
  }, []);
  
  // Handle nuclear wipe execution
  const handleNuclearWipe = useCallback(() => {
    if (nuclearStep === 0) {
      setNuclearStep(1);
    } else if (nuclearStep === 1) {
      setNuclearStep(2);
    } else if (nuclearStep === 2) {
      const result = nuclearWipe('CONFIRM_WIPE');
      if (result.success) {
        toast.success(`Deleted ${result.deletedCount} storage entries. Reloading...`);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(result.error || 'Failed to wipe data');
      }
    }
  }, [nuclearStep]);
  
  // Sync all state
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [showSyncAllDialog, setShowSyncAllDialog] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
    results: { name: string; success: boolean }[];
  } | null>(null);
  
  // Handle sync all campaigns
  const handleSyncAllClick = useCallback(() => {
    if (!isAuthenticated) {
      toast.error('Sign in to sync campaigns to cloud');
      return;
    }
    setShowSyncAllDialog(true);
    setSyncProgress(null);
  }, [isAuthenticated]);
  
  const handleSyncAllConfirm = useCallback(async () => {
    setIsSyncingAll(true);
    setSyncProgress({
      current: 0,
      total: campaigns.length,
      currentName: campaigns[0]?.name || '',
      results: []
    });
    
    const results: { name: string; success: boolean }[] = [];
    
    for (let i = 0; i < campaigns.length; i++) {
      const campaign = campaigns[i];
      setSyncProgress(prev => prev ? {
        ...prev,
        current: i,
        currentName: campaign.name
      } : null);
      
      try {
        const rawData = loadCampaignData(campaign.id);
        if (rawData) {
          await UnifiedSaveArchitecture.saveCampaign(rawData);
          results.push({ name: campaign.name, success: true });
        } else {
          results.push({ name: campaign.name, success: false });
        }
      } catch (err) {
        console.error(`[SyncAll] Failed to sync ${campaign.name}:`, err);
        results.push({ name: campaign.name, success: false });
      }
      
      setSyncProgress(prev => prev ? {
        ...prev,
        current: i + 1,
        results: [...results]
      } : null);
    }
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    if (errorCount > 0) {
      toast.warning(`Synced ${successCount} campaigns, ${errorCount} failed`);
    } else if (successCount > 0) {
      toast.success(`Synced ${successCount} campaign${successCount > 1 ? 's' : ''} to cloud`);
    } else {
      toast.info('No campaigns to sync');
    }
    
    setIsSyncingAll(false);
    // Keep dialog open briefly to show final results
    setTimeout(() => {
      setShowSyncAllDialog(false);
      setSyncProgress(null);
    }, 1500);
  }, [campaigns]);
  
  // Download from cloud state
  interface CloudCampaignInfo {
    id: string;
    campaign_id: string;
    campaign_name: string;
    character_name: string;
    character_level: number;
    primary_genre: string;
    play_time: number;
    chapter_count: number;
    updated_at: string;
  }
  
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudCampaigns, setCloudCampaigns] = useState<CloudCampaignInfo[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
    results: { name: string; success: boolean; skipped?: boolean }[];
  } | null>(null);
  
  
  // Fetch cloud campaigns
  const handleOpenDownloadDialog = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to download campaigns from cloud');
      return;
    }
    
    setShowDownloadDialog(true);
    setIsLoadingCloud(true);
    setDownloadProgress(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        setIsLoadingCloud(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('cloud_saves')
        .select('id, campaign_id, campaign_name, character_name, character_level, primary_genre, play_time, chapter_count, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('[DownloadCloud] Error fetching:', error);
        toast.error('Failed to fetch cloud campaigns');
      } else {
        setCloudCampaigns(data || []);
      }
    } catch (err) {
      console.error('[DownloadCloud] Error:', err);
      toast.error('Failed to connect to cloud');
    } finally {
      setIsLoadingCloud(false);
    }
  }, [isAuthenticated]);
  
  // Download all cloud campaigns
  const handleDownloadAll = useCallback(async () => {
    if (cloudCampaigns.length === 0) return;
    
    setIsDownloading(true);
    setDownloadProgress({
      current: 0,
      total: cloudCampaigns.length,
      currentName: cloudCampaigns[0]?.campaign_name || '',
      results: []
    });
    
    const results: { name: string; success: boolean; skipped?: boolean }[] = [];
    const localCampaignIds = new Set(campaigns.map(c => c.id));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        setIsDownloading(false);
        return;
      }
      
      for (let i = 0; i < cloudCampaigns.length; i++) {
        const cloud = cloudCampaigns[i];
        setDownloadProgress(prev => prev ? {
          ...prev,
          current: i,
          currentName: cloud.campaign_name
        } : null);
        
        // Check if already exists locally
        if (localCampaignIds.has(cloud.campaign_id)) {
          results.push({ name: cloud.campaign_name, success: true, skipped: true });
          setDownloadProgress(prev => prev ? { ...prev, current: i + 1, results: [...results] } : null);
          continue;
        }
        
        try {
          // Fetch full save data
          const { data: fullSave, error } = await supabase
            .from('cloud_saves')
            .select('save_data')
            .eq('campaign_id', cloud.campaign_id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error || !fullSave) {
            console.error(`[DownloadCloud] Failed to fetch ${cloud.campaign_name}:`, error);
            results.push({ name: cloud.campaign_name, success: false });
          } else {
            // Save to local storage
            const campaignData = fullSave.save_data as unknown as import('@/types/campaign').CampaignData;
            localStorage.setItem(`lwe_campaign_${cloud.campaign_id}`, JSON.stringify(campaignData));
            
            // Update local index
            const indexRaw = localStorage.getItem('lwe_campaign_index');
            const index = indexRaw ? JSON.parse(indexRaw) : [];
            const exists = index.some((c: { id: string }) => c.id === cloud.campaign_id);
            if (!exists) {
              index.push({
                id: cloud.campaign_id,
                name: cloud.campaign_name,
                primaryGenre: cloud.primary_genre,
                secondaryGenres: [],
                createdAt: new Date(cloud.updated_at).getTime(),
                updatedAt: new Date(cloud.updated_at).getTime(),
                playTime: cloud.play_time,
                chapterCount: cloud.chapter_count,
                characterName: cloud.character_name,
                characterLevel: cloud.character_level,
              });
              localStorage.setItem('lwe_campaign_index', JSON.stringify(index));
            }
            
            results.push({ name: cloud.campaign_name, success: true });
          }
        } catch (err) {
          console.error(`[DownloadCloud] Error downloading ${cloud.campaign_name}:`, err);
          results.push({ name: cloud.campaign_name, success: false });
        }
        
        setDownloadProgress(prev => prev ? { ...prev, current: i + 1, results: [...results] } : null);
      }
      
      const downloaded = results.filter(r => r.success && !r.skipped).length;
      const skipped = results.filter(r => r.skipped).length;
      const failed = results.filter(r => !r.success).length;
      
      if (failed > 0) {
        toast.warning(`Downloaded ${downloaded}, skipped ${skipped}, failed ${failed}`);
      } else if (downloaded > 0) {
        toast.success(`Downloaded ${downloaded} campaign${downloaded > 1 ? 's' : ''}${skipped > 0 ? `, ${skipped} already local` : ''}`);
      } else if (skipped > 0) {
        toast.info('All cloud campaigns already exist locally');
      }
      
      // Reload page to refresh campaign list
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } finally {
      setIsDownloading(false);
    }
  }, [cloudCampaigns, campaigns]);
  
  // Download single campaign
  const handleDownloadSingle = useCallback(async (cloud: CloudCampaignInfo) => {
    const localExists = campaigns.some(c => c.id === cloud.campaign_id);
    if (localExists) {
      toast.info('Campaign already exists locally');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }
      
      const { data: fullSave, error } = await supabase
        .from('cloud_saves')
        .select('save_data')
        .eq('campaign_id', cloud.campaign_id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error || !fullSave) {
        toast.error('Failed to download campaign');
        return;
      }
      
      const campaignData = fullSave.save_data as unknown as import('@/types/campaign').CampaignData;
      localStorage.setItem(`lwe_campaign_${cloud.campaign_id}`, JSON.stringify(campaignData));
      
      const indexRaw = localStorage.getItem('lwe_campaign_index');
      const index = indexRaw ? JSON.parse(indexRaw) : [];
      index.push({
        id: cloud.campaign_id,
        name: cloud.campaign_name,
        primaryGenre: cloud.primary_genre,
        secondaryGenres: [],
        createdAt: new Date(cloud.updated_at).getTime(),
        updatedAt: new Date(cloud.updated_at).getTime(),
        playTime: cloud.play_time,
        chapterCount: cloud.chapter_count,
        characterName: cloud.character_name,
        characterLevel: cloud.character_level,
      });
      localStorage.setItem('lwe_campaign_index', JSON.stringify(index));
      
      toast.success(`Downloaded "${cloud.campaign_name}"`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error('[DownloadCloud] Single download error:', err);
      toast.error('Failed to download campaign');
    }
  }, [campaigns]);
  
  // Delete from cloud state
  const [cloudDeleteTarget, setCloudDeleteTarget] = useState<CloudCampaignInfo | null>(null);
  const [isDeletingCloud, setIsDeletingCloud] = useState(false);
  
  const handleDeleteFromCloud = useCallback(async () => {
    if (!cloudDeleteTarget) return;
    
    setIsDeletingCloud(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }
      
      const { error } = await supabase
        .from('cloud_saves')
        .delete()
        .eq('campaign_id', cloudDeleteTarget.campaign_id)
        .eq('user_id', user.id);
      
      if (error) {
        console.error('[DeleteCloud] Error:', error);
        toast.error('Failed to delete from cloud');
      } else {
        toast.success(`Deleted "${cloudDeleteTarget.campaign_name}" from cloud`);
        // Remove from local list
        setCloudCampaigns(prev => prev.filter(c => c.campaign_id !== cloudDeleteTarget.campaign_id));
      }
    } catch (err) {
      console.error('[DeleteCloud] Error:', err);
      toast.error('Failed to delete from cloud');
    } finally {
      setIsDeletingCloud(false);
      setCloudDeleteTarget(null);
    }
  }, [cloudDeleteTarget]);
  
  // Sort campaigns by last updated
  const sortedCampaigns = [...campaigns].sort((a, b) => b.updatedAt - a.updatedAt);
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative">
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Your Campaigns
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-muted-foreground">
                {campaigns.length} of {MAX_CAMPAIGNS} campaign slots used
              </p>
              {storageStats && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  <HardDrive className="h-3 w-3" />
                  <span>{(storageStats.totalBytes / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="gap-2"
            >
              <UserCircle className="h-4 w-4" />
              Profile
            </Button>
            
            <CloudSyncIndicator variant="badge" />
            
            {isAuthenticated && campaigns.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncAllClick}
                disabled={isSyncingAll}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
                {isSyncingAll ? 'Syncing...' : 'Sync All'}
              </Button>
            )}
            
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDownloadDialog}
                className="gap-2"
              >
                <CloudDownload className="h-4 w-4" />
                Download
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportClick}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
            
            <Button
              onClick={onCreateNew}
              disabled={!canCreate}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>
        
        {/* Campaign Grid */}
        {sortedCampaigns.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-card/80 to-card/40 backdrop-blur border-border/50 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative flex flex-col items-center gap-6">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -inset-2 rounded-full border border-primary/20 animate-pulse" />
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-primary animate-bounce" style={{ animationDelay: '500ms' }} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Your Story Awaits</h2>
                <p className="text-muted-foreground max-w-md leading-relaxed">
                  Every great adventure begins with a single step. Create your first campaign and let the AI narrator guide you through an 
                  <span className="text-primary font-medium"> unforgettable journey</span>.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
                <Button onClick={onCreateNew} size="lg" className="gap-2 shadow-lg shadow-primary/20">
                  <Plus className="h-5 w-5" />
                  Begin Your Adventure
                </Button>
                <p className="text-xs text-muted-foreground">
                  Fantasy • Sci-Fi • Mystery • Horror & more
                </p>
              </div>
              
              {/* Feature hints */}
              <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                <div className="space-y-1">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center mx-auto">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Custom Characters</p>
                </div>
                <div className="space-y-1">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center mx-auto">
                    <Swords className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Dynamic Combat</p>
                </div>
                <div className="space-y-1">
                  <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center mx-auto">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Branching Stories</p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                isActive={campaign.id === activeCampaignId}
                onContinue={() => handleContinue(campaign)}
                onDelete={() => setDeleteConfirm(campaign)}
                onDuplicate={() => {
                  setDuplicateTarget(campaign);
                  setDuplicateName(`${campaign.name} (Copy)`);
                }}
                onExport={() => handleExport(campaign)}
              />
            ))}
          </div>
        )}
        
        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-destructive/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          </div>
          <Card className="bg-destructive/5 border-destructive/20 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Bomb className="h-4 w-4" />
                  Delete All Data
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete all campaigns, saves, and game data. This cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleOpenNuclearWipe}
                className="gap-2 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                Wipe All Data
              </Button>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Campaign?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
              All progress, checkpoints, and story data will be permanently lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Duplicate Dialog */}
      <Dialog open={!!duplicateTarget} onOpenChange={() => setDuplicateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Campaign</DialogTitle>
            <DialogDescription>
              Create a copy of "{duplicateTarget?.name}" to explore different paths.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="New campaign name"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={!duplicateName.trim()}>
              Create Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Save Recovery Modal */}
      <SaveRecoveryModal
        open={showRecoveryModal}
        snapshot={recoverySnapshot}
        onClose={() => setShowRecoveryModal(false)}
        onRecovered={handleRecovered}
        onAbort={handleRecoveryAbort}
        onAskAI={handleSwitchToAI}
      />
      
      {/* Ask AI Help Modal */}
      <AskAIHelpModal
        open={showAskAIModal}
        snapshot={recoverySnapshot}
        onClose={() => setShowAskAIModal(false)}
        onRecovered={handleRecovered}
        onSwitchToRecovery={handleSwitchToRecovery}
      />
      
      {/* Nuclear Wipe Confirmation Dialog */}
      <Dialog open={showNuclearConfirm} onOpenChange={(open) => {
        if (!open) {
          setShowNuclearConfirm(false);
          setNuclearStep(0);
        }
      }}>
        <DialogContent className="border-destructive/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Bomb className="h-5 w-5" />
              {nuclearStep === 0 && 'Delete All Game Data?'}
              {nuclearStep === 1 && 'Are You Sure?'}
              {nuclearStep === 2 && 'Final Warning!'}
            </DialogTitle>
            <DialogDescription className="space-y-3">
              {nuclearStep === 0 && (
                <>
                  <p>This will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>All {campaigns.length} campaign(s)</li>
                    <li>All saved progress and checkpoints</li>
                    <li>All character data and inventories</li>
                    <li>All settings and preferences</li>
                  </ul>
                  {storageStats && (
                    <div className="flex items-center gap-2 text-xs mt-2 p-2 bg-muted rounded">
                      <HardDrive className="h-4 w-4" />
                      <span>Using {(storageStats.totalBytes / 1024).toFixed(1)} KB across {storageStats.gameKeys} storage entries</span>
                    </div>
                  )}
                </>
              )}
              {nuclearStep === 1 && (
                <p className="text-destructive font-medium">
                  This action cannot be undone. All your campaigns and progress will be lost forever.
                  Click again to confirm you understand.
                </p>
              )}
              {nuclearStep === 2 && (
                <div className="text-center py-4">
                  <p className="text-lg font-bold text-destructive">LAST CHANCE</p>
                  <p className="text-sm mt-2">
                    After this, there is no going back. The page will reload and all data will be gone.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNuclearConfirm(false);
                setNuclearStep(0);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleNuclearWipe}
              className="gap-2"
            >
              {nuclearStep === 0 && 'Yes, Delete Everything'}
              {nuclearStep === 1 && 'I Understand, Continue'}
              {nuclearStep === 2 && '🔥 WIPE ALL DATA 🔥'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Sync All Confirmation Dialog */}
      <Dialog open={showSyncAllDialog} onOpenChange={(open) => {
        if (!open && !isSyncingAll) {
          setShowSyncAllDialog(false);
          setSyncProgress(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              Sync All Campaigns to Cloud
            </DialogTitle>
            <DialogDescription>
              {!syncProgress ? (
                <span>
                  This will upload all {campaigns.length} local campaign{campaigns.length !== 1 ? 's' : ''} to the cloud. 
                  Existing cloud saves will be updated if the local version is newer.
                </span>
              ) : (
                <span>
                  Syncing campaigns to cloud...
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {/* Progress Section */}
          {syncProgress && (
            <div className="py-4 space-y-4">
              {/* Overall Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{syncProgress.current} / {syncProgress.total}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  />
                </div>
                {syncProgress.current < syncProgress.total && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Syncing: {syncProgress.currentName}
                  </p>
                )}
              </div>
              
              {/* Individual Results */}
              {syncProgress.results.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {syncProgress.results.map((result, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-2 text-sm p-2 rounded ${
                        result.success 
                          ? 'bg-green-500/10 text-green-400' 
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {result.success ? (
                        <Check className="h-4 w-4 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{result.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {!isSyncingAll && !syncProgress && (
              <>
                <Button variant="outline" onClick={() => setShowSyncAllDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSyncAllConfirm} className="gap-2">
                  <Cloud className="h-4 w-4" />
                  Sync {campaigns.length} Campaign{campaigns.length !== 1 ? 's' : ''}
                </Button>
              </>
            )}
            {syncProgress && syncProgress.current === syncProgress.total && (
              <Button onClick={() => {
                setShowSyncAllDialog(false);
                setSyncProgress(null);
              }}>
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Download from Cloud Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={(open) => {
        if (!open && !isDownloading) {
          setShowDownloadDialog(false);
          setDownloadProgress(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CloudDownload className="h-5 w-5 text-primary" />
              Download from Cloud
            </DialogTitle>
            <DialogDescription>
              {!downloadProgress ? (
                <span>
                  Restore campaigns saved in the cloud to this device.
                </span>
              ) : (
                <span>
                  Downloading campaigns...
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {/* Loading State */}
          {isLoadingCloud && (
            <div className="py-8 flex flex-col items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading cloud campaigns...</p>
            </div>
          )}
          
          {/* Cloud Campaigns List */}
          {!isLoadingCloud && !downloadProgress && (
            <div className="py-4">
              {cloudCampaigns.length === 0 ? (
                <div className="text-center py-6">
                  <Cloud className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No campaigns found in cloud</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Use "Sync All" to upload your local campaigns
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {cloudCampaigns.map((cloud) => {
                    const existsLocally = campaigns.some(c => c.id === cloud.campaign_id);
                    return (
                      <div
                        key={cloud.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {cloud.campaign_name}
                            </span>
                            <Badge variant="outline" className={GENRE_COLORS[cloud.primary_genre] || 'bg-muted'}>
                              {cloud.primary_genre}
                            </Badge>
                            {existsLocally && (
                              <Badge variant="secondary" className="text-xs">
                                Local
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {cloud.character_name} Lv.{cloud.character_level}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatPlayTime(cloud.play_time)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadSingle(cloud)}
                            disabled={existsLocally}
                            title={existsLocally ? 'Already downloaded' : 'Download to local'}
                          >
                            {existsLocally ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCloudDeleteTarget(cloud)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete from cloud"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Download Progress */}
          {downloadProgress && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{downloadProgress.current} / {downloadProgress.total}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                  />
                </div>
                {downloadProgress.current < downloadProgress.total && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Downloading: {downloadProgress.currentName}
                  </p>
                )}
              </div>
              
              {downloadProgress.results.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {downloadProgress.results.map((result, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-2 text-sm p-2 rounded ${
                        result.success 
                          ? result.skipped
                            ? 'bg-muted/50 text-muted-foreground'
                            : 'bg-green-500/10 text-green-400'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {result.success ? (
                        <Check className="h-4 w-4 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{result.name}</span>
                      {result.skipped && (
                        <span className="text-xs text-muted-foreground ml-auto">(already local)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {!isDownloading && !downloadProgress && (
              <>
                <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
                  Cancel
                </Button>
                {cloudCampaigns.length > 0 && (
                  <Button onClick={handleDownloadAll} className="gap-2">
                    <CloudDownload className="h-4 w-4" />
                    Download All ({cloudCampaigns.length})
                  </Button>
                )}
              </>
            )}
            {downloadProgress && downloadProgress.current === downloadProgress.total && (
              <Button onClick={() => {
                setShowDownloadDialog(false);
                setDownloadProgress(null);
              }}>
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete from Cloud Confirmation */}
      <Dialog open={!!cloudDeleteTarget} onOpenChange={(open) => {
        if (!open && !isDeletingCloud) {
          setCloudDeleteTarget(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete from Cloud?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                This will permanently delete <strong>"{cloudDeleteTarget?.campaign_name}"</strong> from the cloud.
              </p>
              {campaigns.some(c => c.id === cloudDeleteTarget?.campaign_id) ? (
                <p className="text-sm text-muted-foreground">
                  Your local copy will be preserved.
                </p>
              ) : (
                <p className="text-sm text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  No local copy exists. This data will be lost permanently.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCloudDeleteTarget(null)}
              disabled={isDeletingCloud}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteFromCloud}
              disabled={isDeletingCloud}
              className="gap-2"
            >
              {isDeletingCloud ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete from Cloud
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// CAMPAIGN CARD COMPONENT
// ============================================================================

interface CampaignCardProps {
  campaign: CampaignMetadata;
  isActive: boolean;
  onContinue: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
}

function CampaignCard({
  campaign,
  isActive,
  onContinue,
  onDelete,
  onDuplicate,
  onExport,
}: CampaignCardProps) {
  const genreColor = GENRE_COLORS[campaign.primaryGenre] || GENRE_COLORS.custom;
  
  return (
    <Card className={`
      relative overflow-hidden bg-card/50 backdrop-blur border-border/50
      hover:border-primary/50 transition-all duration-300
      ${isActive ? 'ring-2 ring-primary/50' : ''}
    `}>
      {/* Active Badge */}
      {isActive && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-primary text-primary-foreground">ACTIVE</Badge>
        </div>
      )}
      
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-foreground truncate pr-16">
            {campaign.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={genreColor}>
              {campaign.primaryGenre}
            </Badge>
            <CampaignSyncStatus campaignId={campaign.id} variant="badge" />
          </div>
        </div>
        
        {/* Character Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{campaign.characterName}</span>
          <span className="text-primary">Lv.{campaign.characterLevel}</span>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatPlayTime(campaign.playTime)}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            Ch.{campaign.chapterCount}
          </div>
          <div className="flex items-center gap-1">
            <Swords className="h-3.5 w-3.5" />
            {formatLastPlayed(campaign.updatedAt)}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button
            onClick={onContinue}
            size="sm"
            className="flex-1 gap-1"
          >
            <Play className="h-4 w-4" />
            Continue
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onDuplicate}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            title="Export"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
