import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { activatePendingUpdate, PWA_UPDATE_EVENT } from "@/pwa/registerSW";

/**
 * Listens for service-worker updates and surfaces a sonner toast with a
 * "Reload" action so the user can soft-download the latest patch on demand.
 *
 * Also broadcasts a `patchnotes:update-available` window event so the version
 * badge / What's New modal can self-refresh (pulse + remount) instead of
 * silently serving the cached patch notes.
 */
export const PATCHNOTES_UPDATE_EVENT = "patchnotes:update-available";

export function PwaUpdatePrompt() {
  const shownRef = useRef(false);

  useEffect(() => {
    const onUpdate = () => {
      // Tell the patch notes UI to refresh itself (pulse + remount)
      window.dispatchEvent(new Event(PATCHNOTES_UPDATE_EVENT));

      if (shownRef.current) return;
      shownRef.current = true;

      const id = toast("A new version is ready", {
        description:
          "Save your progress, then reload to load the latest patch notes.",
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => {
            // Fire-and-forget; the SW controllerchange handler reloads the page.
            void activatePendingUpdate().catch(() => {
              window.location.reload();
            });
          },
        },
        cancel: {
          label: "Later",
          onClick: () => {
            shownRef.current = false;
            toast.dismiss(id);
          },
        },
        onDismiss: () => {
          shownRef.current = false;
        },
        onAutoClose: () => {
          shownRef.current = false;
        },
      });
    };

    window.addEventListener(PWA_UPDATE_EVENT, onUpdate as EventListener);
    return () =>
      window.removeEventListener(PWA_UPDATE_EVENT, onUpdate as EventListener);
  }, []);

  return null;
}
