// ============================================================================
// LOAD FAILED MODAL - User-friendly load error handling with recovery options
// Phase 6: Error Recovery UX
// ============================================================================

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Upload, Trash2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LoadFailedModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  campaignId?: string;
  campaignName?: string;
  onRetry?: () => Promise<boolean>;
  onLoadFromBackup?: () => void;
  onImportFile?: (file: File) => Promise<boolean>;
  onDeleteCorrupted?: () => Promise<void>;
  hasLocalBackup?: boolean;
  hasCloudBackup?: boolean;
}

export function LoadFailedModal({
  isOpen,
  onClose,
  error,
  campaignId,
  campaignName,
  onRetry,
  onLoadFromBackup,
  onImportFile,
  onDeleteCorrupted,
  hasLocalBackup = false,
  hasCloudBackup = false,
}: LoadFailedModalProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      const success = await onRetry();
      if (success) {
        setLoadSuccess(true);
        setTimeout(() => {
          onClose();
          setLoadSuccess(false);
        }, 1500);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const handleImportFile = async () => {
    if (!onImportFile) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setIsImporting(true);
      try {
        const success = await onImportFile(file);
        if (success) {
          setLoadSuccess(true);
          setTimeout(() => {
            onClose();
            setLoadSuccess(false);
          }, 1500);
        }
      } finally {
        setIsImporting(false);
      }
    };
    
    input.click();
  };

  const handleDelete = async () => {
    if (!onDeleteCorrupted) return;
    
    if (!confirm(`Are you sure you want to delete "${campaignName || campaignId}"? This cannot be undone.`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDeleteCorrupted();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const getErrorCategory = (errorMsg: string): 'corruption' | 'missing' | 'parse' | 'unknown' => {
    if (errorMsg.includes('checksum') || errorMsg.includes('corruption') || errorMsg.includes('invalid')) {
      return 'corruption';
    }
    if (errorMsg.includes('not found') || errorMsg.includes('null') || errorMsg.includes('undefined')) {
      return 'missing';
    }
    if (errorMsg.includes('parse') || errorMsg.includes('JSON') || errorMsg.includes('syntax')) {
      return 'parse';
    }
    return 'unknown';
  };

  const errorCategory = getErrorCategory(error);

  const getRecoveryOptions = () => {
    const options: { icon: typeof Clock; label: string; action: () => void; variant: 'default' | 'outline' | 'destructive' }[] = [];
    
    if (onRetry) {
      options.push({
        icon: RefreshCw,
        label: 'Try Again',
        action: handleRetry,
        variant: 'default',
      });
    }
    
    if (hasLocalBackup && onLoadFromBackup) {
      options.push({
        icon: Clock,
        label: 'Load Last Backup',
        action: onLoadFromBackup,
        variant: 'outline',
      });
    }
    
    if (onImportFile) {
      options.push({
        icon: Upload,
        label: 'Import from File',
        action: handleImportFile,
        variant: 'outline',
      });
    }
    
    if (onDeleteCorrupted && (errorCategory === 'corruption' || errorCategory === 'parse')) {
      options.push({
        icon: Trash2,
        label: 'Delete Corrupted Save',
        action: handleDelete,
        variant: 'destructive',
      });
    }
    
    return options;
  };

  const recoveryOptions = getRecoveryOptions();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              loadSuccess ? 'bg-green-500/10' : 'bg-destructive/10'
            }`}>
              {loadSuccess ? (
                <RefreshCw className="h-5 w-5 text-green-500 animate-spin" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <DialogTitle>
                {loadSuccess ? 'Loaded Successfully!' : 'Failed to Load Campaign'}
              </DialogTitle>
              <DialogDescription>
                {loadSuccess 
                  ? 'Your campaign has been restored.'
                  : campaignName 
                    ? `Could not load "${campaignName}"`
                    : 'The campaign data could not be read.'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!loadSuccess && (
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-md bg-muted text-xs font-mono">
              <p className="text-destructive">{error}</p>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              {errorCategory === 'corruption' && (
                <p>
                  The save file appears to be corrupted. You can try loading from a backup
                  or importing a previously exported save file.
                </p>
              )}
              {errorCategory === 'missing' && (
                <p>
                  The campaign data could not be found. It may have been deleted or 
                  the storage was cleared.
                </p>
              )}
              {errorCategory === 'parse' && (
                <p>
                  The save file format is invalid. This can happen if the file was 
                  modified externally.
                </p>
              )}
              {errorCategory === 'unknown' && (
                <p>
                  An unexpected error occurred while loading. Try again or import 
                  from a backup file.
                </p>
              )}
            </div>

            {(hasLocalBackup || hasCloudBackup) && (
              <div className="text-xs text-muted-foreground p-2 bg-primary/10 rounded flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {hasCloudBackup 
                    ? 'A cloud backup is available' 
                    : 'A local backup is available'}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col gap-2">
          {!loadSuccess && recoveryOptions.map((option, index) => {
            const Icon = option.icon;
            const isLoading = 
              (option.label === 'Try Again' && isRetrying) ||
              (option.label === 'Import from File' && isImporting) ||
              (option.label === 'Delete Corrupted Save' && isDeleting);
            
            return (
              <Button
                key={index}
                variant={option.variant}
                onClick={option.action}
                disabled={isRetrying || isImporting || isDeleting}
                className="w-full"
              >
                <Icon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Working...' : option.label}
              </Button>
            );
          })}
          
          <Button 
            variant={loadSuccess ? "default" : "ghost"}
            onClick={onClose}
            className="w-full"
          >
            {loadSuccess ? 'Continue' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LoadFailedModal;
