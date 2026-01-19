// ============================================================================
// RECOVERY BOUNDARY - React Error Boundary with tiered recovery options
// Phase 6: User-friendly error handling with clear recovery paths
// ============================================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Download, Trash2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StateSyncBus } from '@/services/stateSyncBus';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  recoveryPath?: string; // Where to redirect on "Go Home"
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempts: number;
  isExporting: boolean;
}

export class RecoveryBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
      isExporting: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error
    console.error('[RecoveryBoundary] Caught error:', error);
    console.error('[RecoveryBoundary] Component stack:', errorInfo.componentStack);
    
    // Notify via StateSyncBus
    StateSyncBus.emit('error:load-failed', {
      campaignId: 'unknown',
      error: error.message,
      fallbackUsed: true,
    }, 'RecoveryBoundary');
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: prev.recoveryAttempts + 1,
    }));
  };

  handleExportData = async () => {
    this.setState({ isExporting: true });
    
    try {
      // Collect all localStorage data for debugging
      const exportData: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        error: {
          message: this.state.error?.message,
          stack: this.state.error?.stack,
          componentStack: this.state.errorInfo?.componentStack,
        },
        localStorage: {},
        recoveryAttempts: this.state.recoveryAttempts,
      };
      
      // Gather localStorage items (except sensitive data)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.includes('auth') && !key.includes('token')) {
          try {
            const value = localStorage.getItem(key);
            if (value && value.length < 100000) { // Skip very large items
              exportData.localStorage[key] = value.length > 1000 
                ? `[TRUNCATED: ${value.length} chars]` 
                : value;
            }
          } catch {
            exportData.localStorage[key] = '[UNREADABLE]';
          }
        }
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `untold-error-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[RecoveryBoundary] Failed to export:', e);
    } finally {
      this.setState({ isExporting: false });
    }
  };

  handleClearAndRestart = () => {
    if (confirm('This will clear problematic cache data. Your campaigns will NOT be deleted. Continue?')) {
      // Only clear cache keys, not campaign data
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('portrait-cache') ||
          key.includes('scene-illustration') ||
          key.includes('untold-emotional-state') ||
          key.includes('untold-pressure-state')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = this.props.recoveryPath || '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    Don't worry - your progress is likely safe
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  An unexpected error occurred. Here's what you can try:
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click "Try Again" - often fixes temporary issues</li>
                  <li>If the error persists, try "Clear Cache & Reload"</li>
                  <li>Export your error report for support</li>
                </ol>
              </div>
              
              {this.state.error && (
                <div className="p-3 rounded-md bg-muted text-xs font-mono overflow-x-auto">
                  <p className="text-destructive font-semibold">
                    {this.state.error.message}
                  </p>
                  {this.state.recoveryAttempts > 0 && (
                    <p className="text-muted-foreground mt-1">
                      Recovery attempts: {this.state.recoveryAttempts}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-wrap gap-2">
              <Button 
                onClick={this.handleRetry}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={this.handleExportData}
                disabled={this.state.isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {this.state.isExporting ? 'Exporting...' : 'Export Report'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={this.handleClearAndRestart}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
              
              <Button 
                variant="ghost"
                onClick={this.handleGoHome}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RecoveryBoundary;
