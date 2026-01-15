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
} from 'lucide-react';
import { SaveRecoveryModal, AskAIHelpModal } from '@/components/campaign';
import { createFailureSnapshot } from '@/lib/saveRecovery/pipeline';
import { runInvariants } from '@/lib/saveRecovery/invariants';
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
  const handleContinue = useCallback((campaign: CampaignMetadata) => {
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
    
    // Campaign is valid, load normally
    const success = loadCampaign(campaign.id);
    if (success) {
      onSelectCampaign();
    } else {
      toast.error('Failed to load campaign');
    }
  }, [loadCampaign, onSelectCampaign]);
  
  // Handle recovery success
  const handleRecovered = useCallback((save: unknown) => {
    if (pendingCampaignId) {
      // Re-save the recovered data and load
      const success = loadCampaign(pendingCampaignId);
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
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const result = importCampaign(json);
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
  
  // Sort campaigns by last updated
  const sortedCampaigns = [...campaigns].sort((a, b) => b.updatedAt - a.updatedAt);
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
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
            <CloudSyncIndicator variant="badge" />
            
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
