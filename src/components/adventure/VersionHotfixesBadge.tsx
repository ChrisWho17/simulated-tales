import { Star, Mail } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { VERSION_STRING, BUILD_NUMBER } from '@/lib/version';
import { CHANGELOG } from './WhatsNewModal';

/**
 * Top-right floating badge:
 *  - Version number (small)
 *  - Star  -> highlights of the latest patch
 *  - Mail  -> hotfixes / bug fixes of the latest patch
 */
export function VersionHotfixesBadge() {
  const latest = CHANGELOG[0];
  const highlights = latest?.highlights ?? [];
  const fixes = latest?.fixes ?? [];

  return (
    <div className="fixed top-2 right-2 z-40 flex flex-col items-end gap-1 pointer-events-none">
      <span
        className="text-[10px] font-mono text-muted-foreground/70 bg-black/40 px-2 py-0.5 rounded border border-border/30 backdrop-blur-sm pointer-events-auto"
        title={`Build: ${BUILD_NUMBER}`}
      >
        {VERSION_STRING}
      </span>

      <div className="flex items-center gap-1 pointer-events-auto">
        {/* Highlights */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Patch highlights"
              className="w-7 h-7 flex items-center justify-center rounded-md bg-black/40 border border-border/30 hover:border-amber-400/60 hover:bg-amber-400/10 transition-colors backdrop-blur-sm"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">
                Highlights · v{latest?.version}
              </span>
            </div>
            {highlights.length ? (
              <ul className="space-y-1.5">
                {highlights.map((h, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground/90 pl-3 border-l-2 border-amber-400/50"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No highlights for this patch.</p>
            )}
          </PopoverContent>
        </Popover>

        {/* Hotfixes */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Patch hotfixes"
              className="w-7 h-7 flex items-center justify-center rounded-md bg-black/40 border border-border/30 hover:border-orange-400/60 hover:bg-orange-400/10 transition-colors backdrop-blur-sm relative"
            >
              <Mail className="w-3.5 h-3.5 text-orange-400" />
              {fixes.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-orange-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {fixes.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-400">
                Hotfixes · v{latest?.version}
              </span>
            </div>
            {fixes.length ? (
              <ul className="space-y-1.5">
                {fixes.map((f, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground pl-3 border-l-2 border-orange-400/40"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No hotfixes in this patch.</p>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default VersionHotfixesBadge;
