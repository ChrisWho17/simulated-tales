// ============================================================================
// MIGRATION PROMPT COMPONENT
// Shows when old data needs migration to new campaign system
// ============================================================================

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  getMigrationStatus, 
  migrateAllData, 
  cleanupOldData,
  MigrationResult 
} from '@/lib/campaignMigration';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Database, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Sparkles,
  HardDrive,
  FolderSync
} from 'lucide-react';

interface MigrationPromptProps {
  onComplete: (result: MigrationResult) => void;
  onSkip: () => void;
}

export function MigrationPrompt({ onComplete, onSkip }: MigrationPromptProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [status, setStatus] = useState(() => getMigrationStatus());
  
  const handleMigrate = useCallback(async () => {
    setIsMigrating(true);
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const migrationResult = migrateAllData();
    setResult(migrationResult);
    
    if (migrationResult.success && migrationResult.migratedCount > 0) {
      toast.success(`Migrated ${migrationResult.migratedCount} campaign${migrationResult.migratedCount > 1 ? 's' : ''}`);
    }
    
    setIsMigrating(false);
  }, []);
  
  const handleContinue = useCallback(() => {
    if (result) {
      // Optionally clean up old data after successful migration
      if (result.success && result.migratedCount > 0) {
        cleanupOldData();
      }
      onComplete(result);
    }
  }, [result, onComplete]);
  
  // Show result screen
  if (result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-card/50 backdrop-blur border-border/50 text-center space-y-6">
          {result.success && result.migratedCount > 0 ? (
            <>
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Migration Complete!</h2>
                <p className="text-muted-foreground mt-2">
                  Successfully migrated {result.migratedCount} campaign{result.migratedCount > 1 ? 's' : ''} to the new format.
                </p>
              </div>
              {result.errors.length > 0 && (
                <div className="text-left p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-400 font-medium">Some issues occurred:</p>
                  <ul className="text-xs text-yellow-300/80 mt-1 list-disc list-inside">
                    {result.errors.slice(0, 3).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Migration Issue</h2>
                <p className="text-muted-foreground mt-2">
                  {result.migratedCount === 0 
                    ? 'No campaigns could be migrated. Your old data is still available.'
                    : 'Migration completed with some issues.'}
                </p>
              </div>
            </>
          )}
          
          <Button onClick={handleContinue} className="w-full gap-2">
            Continue to Campaigns
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }
  
  // Show migration prompt
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-card/50 backdrop-blur border-border/50 space-y-6">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <FolderSync className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Upgrade Your Saves</h2>
          <p className="text-muted-foreground mt-2">
            We've upgraded to a new campaign system with better organization and features.
          </p>
        </div>
        
        {/* What will be migrated */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Found data to migrate:</h3>
          
          {status.oldDataSummary.currentSession && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Current Session</p>
                <p className="text-xs text-muted-foreground">Your active adventure</p>
              </div>
            </div>
          )}
          
          {status.oldDataSummary.savedGames > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
              <HardDrive className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{status.oldDataSummary.savedGames} Saved Game{status.oldDataSummary.savedGames > 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">Previous save files</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Benefits */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">New features:</p>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            <li>Up to 20 separate campaigns</li>
            <li>Auto-save every 60 seconds</li>
            <li>Manual checkpoints for branching</li>
            <li>Import/export campaigns as files</li>
            <li>Complete isolation between worlds</li>
          </ul>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={handleMigrate} 
            disabled={isMigrating}
            className="w-full gap-2"
          >
            {isMigrating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Migrate My Data
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onSkip}
            disabled={isMigrating}
            className="w-full text-muted-foreground"
          >
            Start Fresh Instead
          </Button>
        </div>
      </Card>
    </div>
  );
}
