import { useState, useCallback } from 'react';
import { ChevronDown, Shirt, Scissors, Palette, Sparkles, Syringe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TieredAppearance,
  PIERCING_OPTIONS, TATTOO_OPTIONS, TATTOO_STYLE_OPTIONS,
  CLOTHING_STYLE_OPTIONS, CLOTHING_DETAIL_OPTIONS,
  SCAR_OPTIONS, PROSTHETIC_OPTIONS, IMPLANT_OPTIONS, MUTATION_OPTIONS,
} from '@/types/characterCreation';

// Piercing style options that affect NPC reactions
export const PIERCING_STYLE_OPTIONS = [
  { value: 'minimal', label: 'Minimal', description: 'Subtle, tasteful jewelry', reputation: 'professional' },
  { value: 'elegant', label: 'Elegant', description: 'High-end, refined pieces', reputation: 'sophisticated' },
  { value: 'edgy', label: 'Edgy/Alternative', description: 'Punk, industrial style', reputation: 'rebellious' },
  { value: 'tribal', label: 'Tribal/Cultural', description: 'Traditional, meaningful', reputation: 'spiritual' },
  { value: 'extreme', label: 'Extreme/Heavy', description: 'Many, large, statement pieces', reputation: 'intimidating' },
  { value: 'cybernetic', label: 'Cybernetic', description: 'Tech-integrated jewelry', reputation: 'futuristic' },
];

type AccordionSection = 'clothing' | 'piercings' | 'tattoos' | 'modifications' | null;

interface AppearanceAccordionsProps {
  appearance: TieredAppearance;
  onUpdateAppearance: (tier: 'simple' | 'detailed' | 'full', field: string, value: any) => void;
  genre: string;
}

