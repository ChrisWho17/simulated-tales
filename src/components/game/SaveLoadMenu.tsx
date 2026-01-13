// ============================================================================
// SAVE/LOAD MENU UI - Comprehensive save slot management
// ============================================================================

import React, { useState, useRef } from 'react';
import { 
  Save, FolderOpen, Trash2, Copy, Edit2, Download, Upload, 
  Plus, Clock, User, BookOpen, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGameSaves, SaveSlot } from '@/hooks/useGameSaves';
import { CampaignData } from '@/types/campaign';

interface SaveLoadMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentCampaign: CampaignData | null;
  onLoad: (campaign: CampaignData) => void;
  onNewGame: () => void;
  hasUnsavedChanges?: boolean;
}

function formatPlayTime(seconds: number): string {
  if (seconds < 60) return 'Just started';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SaveLoadMenu({
  isOpen,
  onClose,
  currentCampaign,
  onLoad,
  onNewGame,
  hasUnsavedChanges = false,
}: SaveLoadMenuProps) {
  const {
    saves,
    currentSaveId,
    isLoading,
    error,
    createSave,
    loadSave,
    deleteSave,
    renameSave,
    duplicateSave,
    exportSave,
    importSave,
    exportAllSaves,
    refreshSaves,
  } = useGameSaves();
  
  const [selectedSlot, setSelectedSlot] = useState<SaveSlot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLoadConfirm, setShowLoadConfirm] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [operationStatus, setOperationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const showStatus = (type: 'success' | 'error', message: string) => {
    setOperationStatus({ type, message });
    setTimeout(() => setOperationStatus(null), 3000);
  };
  
  const handleSaveNew = async () => {
    if (!currentCampaign || !saveName.trim()) return;
    
    setIsSaving(true);
    try {
      const saveId = await createSave(saveName.trim(), currentCampaign);
      if (saveId) {
        showStatus('success', 'Game saved successfully!');
        setShowSaveDialog(false);
        setSaveName('');
      } else {
        showStatus('error', error || 'Failed to save game');
      }
    } catch (err) {
      showStatus('error', 'Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleOverwrite = async (slot: SaveSlot) => {
    if (!currentCampaign) return;
    
    setIsSaving(true);
    try {
      await deleteSave(slot.id);
      const saveId = await createSave(slot.name, currentCampaign);
      if (saveId) {
        showStatus('success', 'Save overwritten successfully!');
      } else {
        showStatus('error', 'Failed to overwrite save');
      }
    } catch (err) {
      showStatus('error', 'Failed to overwrite save');
    } finally {
      setIsSaving(false);
      setSelectedSlot(null);
    }
  };
  
  const handleLoad = async () => {
    if (!selectedSlot) return;
    
    try {
      const campaign = await loadSave(selectedSlot.id);
      if (campaign) {
        onLoad(campaign);
        onClose();
        showStatus('success', 'Game loaded successfully!');
      } else {
        showStatus('error', 'Failed to load save');
      }
    } catch (err) {
      showStatus('error', 'Failed to load save');
    }
    setShowLoadConfirm(false);
  };
  
  const handleDelete = async () => {
    if (!selectedSlot) return;
    
    try {
      const success = await deleteSave(selectedSlot.id);
      if (success) {
        showStatus('success', 'Save deleted');
        setSelectedSlot(null);
      } else {
        showStatus('error', 'Failed to delete save');
      }
    } catch (err) {
      showStatus('error', 'Failed to delete save');
    }
    setShowDeleteConfirm(false);
  };
  
  const handleRename = async () => {
    if (!selectedSlot || !renameValue.trim()) return;
    
    try {
      const success = await renameSave(selectedSlot.id, renameValue.trim());
      if (success) {
        showStatus('success', 'Save renamed');
        setSelectedSlot({ ...selectedSlot, name: renameValue.trim() });
      } else {
        showStatus('error', 'Failed to rename save');
      }
    } catch (err) {
      showStatus('error', 'Failed to rename save');
    }
    setShowRenameDialog(false);
    setRenameValue('');
  };
  
  const handleDuplicate = async (slot: SaveSlot) => {
    try {
      const newId = await duplicateSave(slot.id);
      if (newId) {
        showStatus('success', 'Save duplicated');
      } else {
        showStatus('error', 'Failed to duplicate save');
      }
    } catch (err) {
      showStatus('error', 'Failed to duplicate save');
    }
  };
  
  const handleExport = (slot: SaveSlot) => {
    const json = exportSave(slot.id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slot.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('success', 'Save exported');
    } else {
      showStatus('error', 'Failed to export save');
    }
  };
  
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const json = event.target?.result as string;
      const saveId = await importSave(json);
      if (saveId) {
        showStatus('success', 'Save imported successfully');
      } else {
        showStatus('error', 'Failed to import save');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
  const handleNewGame = () => {
    if (hasUnsavedChanges) {
      setShowNewGameConfirm(true);
    } else {
      onNewGame();
      onClose();
    }
  };
  
  const confirmNewGame = () => {
    setShowNewGameConfirm(false);
    onNewGame();
    onClose();
  };
  
  const handleLoadClick = (slot: SaveSlot) => {
    setSelectedSlot(slot);
    if (hasUnsavedChanges) {
      setShowLoadConfirm(true);
    } else {
      loadSave(slot.id).then(campaign => {
        if (campaign) {
          onLoad(campaign);
          onClose();
        }
      });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Save & Load Game
            </DialogTitle>
            <DialogDescription>
              Manage your game saves. You have {saves.length}/20 saves.
            </DialogDescription>
          </DialogHeader>
          
          {/* Status Message */}
          {operationStatus && (
            <div className={`flex items-center gap-2 p-2 rounded text-sm ${
              operationStatus.type === 'success' 
                ? 'bg-green-500/10 text-green-500 border border-green-500/30' 
                : 'bg-destructive/10 text-destructive border border-destructive/30'
            }`}>
              {operationStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {operationStatus.message}
            </div>
          )}
          
          {/* Actions Bar */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleNewGame}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Game
            </Button>
            
            {currentCampaign && (
              <Button 
                size="sm"
                onClick={() => {
                  setSaveName(currentCampaign.meta?.name || 'New Save');
                  setShowSaveDialog(true);
                }}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Current
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const json = exportAllSaves();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `all-saves-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-4 h-4 mr-1" />
              Export All
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          
          {/* Save Slots */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : saves.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saves yet</p>
                <p className="text-sm">Start playing and save your progress!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {saves.map(slot => (
                  <div
                    key={slot.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      currentSaveId === slot.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{slot.name}</span>
                          {currentSaveId === slot.id && (
                            <Badge variant="outline" className="text-xs">Current</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {slot.preview.characterName}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Ch. {slot.chapter}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatPlayTime(slot.playTime)}
                          </span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(slot.updatedAt)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleLoadClick(slot)}
                        >
                          <FolderOpen className="w-4 h-4" />
                        </Button>
                        
                        {currentCampaign && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOverwrite(slot)}
                            title="Overwrite with current game"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setRenameValue(slot.name);
                            setShowRenameDialog(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(slot)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExport(slot)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Game</DialogTitle>
            <DialogDescription>
              Enter a name for your save file.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Save name..."
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNew} disabled={isSaving || !saveName.trim()}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Save</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="New name..."
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Save?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSlot?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Load Confirmation (with unsaved changes) */}
      <AlertDialog open={showLoadConfirm} onOpenChange={setShowLoadConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Loading a different save will lose your current progress. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoad}>
              Load Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* New Game Confirmation */}
      <AlertDialog open={showNewGameConfirm} onOpenChange={setShowNewGameConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Game?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Starting a new game will lose your current progress. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNewGame}>
              Start New Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default SaveLoadMenu;
