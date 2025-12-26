// ============================================================================
// CAMPAIGN MANAGER UI - Main campaign selection/management screen
// ============================================================================

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from '@/contexts/CampaignContext';
import { CampaignMetadata, MAX_CAMPAIGNS } from '@/types/campaign';
import { formatPlayTime, formatLastPlayed, canCreateCampaign } from '@/lib/campaignStorage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

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
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<CampaignMetadata | null>(null);
  
  // Duplicate dialog
  const [duplicateTarget, setDuplicateTarget] = useState<CampaignMetadata | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  
  // Import file ref
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const canCreate = canCreateCampaign();
  
  // Handle continue/load campaign
  const handleContinue = useCallback((campaign: CampaignMetadata) => {
    const success = loadCampaign(campaign.id);
    if (success) {
      onSelectCampaign();
    } else {
      toast.error('Failed to load campaign');
    }
  }, [loadCampaign, onSelectCampaign]);
  
  // Handle delete
  const handleDelete = useCallback(() => {
    if (deleteConfirm) {
      deleteCampaign(deleteConfirm.id);
      setDeleteConfirm(null);
      toast.success(`Deleted "${deleteConfirm.name}"`);
    }
  }, [deleteConfirm, deleteCampaign]);
  
  // Handle duplicate
  const handleDuplicate = useCallback(() => {
    if (duplicateTarget && duplicateName.trim()) {
      const result = duplicateCampaign(duplicateTarget.id, duplicateName.trim());
      if (result) {
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
        toast.success(`Imported "${result.meta.name}"`);
      } else {
        toast.error('Failed to import campaign');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [importCampaign]);
  
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
            <p className="text-muted-foreground mt-1">
              {campaigns.length} of {MAX_CAMPAIGNS} campaign slots used
            </p>
          </div>
          
          <div className="flex gap-2">
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
          <Card className="p-12 text-center bg-card/50 backdrop-blur border-border/50">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">No campaigns yet</h2>
              <p className="text-muted-foreground max-w-md">
                Create your first campaign to begin your adventure. Each campaign is a separate world with its own characters, story, and rules.
              </p>
              <Button onClick={onCreateNew} className="gap-2 mt-2">
                <Plus className="h-4 w-4" />
                Create Your First Campaign
              </Button>
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
