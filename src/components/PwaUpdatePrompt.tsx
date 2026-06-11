import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activatePendingUpdate, PWA_UPDATE_EVENT } from "@/pwa/registerSW";

export function PwaUpdatePrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onUpdate = () => setShow(true);
    window.addEventListener(PWA_UPDATE_EVENT, onUpdate as EventListener);
    return () => window.removeEventListener(PWA_UPDATE_EVENT, onUpdate as EventListener);
  }, []);

  if (!show) return null;

  const handleRefresh = async () => {
    setBusy(true);
    try {
      await activatePendingUpdate();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 w-[min(92vw,420px)]"
    >
      <div className="rounded-xl border border-primary/40 bg-background/80 backdrop-blur-xl shadow-2xl shadow-primary/20 p-4 flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">A new version is ready</p>
          <p className="text-xs text-muted-foreground">Refresh to load the latest update.</p>
        </div>
        <Button
          size="sm"
          onClick={handleRefresh}
          disabled={busy}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Updating" : "Refresh"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShow(false)}
          className="shrink-0 text-muted-foreground"
        >
          Later
        </Button>
      </div>
    </div>
  );
}
