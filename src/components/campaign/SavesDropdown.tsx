// ============================================================================
// SAVES DROPDOWN - Campaign management dropdown for in-game UI
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaignOptional } from '@/contexts/CampaignContext';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { formatPlayTime, formatLastPlayed } from '@/lib/campaignStorage';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Save,
  ChevronDown,
  Bookmark,
  BookmarkPlus,
  Download,
  Upload,
  Trash2,
  FolderOpen,
  Cloud,
  CloudOff,
  Loader2,
  AlertTriangle,
  Copy,
  Clock,
  RotateCcw,
  X,
} from 'lucide-react';

export function SavesDropdown() {
  const navigate = useNavigate();
  const campaignContext = useCampaignOptional();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCheckpointCreate, setShowCheckpointCreate] = useState(false);
  const [showCheckpointRestore, setShowCheckpointRestore] = useState(false);
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  
  const importInputRef = useRef<HTMLInputElement>(null);
  
  // Listen for mobile quick menu trigger - this listener MUST stay active
  // even when there's no campaign to show an appropriate message
  useEffect(() => {
    const handleOpenSaves = () => {
      // On mobile, open the sheet instead of dropdown
      setIsMobileSheetOpen(true);
    };
    
    window.addEventListener('open-saves-dropdown', handleOpenSaves);
    return () => window.removeEventListener('open-saves-dropdown', handleOpenSaves);
  }, []);
  
  // If no campaign context, show message when mobile sheet is opened
  if (!campaignContext || !campaignContext.activeCampaign) {
    return (
      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-cyan-400" />
              Saves
            </SheetTitle>
          </SheetHeader>
          <div className="py-6 text-center text-muted-foreground">
            <p>No active campaign</p>
            <p className="text-sm mt-2">Start a story first to access saves.</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  const { 
    activeCampaign, 
    isDirty, 
    lastSaved, 
    saveNow,
    createCheckpoint,
    restoreCheckpoint,
    deleteCheckpoint,
    deleteCampaign,
    exportCampaign,
    importCampaign,
    unloadCampaign,
  } = campaignContext;
  
  const checkpoints = activeCampaign.checkpoints || [];
  
  // Save status indicator
  const getSaveStatus = () => {
    if (isDirty) {
      return { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: 'Saving...', color: 'text-warning' };
    }
    if (lastSaved) {
      return { icon: <Save className="h-3.5 w-3.5" />, text: 'Saved', color: 'text-success' };
    }
    return { icon: <CloudOff className="h-3.5 w-3.5" />, text: 'Not saved', color: 'text-muted-foreground' };
  };
  
  const status = getSaveStatus();
  
  // Handle manual save
  const handleSaveNow = () => {
    saveNow();
    toast.success('Campaign saved');
  };
  
  // Handle create checkpoint
  const handleCreateCheckpoint = () => {
    if (!checkpointLabel.trim()) {
      toast.error('Please enter a checkpoint name');
      return;
    }
    
    const checkpoint = createCheckpoint(checkpointLabel.trim());
    if (checkpoint) {
      toast.success(`Checkpoint "${checkpointLabel.trim()}" created`);
      setCheckpointLabel('');
      setShowCheckpointCreate(false);
    }
  };
  
  // Handle restore checkpoint
  const handleRestoreCheckpoint = () => {
    if (!selectedCheckpoint) return;
    
    const success = restoreCheckpoint(selectedCheckpoint);
    if (success) {
      toast.success('Checkpoint restored');
      setSelectedCheckpoint(null);
      setShowCheckpointRestore(false);
    }
  };
  
  // Handle export
  const handleExport = () => {
    const json = exportCampaign(activeCampaign.id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeCampaign.meta.name.replace(/[^a-z0-9]/gi, '_')}_campaign.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Campaign exported');
    }
  };
  
  // Handle import
  const handleImportClick = () => {
    importInputRef.current?.click();
  };
  
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };
  
  // Handle delete
  const handleDelete = () => {
    deleteCampaign(activeCampaign.id);
    setShowDeleteConfirm(false);
    toast.success('Campaign deleted');
    navigate('/campaigns');
  };
  
  // Handle go to campaign manager
  const handleGoToCampaigns = () => {
    unloadCampaign();
    navigate('/campaigns');
  };
  
  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden md:flex gap-1 px-2 h-7 frosted-button text-muted-foreground/70 hover:text-foreground"
          >
            <span className={status.color}>{status.icon}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56 bg-card border-border">
          {/* Campaign Info */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-sm truncate">{activeCampaign.meta.name}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatPlayTime(activeCampaign.meta.playTime)}</span>
                <span>•</span>
                <span className={status.color}>{status.text}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Quick Actions */}
          <DropdownMenuItem onClick={handleSaveNow} className="gap-2 cursor-pointer">
            <Save className="h-4 w-4" />
            Save Now
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowCheckpointCreate(true)} className="gap-2 cursor-pointer">
            <BookmarkPlus className="h-4 w-4" />
            Create Checkpoint
          </DropdownMenuItem>
          
          {checkpoints.length > 0 && (
            <DropdownMenuItem onClick={() => setShowCheckpointRestore(true)} className="gap-2 cursor-pointer">
              <RotateCcw className="h-4 w-4" />
              Restore Checkpoint
              <span className="ml-auto text-xs text-muted-foreground">{checkpoints.length}</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {/* Import/Export */}
          <DropdownMenuItem onClick={handleExport} className="gap-2 cursor-pointer">
            <Download className="h-4 w-4" />
            Export Campaign
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleImportClick} className="gap-2 cursor-pointer">
            <Upload className="h-4 w-4" />
            Import Campaign
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Navigation */}
          <DropdownMenuItem onClick={handleGoToCampaigns} className="gap-2 cursor-pointer">
            <FolderOpen className="h-4 w-4" />
            All Campaigns
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Danger Zone */}
          <DropdownMenuItem 
            onClick={() => setShowDeleteConfirm(true)} 
            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete Campaign
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Mobile Sheet - Opens from radial menu on mobile */}
      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-xl pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-cyan-400" />
              {activeCampaign.meta.name}
            </SheetTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatPlayTime(activeCampaign.meta.playTime)}</span>
              <span>•</span>
              <span className={status.color}>{status.text}</span>
            </div>
          </SheetHeader>
          
          <div className="space-y-2">
            {/* Quick Actions */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => { handleSaveNow(); setIsMobileSheetOpen(false); }}
            >
              <Save className="h-5 w-5 text-primary" />
              Save Now
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => { setShowCheckpointCreate(true); setIsMobileSheetOpen(false); }}
            >
              <BookmarkPlus className="h-5 w-5 text-amber-400" />
              Create Checkpoint
            </Button>
            
            {checkpoints.length > 0 && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
                onClick={() => { setShowCheckpointRestore(true); setIsMobileSheetOpen(false); }}
              >
                <RotateCcw className="h-5 w-5 text-purple-400" />
                Restore Checkpoint
                <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {checkpoints.length}
                </span>
              </Button>
            )}
            
            <div className="h-px bg-border my-2" />
            
            {/* Import/Export */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => { handleExport(); setIsMobileSheetOpen(false); }}
            >
              <Download className="h-5 w-5 text-green-400" />
              Export Campaign
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => { handleImportClick(); setIsMobileSheetOpen(false); }}
            >
              <Upload className="h-5 w-5 text-blue-400" />
              Import Campaign
            </Button>
            
            <div className="h-px bg-border my-2" />
            
            {/* Navigation */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => { handleGoToCampaigns(); setIsMobileSheetOpen(false); }}
            >
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              All Campaigns
            </Button>
            
            <div className="h-px bg-border my-2" />
            
            {/* Danger Zone */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => { setShowDeleteConfirm(true); setIsMobileSheetOpen(false); }}
            >
              <Trash2 className="h-5 w-5" />
              Delete Campaign
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />
      
      {/* Create Checkpoint Dialog */}
      <Dialog open={showCheckpointCreate} onOpenChange={setShowCheckpointCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkPlus className="h-5 w-5 text-primary" />
              Create Checkpoint
            </DialogTitle>
            <DialogDescription>
              Save your current progress as a checkpoint you can return to later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={checkpointLabel}
              onChange={(e) => setCheckpointLabel(e.target.value)}
              placeholder="Enter checkpoint name..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCheckpoint()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckpointCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCheckpoint} disabled={!checkpointLabel.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Restore Checkpoint Dialog */}
      <Dialog open={showCheckpointRestore} onOpenChange={setShowCheckpointRestore}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              Restore Checkpoint
            </DialogTitle>
            <DialogDescription>
              Select a checkpoint to restore. Your current progress will be auto-saved first.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 max-h-64 overflow-y-auto">
            {checkpoints.map((checkpoint) => (
              <div
                key={checkpoint.id}
                onClick={() => setSelectedCheckpoint(checkpoint.id)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${selectedCheckpoint === checkpoint.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50 bg-card/50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{checkpoint.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checkpoint.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Bookmark className={`h-4 w-4 ${selectedCheckpoint === checkpoint.id ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckpointRestore(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestoreCheckpoint} disabled={!selectedCheckpoint}>
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Campaign?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{activeCampaign.meta.name}"? 
              This action cannot be undone. All progress, checkpoints, and story data will be permanently lost.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">This will delete:</p>
              <ul className="text-xs text-destructive/80 mt-2 space-y-1 list-disc list-inside">
                <li>{activeCampaign.narrativeHistory.length} story entries</li>
                <li>{checkpoints.length} checkpoint{checkpoints.length !== 1 ? 's' : ''}</li>
                <li>{formatPlayTime(activeCampaign.meta.playTime)} of playtime</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
