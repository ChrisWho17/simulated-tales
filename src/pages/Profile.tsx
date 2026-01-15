// ============================================================================
// PROFILE PAGE - User account management and synced campaigns
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { CloudSyncService, CloudSave } from '@/services/cloudSyncService';
import { renameCampaign } from '@/lib/campaignStorage';
import { PageTransition } from '@/components/ui/PageTransition';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CampaignSaveSkeletonList } from '@/components/ui/SkeletonLoader';
import { 
  User, 
  Cloud, 
  CloudOff, 
  ArrowLeft, 
  LogOut, 
  RefreshCw, 
  Trash2, 
  Download,
  Clock,
  Sword,
  BookOpen,
  Loader2,
  Mail,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { AuthModal } from '@/components/cloud/AuthModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  
  const [cloudSaves, setCloudSaves] = useState<CloudSave[]>([]);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Rename state
  const [renameTarget, setRenameTarget] = useState<CloudSave | null>(null);
  const [newName, setNewName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Load cloud saves when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCloudSaves();
    }
  }, [isAuthenticated]);

  const loadCloudSaves = async () => {
    setIsLoadingSaves(true);
    try {
      const saves = await CloudSyncService.listCloudSaves();
      setCloudSaves(saves);
    } catch (error) {
      console.error('Failed to load cloud saves:', error);
      toast.error('Failed to load cloud saves');
    } finally {
      setIsLoadingSaves(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await CloudSyncService.fullSync();
      if (result.success) {
        toast.success(`Synced! Uploaded: ${result.uploaded}, Downloaded: ${result.downloaded}`);
        await loadCloudSaves();
      } else {
        toast.error('Sync failed: ' + result.errors.join(', '));
      }
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteCloudSave = async (campaignId: string) => {
    setIsDeleting(true);
    try {
      const result = await CloudSyncService.deleteCloudSave(campaignId);
      if (result.success) {
        toast.success('Cloud save deleted');
        await loadCloudSaves();
      } else {
        toast.error('Failed to delete: ' + result.error);
      }
    } catch (error) {
      toast.error('Failed to delete cloud save');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleDownload = async (campaignId: string) => {
    try {
      const result = await CloudSyncService.downloadCampaign(campaignId);
      if (result.success) {
        toast.success('Campaign downloaded to local storage');
      } else {
        toast.error('Download failed: ' + result.error);
      }
    } catch (error) {
      toast.error('Failed to download campaign');
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !newName.trim()) return;
    
    setIsRenaming(true);
    try {
      // Rename locally first
      const success = renameCampaign(renameTarget.campaign_id, newName.trim());
      
      if (success) {
        // Re-sync to cloud to update the name there too
        await CloudSyncService.uploadCampaign(renameTarget.campaign_id);
        toast.success(`Renamed to "${newName.trim()}"`);
        await loadCloudSaves();
      } else {
        toast.error('Failed to rename campaign');
      }
    } catch (error) {
      toast.error('Failed to rename campaign');
    } finally {
      setIsRenaming(false);
      setRenameTarget(null);
      setNewName('');
    }
  };

  const openRenameDialog = (save: CloudSave) => {
    setRenameTarget(save);
    setNewName(save.campaign_name);
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const formatPlayTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getUserInitials = (): string => {
    if (!user) return '?';
    const name = user.user_metadata?.name || user.email || '';
    if (name.includes('@')) {
      return name.split('@')[0].charAt(0).toUpperCase();
    }
    return name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Auto-focus ref for rename input
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  // Focus rename input when dialog opens
  useEffect(() => {
    if (renameTarget && renameInputRef.current) {
      setTimeout(() => renameInputRef.current?.focus(), 100);
    }
  }, [renameTarget]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Breadcrumbs 
                items={[
                  { label: 'Profile' }
                ]} 
              />
              <h1 className="text-xl font-semibold hidden sm:block">Profile Settings</h1>
              <div className="w-20" /> {/* Spacer for centering */}
            </div>
          </div>
        </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>
              Manage your account settings and sign-in options
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-lg bg-primary/10">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {user.user_metadata?.name || user.email?.split('@')[0]}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      <Cloud className="h-3 w-3 mr-1" />
                      Cloud Sync Enabled
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CloudOff className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Not Signed In</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Sign in to sync your campaigns across devices and protect against data loss.
                </p>
                <Button onClick={() => setShowAuthModal(true)} className="gap-2">
                  <Cloud className="h-4 w-4" />
                  Sign In to Enable Cloud Sync
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cloud Saves Section */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Cloud Saves
                  </CardTitle>
                  <CardDescription>
                    Your campaigns synced to the cloud ({cloudSaves.length} saves)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadCloudSaves}
                    disabled={isLoadingSaves}
                  >
                    {isLoadingSaves ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="gap-2"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Cloud className="h-4 w-4" />
                    )}
                    Sync All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSaves ? (
                <CampaignSaveSkeletonList count={3} />
              ) : cloudSaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Cloud className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Cloud Saves Yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    Create a campaign and it will automatically sync to the cloud, 
                    or click "Sync All" to upload your existing local saves.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {cloudSaves.map((save) => (
                      <div 
                        key={save.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate">
                              {save.campaign_name}
                            </h4>
                            <Badge variant="outline" className="shrink-0">
                              {save.primary_genre}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Sword className="h-3 w-3" />
                              {save.character_name} (Lv. {save.character_level})
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {save.chapter_count} chapters
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatPlayTime(save.play_time)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last synced {formatDistanceToNow(new Date(save.last_synced_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRenameDialog(save)}
                            title="Rename campaign"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(save.campaign_id)}
                            title="Download to local storage"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(save.campaign_id)}
                            title="Delete cloud save"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sync Info */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">About Cloud Sync</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                • Your campaigns are automatically synced when you save the game
              </p>
              <p>
                • Cloud saves are compressed and stored securely
              </p>
              <p>
                • Sign in on any device to access your campaigns
              </p>
              <p>
                • Local saves remain even if you sign out
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cloud Save?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the save from the cloud. Your local save will not be affected.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteCloudSave(deleteConfirm)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Campaign</DialogTitle>
            <DialogDescription>
              Enter a new name for "{renameTarget?.campaign_name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              ref={renameInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              className="mt-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRenameTarget(null)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRename}
              disabled={isRenaming || !newName.trim()}
            >
              {isRenaming ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PageTransition>
  );
}
