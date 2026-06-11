import { useState } from 'react';
import { Download, Share, Plus as PlusIcon, MoreVertical, CheckCircle2 } from 'lucide-react';
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
  const { canInstall, isHidden, isIOS, isStandalone, installedFlag, promptInstall } =
    usePwaInstall();
  const [helpMode, setHelpMode] = useState<null | 'ios' | 'generic'>(null);

  // When the app is actually installed / running standalone, swap the install
  // CTA for a non-interactive status pill so the user gets explicit feedback.
  if (isHidden) {
    const label = isStandalone ? 'Running as app' : 'App installed';
    return (
      <span
        data-testid="install-app-installed"
        aria-label={label}
        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-400 backdrop-blur"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }

  const handleClick = async () => {
    if (canInstall) {
      const outcome = await promptInstall();
      if (outcome === 'unavailable') setHelpMode(isIOS ? 'ios' : 'generic');
      return;
    }
    setHelpMode(isIOS ? 'ios' : 'generic');
  };

  return (
    <>
      <Button
        data-testid="install-app-button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="gap-2 border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary backdrop-blur"
      >

        <Download className="h-4 w-4" />
        Install App
      </Button>

      <Dialog open={helpMode === 'ios'} onOpenChange={(o) => !o && setHelpMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Install on iPhone or iPad</DialogTitle>
            <DialogDescription>
              Add The Untold Stories to your home screen to launch it like a native app.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm text-foreground/90">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">1</span>
              <span className="flex items-center gap-2 flex-wrap">
                Tap the <Share className="h-4 w-4 inline" /> <strong>Share</strong> button in Safari's toolbar.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">2</span>
              <span className="flex items-center gap-2 flex-wrap">
                Scroll and choose <PlusIcon className="h-4 w-4 inline" /> <strong>Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">3</span>
              <span>Tap <strong>Add</strong> in the top-right corner. The app icon will appear on your home screen.</span>
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Note: install only works from Safari on iOS, not from in-app browsers.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={helpMode === 'generic'} onOpenChange={(o) => !o && setHelpMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Install The Untold Stories</DialogTitle>
            <DialogDescription>
              Your browser didn't expose a one-tap install prompt yet. You can still add the app
              from the browser menu.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm text-foreground/90">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">1</span>
              <span className="flex items-center gap-2 flex-wrap">
                Open your browser menu (<MoreVertical className="h-4 w-4 inline" /> on Chrome / Edge / Brave).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">2</span>
              <span>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">3</span>
              <span>Confirm — the app icon will appear like a native app.</span>
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Tip: this preview runs inside an iframe, which blocks the native install prompt. Open
            the published URL in a normal browser tab to get the one-tap install.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
