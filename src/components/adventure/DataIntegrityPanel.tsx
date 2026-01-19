// ============================================================================
// DATA INTEGRITY PANEL - UI for integrity scan and repair
// Phase 3: Visual feedback for data health
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  RefreshCw,
  FileWarning,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  Upload,
  Loader2,
  Trash2,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { 
  DataIntegrityService, 
  IntegrityReport, 
  IntegrityCheckResult,
  IntegrityIssue 
} from '@/services/dataIntegrityService';
import { UnifiedSaveArchitecture } from '@/services/unifiedSaveArchitecture';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DataIntegrityPanelProps {
  open: boolean;
  onClose: () => void;
}

export function DataIntegrityPanel({ open, onClose }: DataIntegrityPanelProps) {
  const { isAuthenticated } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'local' | 'cloud' | null>(null);
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const runScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const result = await DataIntegrityService.runFullScan();
      setReport(result);
      
      if (result.corrupted === 0 && result.unrecoverable === 0) {
        toast.success('All campaigns are healthy!');
      } else if (result.repaired > 0) {
        toast.success(`Automatically repaired ${result.repaired} campaigns`);
      } else if (result.corrupted > 0 || result.unrecoverable > 0) {
        toast.warning('Some campaigns have issues - see details below');
      }
    } catch (error) {
      toast.error('Scan failed');
      console.error('[Integrity] Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  }, []);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const handleRepairFromBackup = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Please select a backup file first');
      return;
    }
    
    setIsRepairing(true);
    try {
      const content = await selectedFile.text();
      const result = await DataIntegrityService.repairFromBackup(content);
      
      if (result.success) {
        toast.success(`Repaired ${result.repaired.length} campaigns from backup`);
        // Re-run scan to update report
        await runScan();
      } else {
        toast.error(result.error || 'Repair failed');
      }
    } catch (error) {
      toast.error('Failed to read backup file');
    } finally {
      setIsRepairing(false);
      setSelectedFile(null);
    }
  }, [selectedFile, runScan]);
  
  const getStatusIcon = (status: IntegrityCheckResult['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'repaired':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'corrupted':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'unrecoverable':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };
  
  const getStatusBadge = (status: IntegrityCheckResult['status']) => {
    switch (status) {
      case 'valid':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-500">Valid</Badge>;
      case 'repaired':
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">Repaired</Badge>;
      case 'corrupted':
        return <Badge variant="destructive" className="bg-amber-500/20">Corrupted</Badge>;
      case 'unrecoverable':
        return <Badge variant="destructive">Unrecoverable</Badge>;
    }
  };
  
  const getSeverityColor = (severity: IntegrityIssue['severity']) => {
    switch (severity) {
      case 'warning': return 'text-amber-500';
      case 'error': return 'text-orange-500';
      case 'critical': return 'text-red-500';
    }
  };
  
  const overallHealth = report
    ? report.valid === report.totalCampaigns
      ? 'healthy'
      : report.unrecoverable > 0
        ? 'critical'
        : 'warning'
    : null;
  
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Data Integrity Check
          </DialogTitle>
          <DialogDescription>
            Verify save data integrity, detect corruption, and repair from backups.
          </DialogDescription>
        </DialogHeader>
        
        {/* Overall Health */}
        {report && (
          <Alert className={
            overallHealth === 'healthy' 
              ? 'border-green-500/50 bg-green-500/10' 
              : overallHealth === 'critical'
                ? 'border-red-500/50 bg-red-500/10'
                : 'border-amber-500/50 bg-amber-500/10'
          }>
            {overallHealth === 'healthy' ? (
              <ShieldCheck className="w-4 h-4 text-green-500" />
            ) : overallHealth === 'critical' ? (
              <ShieldX className="w-4 h-4 text-red-500" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            )}
            <AlertTitle>
              {overallHealth === 'healthy' 
                ? 'All Data Healthy' 
                : overallHealth === 'critical'
                  ? 'Critical Issues Detected'
                  : 'Some Issues Found'}
            </AlertTitle>
            <AlertDescription>
              {report.totalCampaigns} campaigns checked: {report.valid} valid, {report.repaired} auto-repaired, {report.corrupted} corrupted, {report.unrecoverable} unrecoverable
            </AlertDescription>
          </Alert>
        )}
        
        {/* Scan Button */}
        {!report && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Shield className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Run an integrity scan to check all your save data for corruption or issues.
            </p>
            <Button onClick={runScan} disabled={isScanning} size="lg">
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Integrity Scan
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Scan Results */}
        {report && report.details.length > 0 && (
          <ScrollArea className="max-h-[40vh]">
            <div className="space-y-3 pr-2">
              {report.details.map((result) => (
                <Card key={result.campaignId} className="p-3 overflow-hidden">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium break-all text-sm">
                          {result.campaignName || result.campaignId}
                        </p>
                        {getStatusBadge(result.status)}
                      </div>
                      {result.repairedFrom && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Repaired from {result.repairedFrom}
                        </p>
                      )}
                      {result.issues.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {result.issues.map((issue, i) => (
                            <p key={i} className={`text-xs ${getSeverityColor(issue.severity)}`}>
                              • {issue.message}
                              {issue.field && <span className="text-muted-foreground"> ({issue.field})</span>}
                            </p>
                          ))}
                        </div>
                      )}
                      {(result.status === 'unrecoverable' || result.status === 'corrupted') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={async () => {
                            if (confirm(`Delete "${result.campaignName || result.campaignId}"? This cannot be undone.`)) {
                              setDeletingId(result.campaignId);
                              setDeleteStatus('local');
                              try {
                                // Show cloud status if authenticated
                                if (isAuthenticated) {
                                  setDeleteStatus('cloud');
                                }
                                // Use unified architecture for cloud sync delete
                                await UnifiedSaveArchitecture.deleteCampaign(result.campaignId);
                                toast.success(isAuthenticated ? 'Deleted from device and cloud' : 'Deleted broken campaign');
                                runScan();
                              } catch (e) {
                                toast.error('Failed to delete campaign');
                              } finally {
                                setDeletingId(null);
                                setDeleteStatus(null);
                              }
                            }
                          }}
                          disabled={deletingId === result.campaignId}
                        >
                          {deletingId === result.campaignId ? (
                            <div className="flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {deleteStatus === 'cloud' && (
                                <Cloud className="h-3 w-3 text-sky-300" />
                              )}
                              <span>{deleteStatus === 'cloud' ? 'Syncing...' : 'Deleting...'}</span>
                            </div>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete Campaign
                              {isAuthenticated && <Cloud className="h-3 w-3 ml-1 opacity-60" />}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {/* Repair from Backup */}
        {report && (report.corrupted > 0 || report.unrecoverable > 0) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <FileWarning className="w-4 h-4" />
                Repair from Backup
              </h4>
              <p className="text-sm text-muted-foreground">
                If you have a backup file (.untold), you can use it to restore corrupted campaigns.
              </p>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept=".untold,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="backup-file-input"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('backup-file-input')?.click()}
                  disabled={isRepairing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {selectedFile ? selectedFile.name : 'Select Backup File'}
                </Button>
                {selectedFile && (
                  <Button onClick={handleRepairFromBackup} disabled={isRepairing}>
                    {isRepairing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Repairing...
                      </>
                    ) : (
                      <>
                        <Wrench className="w-4 h-4 mr-2" />
                        Repair Now
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
        
        <Separator />
        
        <DialogFooter className="flex-row justify-between">
          {report && (
            <Button variant="outline" onClick={runScan} disabled={isScanning}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              Re-scan
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
