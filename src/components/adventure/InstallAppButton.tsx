import { useState } from 'react';
import { Download, Share, Plus as PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePwaInstall } from '@/hooks/usePwaInstall';

export function InstallAppButton() {
  const { canInstall, isStandalone, isIOS, promptInstall } = usePwaInstall();
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (isStandalone) return null;
  // Hide entirely if neither Chromium prompt is available nor iOS instructions apply.
  if (!canInstall && !isIOS) return null;

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS) {
      setShowIOSHelp(true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="gap-2 border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary backdrop-blur"
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>

      <Dialog open={showIOSHelp} onOpenChange={setShowIOSHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Install on iPhone or iPad</DialogTitle>
            <DialogDescription>
              Add The Untold Stories to your home screen to launch it like a native app.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm text-foreground/90">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                1
              </span>
              <span className="flex items-center gap-2 flex-wrap">
                Tap the <Share className="h-4 w-4 inline" /> <strong>Share</strong> button in Safari's toolbar.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                2
              </span>
              <span className="flex items-center gap-2 flex-wrap">
                Scroll and choose <PlusIcon className="h-4 w-4 inline" /> <strong>Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                3
              </span>
              <span>Tap <strong>Add</strong> in the top-right corner. The app icon will appear on your home screen.</span>
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Note: install only works from Safari on iOS, not from in-app browsers.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
