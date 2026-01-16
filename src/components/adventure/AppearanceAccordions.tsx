import { useState, useCallback } from 'react';
import { ChevronDown, Shirt, Scissors, Palette, Sparkles, Syringe, Crown, Heart, Flame, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TieredAppearance,
  PIERCING_OPTIONS, TATTOO_OPTIONS, TATTOO_STYLE_OPTIONS,
  CLOTHING_STYLE_OPTIONS, CLOTHING_DETAIL_OPTIONS,
  SCAR_OPTIONS, PROSTHETIC_OPTIONS, IMPLANT_OPTIONS, MUTATION_OPTIONS,
} from '@/types/characterCreation';

// Personality presets that auto-fill keywords for portrait generation
export const PERSONALITY_PRESETS = [
  {
    id: 'goddess',
    label: 'Goddess',
    icon: Crown,
    keywords: 'regal, divine, elegant, flowing robes, ethereal glow, majestic, graceful posture, radiant, celestial beauty',
    description: 'Divine elegance and ethereal beauty',
    color: 'from-amber-500 to-yellow-400',
  },
  {
    id: 'modest',
    label: 'Modest',
    icon: Heart,
    keywords: 'modest, conservative, covered, reserved, professional, dignified, proper posture, respectable, traditional',
    description: 'Reserved and dignified appearance',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    icon: Zap,
    keywords: 'natural, casual, relaxed, comfortable, everyday, practical, neutral posture, balanced',
    description: 'Natural everyday look',
    color: 'from-gray-400 to-slate-400',
  },
  {
    id: 'flirty',
    label: 'Flirty',
    icon: Sparkles,
    keywords: 'playful, charming, confident, stylish, form-fitting, flattering, coy smile, alluring eyes, fashionable',
    description: 'Playful and charming style',
    color: 'from-pink-400 to-rose-400',
  },
  {
    id: 'provocative',
    label: 'Provocative',
    icon: Flame,
    keywords: 'bold, daring, confident, striking, dramatic, attention-grabbing, fierce pose, intense gaze, powerful',
    description: 'Bold and daring presence',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'lusty',
    label: 'Lusty',
    icon: Flame,
    keywords: 'seductive, sensual, alluring, captivating, magnetic, enticing, sultry gaze, confident pose, passionate',
    description: 'Captivating and magnetic aura',
    color: 'from-purple-500 to-pink-500',
  },
] as const;
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
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const toggleSection = useCallback((section: AccordionSection) => {
    setOpenSection(prev => prev === section ? null : section);
  }, []);

  const applyPersonalityPreset = useCallback((preset: typeof PERSONALITY_PRESETS[number]) => {
    const currentDetails = appearance.full?.intimateDetails || '';
    
    // Check if this preset is already selected - if so, remove it
    if (selectedPreset === preset.id) {
      // Remove the preset keywords from the text
      const keywordsToRemove = preset.keywords.split(', ');
      let newDetails = currentDetails;
      keywordsToRemove.forEach(keyword => {
        newDetails = newDetails.replace(new RegExp(`\\b${keyword}\\b,?\\s*`, 'gi'), '');
      });
      newDetails = newDetails.replace(/,\s*,/g, ', ').replace(/^,\s*|,\s*$/g, '').trim();
      onUpdateAppearance('full', 'intimateDetails', newDetails);
      setSelectedPreset(null);
      return;
    }
    
    // Remove any existing preset keywords first
    let cleanedDetails = currentDetails;
    PERSONALITY_PRESETS.forEach(p => {
      const keywordsToRemove = p.keywords.split(', ');
      keywordsToRemove.forEach(keyword => {
        cleanedDetails = cleanedDetails.replace(new RegExp(`\\b${keyword}\\b,?\\s*`, 'gi'), '');
      });
    });
    cleanedDetails = cleanedDetails.replace(/,\s*,/g, ', ').replace(/^,\s*|,\s*$/g, '').trim();
    
    // Append new preset keywords
    const newDetails = cleanedDetails 
      ? `${cleanedDetails}, ${preset.keywords}` 
      : preset.keywords;
    
    onUpdateAppearance('full', 'intimateDetails', newDetails.slice(0, 500));
    setSelectedPreset(preset.id);
  }, [appearance.full?.intimateDetails, onUpdateAppearance, selectedPreset]);

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
        
        {/* Personality Preset Buttons */}
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-2">
            🎭 Choose a style preset to auto-fill keywords:
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PERSONALITY_PRESETS.map((preset) => {
              const IconComponent = preset.icon;
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPersonalityPreset(preset)}
                  title={preset.description}
                  className={cn(
                    "group relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-xs font-medium",
                    "border hover:scale-105",
                    isSelected
                      ? `bg-gradient-to-br ${preset.color} text-white border-transparent shadow-lg`
                      : "bg-background/50 border-border/30 hover:border-primary/50 text-foreground/80 hover:text-foreground"
                  )}
                >
                  <IconComponent className={cn(
                    "w-4 h-4 transition-transform",
                    isSelected && "animate-pulse"
                  )} />
                  <span>{preset.label}</span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          ✨ Describe unique features, accessories, or specific looks you want emphasized in your portrait.
        </p>
        <textarea
          value={appearance.full?.intimateDetails || ''}
          onChange={(e) => {
            onUpdateAppearance('full', 'intimateDetails', e.target.value);
            // Clear preset selection if user manually edits
            if (selectedPreset) {
              const preset = PERSONALITY_PRESETS.find(p => p.id === selectedPreset);
              if (preset && !e.target.value.includes(preset.keywords.split(', ')[0])) {
                setSelectedPreset(null);
              }
            }
          }}
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
