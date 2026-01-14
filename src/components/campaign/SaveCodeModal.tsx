// ============================================================================
// SAVE CODE MODAL - Ultimate fallback for users with storage issues
// ============================================================================

import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Download, Upload, Check, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import {
  generateSaveCode,
  decodeSaveCode,
  getSaveCodePreview,
  getCompressionStats,
} from '@/lib/legacySaveMigration';
import { CampaignData } from '@/types/campaign';

interface SaveCodeModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'export' | 'import';
  campaign?: CampaignData | null;
  onImport?: (campaign: CampaignData) => void;
}

export function SaveCodeModal({ open, onClose, mode, campaign, onImport }: SaveCodeModalProps) {
  const [saveCode, setSaveCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [preview, setPreview] = useState<{ valid: boolean; preview?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Generate save code when modal opens in export mode
  const generateCode = useCallback(() => {
    if (!campaign) return;
    const code = generateSaveCode(campaign);
    setSaveCode(code);
    
    const stats = getCompressionStats(campaign, code);
    console.log(`[SaveCode] Generated: ${stats.originalSize} -> ${stats.compressedSize} bytes (${(stats.ratio * 100).toFixed(1)}%)`);
  }, [campaign]);
  
  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(saveCode);
      setCopied(true);
      toast.success('Save code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      textareaRef.current?.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Download as file
  const handleDownload = () => {
    const blob = new Blob([saveCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savecode_${campaign?.meta?.name || 'campaign'}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Save code downloaded');
  };
  
  // Email to self
  const handleEmail = () => {
    const subject = encodeURIComponent(`Save Code - ${campaign?.meta?.name || 'Campaign'}`);
    const body = encodeURIComponent(`Your save code:\n\n${saveCode}\n\nPaste this code in the game to restore your progress.`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };
  
  // Validate import code
  const handleImportCodeChange = (value: string) => {
    setImportCode(value);
    if (value.length > 10) {
      const result = getSaveCodePreview(value.trim());
      setPreview(result);
    } else {
      setPreview(null);
    }
  };
  
  // Import the save code
  const handleImport = () => {
    const decoded = decodeSaveCode<CampaignData>(importCode.trim());
    if (decoded && onImport) {
      onImport(decoded);
      toast.success('Save code loaded successfully!');
      onClose();
    } else {
      toast.error('Failed to load save code');
    }
  };
  
  // Generate code when opening in export mode
  if (mode === 'export' && open && !saveCode && campaign) {
    generateCode();
  }
  
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {mode === 'export' ? 'Export Save Code' : 'Import Save Code'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'export' 
              ? 'Copy this code and save it somewhere safe. You can use it to restore your game even if local storage fails.'
              : 'Paste a save code to restore your game progress.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {mode === 'export' ? (
          <div className="space-y-4">
            {campaign && (
              <div className="text-sm text-muted-foreground">
                Campaign: <strong>{campaign.meta.name}</strong> - {campaign.player.name} (Lvl {campaign.player.level})
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              value={saveCode}
              readOnly
              className="font-mono text-xs h-32 select-all"
              placeholder="Generating save code..."
            />
            
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleCopy} variant="default" className="flex-1">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            
            <Button onClick={handleEmail} variant="ghost" className="w-full">
              Email to Myself
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              value={importCode}
              onChange={(e) => handleImportCodeChange(e.target.value)}
              className="font-mono text-xs h-32"
              placeholder="Paste your save code here..."
            />
            
            {preview && (
              <Alert variant={preview.valid ? 'default' : 'destructive'}>
                <AlertDescription className="flex items-center gap-2">
                  {preview.valid ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      {preview.preview}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      {preview.error}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={handleImport} 
              disabled={!preview?.valid}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Load Save Code
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
