// ============================================================================
// LEGACY MIGRATION PROMPT - Shows when old saves are detected
// ============================================================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle, AlertTriangle, Database, ArrowRight } from 'lucide-react';
import {
  hasLegacyData,
  getLegacyDataPreview,
  migrateLegacyData,
  MigrationResult,
  LegacySavePreview,
} from '@/lib/legacySaveMigration';

interface LegacyMigrationPromptProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function LegacyMigrationPrompt({ onComplete, onSkip }: LegacyMigrationPromptProps) {
  const [show, setShow] = useState(false);
  const [preview, setPreview] = useState<LegacySavePreview | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Check for legacy data on mount
  useEffect(() => {
    if (hasLegacyData()) {
      const dataPreview = getLegacyDataPreview();
      setPreview(dataPreview);
      setShow(dataPreview.hasData);
    }
  }, []);
  
  const handleMigrate = async () => {
    setMigrating(true);
    setProgress(10);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 15, 90));
    }, 200);
    
    const migrationResult = await migrateLegacyData();
    
    clearInterval(progressInterval);
    setProgress(100);
    setResult(migrationResult);
    setMigrating(false);
  };
  
  const handleContinue = () => {
    setShow(false);
    onComplete();
  };
  
  const handleSkip = () => {
    setShow(false);
    onSkip();
  };
  
  if (!show) return null;
  
  return (
    <Dialog open={show} onOpenChange={(o) => !o && handleSkip()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Save Data Detected
          </DialogTitle>
          <DialogDescription>
            We found save data from a previous version of the game.
          </DialogDescription>
        </DialogHeader>
        
        {!result ? (
          <>
            {preview && (
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {preview.currentSession && (
                    <div className="p-2 bg-muted rounded">
                      <div className="font-medium">Current Session</div>
                      <div className="text-muted-foreground text-xs">Active game found</div>
                    </div>
                  )}
                  {preview.savedGamesCount > 0 && (
                    <div className="p-2 bg-muted rounded">
                      <div className="font-medium">{preview.savedGamesCount} Saved Games</div>
                      <div className="text-muted-foreground text-xs">Manual saves</div>
                    </div>
                  )}
                  {preview.campaignsCount > 0 && (
                    <div className="p-2 bg-muted rounded">
                      <div className="font-medium">{preview.campaignsCount} Campaigns</div>
                      <div className="text-muted-foreground text-xs">Campaign data</div>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Total size: {(preview.totalBytes / 1024).toFixed(1)} KB
                </div>
              </div>
            )}
            
            {migrating && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="text-sm text-center text-muted-foreground">
                  Migrating saves...
                </div>
              </div>
            )}
            
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="ghost" onClick={handleSkip} disabled={migrating}>
                Skip
              </Button>
              <Button onClick={handleMigrate} disabled={migrating}>
                {migrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Migrate Saves
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertDescription className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Successfully migrated {result.migratedCount} saves!
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Migrated {result.migratedCount} saves, {result.failedCount} failed.
                  </>
                )}
              </AlertDescription>
            </Alert>
            
            {result.warnings.length > 0 && (
              <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                {result.warnings.map((w, i) => (
                  <div key={i}>• {w}</div>
                ))}
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={handleContinue}>
                Continue to Game
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