export function AppearanceAccordions({ appearance, onUpdateAppearance, genre }: AppearanceAccordionsProps) {
  const [openSection, setOpenSection] = useState<AccordionSection>(null);

  const toggleSection = useCallback((section: AccordionSection) => {
    setOpenSection(prev => prev === section ? null : section);
  }, []);

  const toggleArrayItem = useCallback((field: string, item: string) => {
    const current = (appearance.full as any)?.[field] || [];
    if (current.includes(item)) {
      onUpdateAppearance('full', field, current.filter((i: string) => i !== item));
    } else {
      onUpdateAppearance('full', field, [...current, item]);
    }
  }, [appearance.full, onUpdateAppearance]);

  const renderAccordionHeader = (
    section: AccordionSection, 
    icon: React.ReactNode, 
    title: string, 
    count?: number
  ) => (
    <button
      onClick={() => toggleSection(section)}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-lg transition-all",
        "border bg-background/50 hover:bg-background/80",
        openSection === section 
          ? "border-primary/50 bg-primary/10" 
          : "border-border/30 hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-sm">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <ChevronDown className={cn(
        "w-4 h-4 transition-transform",
        openSection === section && "rotate-180"
      )} />
    </button>
  );

  const piercingCount = appearance.full?.piercings?.length || 0;
  const tattooCount = appearance.full?.tattoos?.length || 0;
  const modCount = (appearance.full?.scars?.length || 0) + 
                   (appearance.full?.prosthetics?.length || 0) + 
                   (appearance.full?.implants?.length || 0) + 
                   (appearance.full?.mutations?.length || 0);
  const clothingCount = appearance.full?.clothingDetails?.length || 0;

  return (
    <div className="space-y-2">
      {/* Clothing Style Accordion */}
      {renderAccordionHeader('clothing', <Shirt className="w-4 h-4 text-primary" />, 'Clothing Style', clothingCount)}
      {openSection === 'clothing' && (
        <div className="p-3 border border-border/30 rounded-lg bg-background/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Overall Style</label>
            <p className="text-xs text-muted-foreground/70 mb-2">
              ⚡ Non-genre clothing may trigger NPC reactions
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CLOTHING_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateAppearance('full', 'clothingStyle', opt.value)}
                  className={cn(
                    "px-2 py-1.5 rounded text-xs transition-all text-left",
                    appearance.full?.clothingStyle === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/50 border border-border/30 hover:border-primary/50"
                  )}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] opacity-70 truncate">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Specific Items (optional)</label>
            <div className="flex flex-wrap gap-1">
              {CLOTHING_DETAIL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayItem('clothingDetails', opt.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-all",
                    appearance.full?.clothingDetails?.includes(opt.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/50 border border-border/30 hover:border-primary/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Piercings Accordion */}
      {renderAccordionHeader('piercings', <Scissors className="w-4 h-4 text-accent" />, 'Piercings', piercingCount)}
      {openSection === 'piercings' && (
        <div className="p-3 border border-border/30 rounded-lg bg-background/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Piercing Style</label>
            <p className="text-xs text-muted-foreground/70 mb-2">
              ⚡ Style affects NPC reactions & reputation
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PIERCING_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateAppearance('full', 'piercingStyle', opt.value)}
                  className={cn(
                    "px-2 py-1.5 rounded text-xs transition-all text-left",
                    (appearance.full as any)?.piercingStyle === opt.value
                      ? "bg-accent text-accent-foreground"
                      : "bg-background/50 border border-border/30 hover:border-accent/50"
                  )}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] opacity-70">{opt.reputation}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Piercing Locations</label>
            {Object.entries(
              PIERCING_OPTIONS.reduce((acc, opt) => {
                if (!acc[opt.category]) acc[opt.category] = [];
                acc[opt.category].push(opt);
                return acc;
              }, {} as Record<string, typeof PIERCING_OPTIONS>)
            ).map(([category, options]) => (
              <div key={category} className="mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{category}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleArrayItem('piercings', opt.value)}
                      className={cn(
                        "px-2 py-1 rounded text-xs transition-all",
                        appearance.full?.piercings?.includes(opt.value)
                          ? "bg-accent text-accent-foreground"
                          : "bg-background/50 border border-border/30 hover:border-accent/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tattoos Accordion */}
      {renderAccordionHeader('tattoos', <Palette className="w-4 h-4 text-destructive" />, 'Tattoos', tattooCount)}
      {openSection === 'tattoos' && (
        <div className="p-3 border border-border/30 rounded-lg bg-background/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tattoo Style</label>
            <p className="text-xs text-muted-foreground/70 mb-2">
              ⚡ Style affects NPC reactions & reputation
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {TATTOO_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateAppearance('full', 'tattooStyle', opt.value)}
                  className={cn(
                    "px-2 py-1.5 rounded text-xs transition-all text-left",
                    appearance.full?.tattooStyle === opt.value
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-background/50 border border-border/30 hover:border-destructive/50"
                  )}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] opacity-70">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tattoo Placements</label>
            {Object.entries(
              TATTOO_OPTIONS.reduce((acc, opt) => {
                if (!acc[opt.category]) acc[opt.category] = [];
                acc[opt.category].push(opt);
                return acc;
              }, {} as Record<string, typeof TATTOO_OPTIONS>)
            ).map(([category, options]) => (
              <div key={category} className="mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{category}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleArrayItem('tattoos', opt.value)}
                      className={cn(
                        "px-2 py-1 rounded text-xs transition-all",
                        appearance.full?.tattoos?.includes(opt.value)
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-background/50 border border-border/30 hover:border-destructive/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body Modifications Accordion */}
      {renderAccordionHeader('modifications', <Syringe className="w-4 h-4 text-muted-foreground" />, 'Scars & Augments', modCount)}
      {openSection === 'modifications' && (
        <div className="p-3 border border-border/30 rounded-lg bg-background/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Scars */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Scars & Wounds</label>
            <div className="flex flex-wrap gap-1">
              {SCAR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayItem('scars', opt.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-all",
                    appearance.full?.scars?.includes(opt.value)
                      ? "bg-muted-foreground text-background"
                      : "bg-background/50 border border-border/30 hover:border-muted-foreground/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prosthetics */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prosthetics</label>
            <div className="flex flex-wrap gap-1">
              {PROSTHETIC_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayItem('prosthetics', opt.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-all",
                    appearance.full?.prosthetics?.includes(opt.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/50 border border-border/30 hover:border-primary/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Implants */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Implants & Cybernetics</label>
            <div className="flex flex-wrap gap-1">
              {IMPLANT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayItem('implants', opt.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-all",
                    appearance.full?.implants?.includes(opt.value)
                      ? "bg-accent text-accent-foreground"
                      : "bg-background/50 border border-border/30 hover:border-accent/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mutations */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mutations</label>
            <div className="flex flex-wrap gap-1">
              {MUTATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayItem('mutations', opt.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-all",
                    appearance.full?.mutations?.includes(opt.value)
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-background/50 border border-border/30 hover:border-destructive/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Enhancement Priority Field - After accordions */}
      <div className="border border-primary/30 rounded-lg p-3 bg-primary/5 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <label className="text-sm font-medium text-primary">Additional Details</label>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          ✨ Describe unique features, accessories, or specific looks you want emphasized in your portrait.
        </p>
        <textarea
          value={appearance.full?.intimateDetails || ''}
          onChange={(e) => onUpdateAppearance('full', 'intimateDetails', e.target.value)}
          placeholder="e.g., Rose gold jewelry, sleeve tattoo with cherry blossoms, chrome cybernetic arm, vintage aviator glasses..."
          className="w-full mt-1 p-2 rounded-lg bg-background border border-border/50 text-sm min-h-[60px] resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {(appearance.full?.intimateDetails || '').length}/500
        </p>
      </div>
    </div>
  );
}
