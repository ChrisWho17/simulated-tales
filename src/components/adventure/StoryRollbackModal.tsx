import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw, X } from 'lucide-react';

interface StoryRollbackModalProps {
  isOpen: boolean;
  previewText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StoryRollbackModal({ isOpen, previewText, onConfirm, onCancel }: StoryRollbackModalProps) {
  if (!isOpen) return null;

  // Truncate preview text
  const truncated = previewText.length > 150 
    ? previewText.slice(0, 150) + '...' 
    : previewText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="max-w-md w-full glass-panel border-primary/40 p-6 space-y-5 shadow-glow">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <RotateCcw className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">
            ...Back here?
          </h2>
          <p className="text-sm text-muted-foreground">
            Return to this moment in your adventure
          </p>
        </div>

        {/* Preview of the moment */}
        <div className="glass-panel-subtle p-4 rounded-lg border border-border/50 max-h-32 overflow-hidden">
          <p className="text-sm text-foreground/80 italic leading-relaxed">
            "{truncated}"
          </p>
        </div>

        {/* Warning */}
        <p className="text-xs text-center text-warning/80">
          Everything after this point will be forgotten
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </Card>
    </div>
  );
}
