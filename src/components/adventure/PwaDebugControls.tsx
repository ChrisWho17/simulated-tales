import { useEffect, useState } from 'react';
import { Smartphone, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  clearInstalledFlag,
  getForceShowInstall,
  setForceShowInstall,
  usePwaInstall,
} from '@/hooks/usePwaInstall';
import { toast } from 'sonner';

export function PwaDebugControls() {
  const { isStandalone, installedFlag, canInstall, isIOS } = usePwaInstall();
  const [force, setForce] = useState<boolean>(getForceShowInstall());

  useEffect(() => {
    const sync = () => setForce(getForceShowInstall());
    window.addEventListener('pwa:installed-flag-changed', sync);
    return () => window.removeEventListener('pwa:installed-flag-changed', sync);
  }, []);

  const handleReset = () => {
    clearInstalledFlag();
    toast.success('Install state reset', {
      description: 'The Install App button will reappear if your browser still supports installing.',
    });
  };

  return (
    <div className="w-full rounded-md border border-border/60 bg-card/40 backdrop-blur p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <Smartphone className="w-3.5 h-3.5" />
        Install (PWA) Debug
      </div>

      <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
        <li>Running standalone: <span className="text-foreground">{isStandalone ? 'yes' : 'no'}</span></li>
        <li>Recorded as installed: <span className="text-foreground">{installedFlag ? 'yes' : 'no'}</span></li>
        <li>Browser prompt ready: <span className="text-foreground">{canInstall ? 'yes' : 'no'}</span></li>
        <li>Platform: <span className="text-foreground">{isIOS ? 'iOS' : 'other'}</span></li>
      </ul>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Force-show Install button</p>
          <p className="text-xs text-muted-foreground">
            Ignore install state and always show the button in the Main Menu.
          </p>
        </div>
        <Switch
          checked={force}
          onCheckedChange={(v) => {
            setForce(v);
            setForceShowInstall(v);
          }}
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 border-primary/30 hover:bg-primary/10"
      >
        <RotateCcw className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm">Reset Install State</span>
      </Button>
    </div>
  );
}
