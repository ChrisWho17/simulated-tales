// Prominent install banner shown at the very top of the campaign chooser /
// main menu. Hides itself if the user disables PWA prompts in Game Settings,
// and plays a confirmation animation when the app is successfully installed.

import { useEffect, useRef, useState } from 'react';
import { Download, Share, Plus as PlusIcon, MoreVertical, CheckCircle2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useGameOptional } from '@/contexts/GameContext';
import { loadSettings } from '@/lib/gameSettings';
import { cn } from '@/lib/utils';

export function InstallAppPromoBanner() {
  const game = useGameOptional();
  const { canInstall, isHidden, isIOS, isStandalone, promptInstall } = usePwaInstall();
  const [helpMode, setHelpMode] = useState<null | 'ios' | 'generic'>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [dismissedInstalled, setDismissedInstalled] = useState(false);
  const prevHiddenRef = useRef(isHidden);

  // Settings: prefer the live context, fall back to a one-shot read.
  const hidePwaInstall = game?.settings?.hidePwaInstall ?? loadSettings().hidePwaInstall ?? false;

  // Fire a confirmation animation when the app transitions to "installed".
  useEffect(() => {
    if (!prevHiddenRef.current && isHidden) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 2800);
      return () => clearTimeout(t);
    }
    prevHiddenRef.current = isHidden;
  }, [isHidden]);

  if (hidePwaInstall) return null;

  // Installed state — show a celebratory confirmation pill, dismissible.
  if (isHidden) {
    if (dismissedInstalled && !celebrate) return null;
    const label = isStandalone ? 'Running as installed app' : 'App installed on this device';
    return (
      <div
        data-testid="install-app-banner-installed"
        className={cn(
          'relative mx-auto mb-4 flex w-full max-w-xl items-center justify-between gap-3 overflow-hidden rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 backdrop-blur',
          celebrate && 'animate-fade-in-up shadow-[0_0_40px_hsl(152_70%_50%/0.35)]',
        )}
      >
        {celebrate && (
          <>
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-emerald-300/10 to-emerald-400/20 animate-pulse" />
            <Sparkles className="pointer-events-none absolute -top-1 left-6 h-4 w-4 text-emerald-200 animate-bounce" style={{ animationDelay: '40ms' }} />
            <Sparkles className="pointer-events-none absolute top-1 right-10 h-3 w-3 text-emerald-100 animate-bounce" style={{ animationDelay: '220ms' }} />
            <Sparkles className="pointer-events-none absolute bottom-1 left-1/3 h-3 w-3 text-emerald-300 animate-bounce" style={{ animationDelay: '420ms' }} />
          </>
        )}
        <div className="relative flex items-center gap-3">
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300',
              celebrate && 'animate-[ping_1s_ease-out_1]',
            )}
          >
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-emerald-100">{label}</span>
            <span className="text-[11px] text-emerald-200/80">
              {celebrate ? 'Installed successfully — enjoy the adventure!' : 'Launch from your home screen any time.'}
            </span>
          </div>
        </div>
        <button
          aria-label="Dismiss"
          onClick={() => setDismissedInstalled(true)}
          className="relative rounded-md p-1 text-emerald-200/70 hover:bg-emerald-400/15 hover:text-emerald-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
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
      <div
        data-testid="install-app-banner"
        className="relative mx-auto mb-4 flex w-full max-w-xl items-center justify-between gap-3 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/15 via-primary/10 to-accent/15 px-4 py-3 backdrop-blur shadow-[0_0_28px_hsl(var(--primary)/0.25)]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Download className="h-5 w-5" />
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">Install Untold as an app</span>
            <span className="text-[11px] text-muted-foreground truncate">
              Faster launch, offline-ready, lives on your home screen.
            </span>
          </div>
        </div>
        <Button
          data-testid="install-app-banner-button"
          size="sm"
          onClick={handleClick}
          className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_18px_hsl(var(--primary)/0.45)]"
        >
          <Download className="h-4 w-4" />
          Install
        </Button>
      </div>

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
              <span>Tap <strong>Add</strong> in the top-right corner.</span>
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
