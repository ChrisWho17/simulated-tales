// ============================================================================
// SAVE FAILED MODAL - User-friendly save error handling with recovery options
// Phase 6: Error Recovery UX
// ============================================================================

import React, { useState } from 'react';
import { AlertTriangle, Download, RefreshCw, Cloud, HardDrive } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CampaignData } from '@/types/campaign';

interface SaveFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  campaignData?: CampaignData | null;
  onRetry?: () => Promise<boolean>;
  onExport?: () => void;
  recoverable?: boolean;
}

export function SaveFailedModal({
  isOpen,
  onClose,
  error,
  campaignData,
  onRetry,
  onExport,
  recoverable = true,
}: SaveFailedModalProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retrySuccess, setRetrySuccess] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      const success = await onRetry();
      if (success) {
        setRetrySuccess(true);
        setTimeout(() => {
          onClose();
          setRetrySuccess(false);
          setRetryCount(0);
        }, 1500);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleExportBackup = () => {
    if (onExport) {
      onExport();
      return;
    }
    
    if (!campaignData) return;
    
    try {
      const exportData = {
        ...campaignData,
        _exportedAt: new Date().toISOString(),
        _exportReason: 'save_failed_backup',
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaignData.meta?.name || 'campaign'}-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[SaveFailedModal] Export failed:', e);
    }
  };

  const getErrorCategory = (errorMsg: string): 'quota' | 'network' | 'corruption' | 'unknown' => {
    if (errorMsg.includes('quota') || errorMsg.includes('QuotaExceeded')) {
      return 'quota';
    }
    if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('offline')) {
      return 'network';
    }
    if (errorMsg.includes('checksum') || errorMsg.includes('corruption') || errorMsg.includes('invalid')) {
      return 'corruption';
    }
    return 'unknown';
  };

  const errorCategory = getErrorCategory(error);

  const getErrorGuidance = () => {
    switch (errorCategory) {
      case 'quota':
        return {
          icon: HardDrive,
          title: 'Storage Full',
          description: 'Your browser storage is full. Export your campaign and clear old data.',
          action: 'Free up space by clearing browser data for unused sites.',
        };
      case 'network':
        return {
          icon: Cloud,
          title: 'Connection Issue',
          description: 'Could not sync to cloud. Your progress is saved locally.',
          action: 'Check your internet connection and try again.',
        };
      case 'corruption':
        return {
          icon: AlertTriangle,
          title: 'Data Issue',
          description: 'There was an issue with the save data. Export a backup immediately.',
          action: 'Export your campaign backup before trying again.',
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'Save Failed',
          description: 'Your progress could not be saved. Export a backup to be safe.',
          action: 'Try again or export your campaign.',
        };
    }
  };

  const guidance = getErrorGuidance();
  const GuidanceIcon = guidance.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              retrySuccess ? 'bg-green-500/10' : 'bg-destructive/10'
            }`}>
              {retrySuccess ? (
                <RefreshCw className="h-5 w-5 text-green-500 animate-spin" />
              ) : (
                <GuidanceIcon className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <DialogTitle>
                {retrySuccess ? 'Saved Successfully!' : guidance.title}
              </DialogTitle>
              <DialogDescription>
                {retrySuccess ? 'Your progress has been saved.' : guidance.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!retrySuccess && (
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              <p>{guidance.action}</p>
            </div>
            
            <div className="p-3 rounded-md bg-muted text-xs font-mono">
              <p className="text-destructive">{error}</p>
              {retryCount > 0 && (
                <p className="text-muted-foreground mt-1">
                  Retry attempts: {retryCount}
                </p>
              )}
            </div>

            {errorCategory === 'quota' && (
              <div className="text-xs text-muted-foreground p-2 bg-yellow-500/10 rounded">
                💡 Tip: Clear your browser's cached images and data for other websites to free up space.
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {recoverable && onRetry && !retrySuccess && (
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Saving...' : 'Try Again'}
            </Button>
          )}
          
          {campaignData && !retrySuccess && (
            <Button 
              variant="outline"
              onClick={handleExportBackup}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Backup
            </Button>
          )}
          
          <Button 
            variant={retrySuccess ? "default" : "ghost"}
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            {retrySuccess ? 'Done' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SaveFailedModal;
