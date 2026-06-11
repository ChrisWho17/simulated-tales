import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  activatePendingUpdate,
  dismissPendingUpdate,
  isUpdateDismissed,
  PWA_UPDATE_EVENT,
  PWA_ACTIVATED_EVENT,
} from "@/pwa/registerSW";

/**
 * Listens for service-worker updates and surfaces a sonner toast with a
 * "Reload" action so the user can soft-download the latest patch on demand.
 *
 * - Persists "Later" dismissals across refreshes so the same pending update
 *   doesn't re-prompt mid-session. The dismissal is automatically cleared
 *   when a genuinely new build finishes installing (see registerSW).
 * - Broadcasts a `patchnotes:update-available` window event so the version
 *   badge / What's New modal can self-refresh.
 */
export const PATCHNOTES_UPDATE_EVENT = "patchnotes:update-available";

export function PwaUpdatePrompt() {
  const shownRef = useRef(false);

  useEffect(() => {
    const onUpdate = () => {
      // Always let the patch notes UI know — pulse the badge even if the
      // user previously dismissed the toast.
      window.dispatchEvent(new Event(PATCHNOTES_UPDATE_EVENT));

      if (shownRef.current) return;
      if (isUpdateDismissed()) return; // persisted "Later" choice
      shownRef.current = true;

      const id = toast("A new version is ready", {
        description:
          "Save your progress, then reload to load the latest patch notes.",
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => {
            void activatePendingUpdate().catch(() => {
              window.location.reload();
            });
          },
        },
        cancel: {
          label: "Later",
          onClick: () => {
            dismissPendingUpdate();
            shownRef.current = false;
            toast.dismiss(id);
          },
        },
      });
    };

    const onActivated = () => {
      // Soft refresh — controllerchange fired without a forced reload.
      // Bump the patch notes UI so it can re-render in place.
      window.dispatchEvent(new Event(PATCHNOTES_UPDATE_EVENT));
    };

    window.addEventListener(PWA_UPDATE_EVENT, onUpdate as EventListener);
    window.addEventListener(PWA_ACTIVATED_EVENT, onActivated as EventListener);
    return () => {
      window.removeEventListener(PWA_UPDATE_EVENT, onUpdate as EventListener);
      window.removeEventListener(PWA_ACTIVATED_EVENT, onActivated as EventListener);
    };
  }, []);

  return null;
}
