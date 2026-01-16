import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Shirt, Scissors, Palette, Sparkles, Syringe, Crown, Heart, Flame, Zap, Wand2, Sword, Skull, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TieredAppearance,
  PIERCING_OPTIONS, TATTOO_OPTIONS, TATTOO_STYLE_OPTIONS,
  CLOTHING_STYLE_OPTIONS, CLOTHING_DETAIL_OPTIONS,
  SCAR_OPTIONS, PROSTHETIC_OPTIONS, IMPLANT_OPTIONS, MUTATION_OPTIONS,
} from '@/types/characterCreation';

// Slash command definitions - categories of presets
export interface SlashCommand {
  command: string;
  label: string;
  category: 'personality' | 'genre' | 'clothing' | 'pose' | 'style';
  keywords: string;
  description: string;
  color: string;
  icon: typeof Crown;
}

// All slash commands organized by category
export const SLASH_COMMANDS: SlashCommand[] = [
  // ===== PERSONALITY PRESETS =====
  { command: 'goddess', label: 'Goddess', category: 'personality', keywords: 'regal, divine, elegant, flowing robes, ethereal glow, majestic, graceful posture, radiant, celestial beauty', description: 'Divine elegance', color: 'from-amber-500 to-yellow-400', icon: Crown },
  { command: 'modest', label: 'Modest', category: 'personality', keywords: 'modest, conservative, covered, reserved, professional, dignified, proper posture, respectable, traditional', description: 'Reserved dignity', color: 'from-blue-400 to-cyan-400', icon: Heart },
  { command: 'neutral', label: 'Neutral', category: 'personality', keywords: 'natural, casual, relaxed, comfortable, everyday, practical, neutral posture, balanced', description: 'Everyday look', color: 'from-gray-400 to-slate-400', icon: Zap },
  { command: 'flirty', label: 'Flirty', category: 'personality', keywords: 'playful, charming, confident, stylish, form-fitting, flattering, coy smile, alluring eyes, fashionable', description: 'Playful charm', color: 'from-pink-400 to-rose-400', icon: Sparkles },
  { command: 'provocative', label: 'Provocative', category: 'personality', keywords: 'bold, daring, confident, striking, dramatic, attention-grabbing, fierce pose, intense gaze, powerful', description: 'Bold presence', color: 'from-orange-500 to-red-500', icon: Flame },
  { command: 'alluring', label: 'Alluring', category: 'personality', keywords: 'captivating, magnetic, enticing, sultry gaze, confident pose, passionate, enchanting presence', description: 'Magnetic aura', color: 'from-purple-500 to-pink-500', icon: Flame },
  
  // ===== GENRE PRESETS =====
  { command: 'fantasy', label: 'Fantasy', category: 'genre', keywords: 'mystical, enchanted, medieval fantasy, arcane details, magical aura, flowing cape, elven inspired, ornate jewelry', description: 'High fantasy style', color: 'from-purple-600 to-indigo-500', icon: Wand2 },
  { command: 'cyberpunk', label: 'Cyberpunk', category: 'genre', keywords: 'neon accents, chrome implants, cybernetic enhancements, techwear, holographic details, urban dystopian, LED highlights', description: 'Neon future', color: 'from-cyan-500 to-purple-600', icon: Zap },
  { command: 'noir', label: 'Noir', category: 'genre', keywords: 'mysterious, shadowy, dramatic lighting, vintage glamour, smoky atmosphere, classic elegance, dark sophistication', description: 'Dark mystery', color: 'from-gray-700 to-gray-900', icon: Skull },
  { command: 'scifi', label: 'Sci-Fi', category: 'genre', keywords: 'futuristic uniform, sleek design, space-age materials, clean lines, holographic badges, practical elegance', description: 'Space age', color: 'from-blue-500 to-cyan-400', icon: Rocket },
  { command: 'western', label: 'Western', category: 'genre', keywords: 'rugged, frontier style, leather accents, dusty worn look, cowboy aesthetic, weathered details, sun-kissed', description: 'Frontier style', color: 'from-amber-600 to-orange-500', icon: Sword },
  { command: 'horror', label: 'Horror', category: 'genre', keywords: 'eerie, unsettling beauty, pale complexion, dark circles, haunting gaze, gothic elements, supernatural aura', description: 'Haunting beauty', color: 'from-red-900 to-gray-900', icon: Skull },
  { command: 'steampunk', label: 'Steampunk', category: 'genre', keywords: 'brass gears, copper accents, Victorian industrial, goggles, clockwork details, leather straps, steam-powered', description: 'Victorian tech', color: 'from-amber-700 to-stone-600', icon: Wand2 },
  
  // ===== CLOTHING STYLE PRESETS =====
  { command: 'elegant', label: 'Elegant', category: 'clothing', keywords: 'elegant gown, flowing fabric, luxurious silk, refined tailoring, graceful draping, sophisticated style', description: 'Refined elegance', color: 'from-rose-400 to-purple-400', icon: Shirt },
  { command: 'casual', label: 'Casual', category: 'clothing', keywords: 'casual wear, comfortable clothing, relaxed fit, everyday style, simple but stylish, natural look', description: 'Relaxed style', color: 'from-green-400 to-teal-400', icon: Shirt },
  { command: 'armor', label: 'Armored', category: 'clothing', keywords: 'protective armor, battle-ready, plate mail, leather armor straps, warrior gear, combat ready', description: 'Battle gear', color: 'from-slate-500 to-gray-600', icon: Sword },
  { command: 'formal', label: 'Formal', category: 'clothing', keywords: 'formal attire, business professional, sharp tailoring, pressed suit, polished appearance, executive style', description: 'Professional look', color: 'from-gray-600 to-slate-700', icon: Shirt },
  { command: 'revealing', label: 'Revealing', category: 'clothing', keywords: 'revealing outfit, form-fitting, low-cut, bare midriff, tight clothing, showing skin, daring neckline', description: 'Daring style', color: 'from-red-500 to-pink-500', icon: Sparkles },
  { command: 'tactical', label: 'Tactical', category: 'clothing', keywords: 'tactical gear, military style, utility vest, cargo pockets, combat boots, practical equipment', description: 'Combat ready', color: 'from-green-700 to-stone-600', icon: Sword },
  { command: 'royal', label: 'Royal', category: 'clothing', keywords: 'royal garments, crown, regal cape, velvet robes, gold trim, jeweled accessories, throne-worthy', description: 'Regal attire', color: 'from-amber-400 to-yellow-300', icon: Crown },
  
  // ===== POSE PRESETS =====
  { command: 'confident', label: 'Confident', category: 'pose', keywords: 'confident stance, hands on hips, head held high, powerful pose, assertive posture, commanding presence', description: 'Power pose', color: 'from-orange-400 to-amber-400', icon: Zap },
  { command: 'relaxed', label: 'Relaxed', category: 'pose', keywords: 'relaxed pose, leaning casually, easy smile, comfortable stance, laid-back posture, at ease', description: 'Easy stance', color: 'from-teal-400 to-cyan-400', icon: Heart },
  { command: 'action', label: 'Action', category: 'pose', keywords: 'dynamic pose, mid-action, battle stance, movement blur, intense focus, ready to strike', description: 'Dynamic action', color: 'from-red-500 to-orange-500', icon: Sword },
  { command: 'mysterious', label: 'Mysterious', category: 'pose', keywords: 'mysterious pose, partially hidden, shadowy, enigmatic expression, turned away slightly, secretive', description: 'Enigmatic', color: 'from-purple-600 to-gray-700', icon: Skull },
  
  // ===== BLENDED STYLE PRESETS =====
  { command: 'darkfantasy', label: 'Dark Fantasy', category: 'style', keywords: 'dark fantasy, corrupted elegance, shadowy magic, twisted beauty, ominous glow, cursed aesthetic', description: 'Corrupted magic', color: 'from-purple-900 to-gray-900', icon: Skull },
  { command: 'techfantasy', label: 'Tech Fantasy', category: 'style', keywords: 'magitech, arcane circuits, glowing runes on chrome, magical cybernetics, enchanted technology', description: 'Magic meets tech', color: 'from-cyan-500 to-purple-500', icon: Wand2 },
  { command: 'postapoc', label: 'Post-Apocalyptic', category: 'style', keywords: 'wasteland survivor, scavenged gear, weathered look, survival aesthetic, rugged and worn, makeshift repairs', description: 'Wasteland style', color: 'from-stone-600 to-amber-700', icon: Skull },
  { command: 'gothic', label: 'Gothic', category: 'style', keywords: 'gothic beauty, dark romantic, Victorian elegance, lace and velvet, pale complexion, dramatic dark makeup', description: 'Dark romance', color: 'from-purple-800 to-gray-900', icon: Heart },
];
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
  const [appliedCommands, setAppliedCommands] = useState<string[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleSection = useCallback((section: AccordionSection) => {
    setOpenSection(prev => prev === section ? null : section);
  }, []);

  // Filter commands based on current input
  const filteredCommands = SLASH_COMMANDS.filter(cmd => 
    cmd.command.toLowerCase().includes(slashFilter.toLowerCase()) ||
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
    cmd.category.toLowerCase().includes(slashFilter.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, SlashCommand[]>);

  const categoryLabels: Record<string, string> = {
    personality: '🎭 Personality',
    genre: '🌍 Genre',
    clothing: '👗 Clothing',
    pose: '🧍 Pose',
    style: '✨ Style Blend',
  };

  const applySlashCommand = useCallback((cmd: SlashCommand) => {
    const currentDetails = appearance.full?.intimateDetails || '';
    
    // Remove the slash command text from input
    const cleanedDetails = currentDetails.replace(/\/\w*$/, '').trim();
    
    // Check if already applied - toggle off
    if (appliedCommands.includes(cmd.command)) {
      const keywordsToRemove = cmd.keywords.split(', ');
      let newDetails = cleanedDetails;
      keywordsToRemove.forEach(keyword => {
        newDetails = newDetails.replace(new RegExp(`\\b${keyword}\\b,?\\s*`, 'gi'), '');
      });
      newDetails = newDetails.replace(/,\s*,/g, ', ').replace(/^,\s*|,\s*$/g, '').trim();
      onUpdateAppearance('full', 'intimateDetails', newDetails);
      setAppliedCommands(prev => prev.filter(c => c !== cmd.command));
    } else {
      // Apply the command
      const newDetails = cleanedDetails 
        ? `${cleanedDetails}, ${cmd.keywords}` 
        : cmd.keywords;
      onUpdateAppearance('full', 'intimateDetails', newDetails.slice(0, 500));
      setAppliedCommands(prev => [...prev, cmd.command]);
    }
    
    setShowSlashMenu(false);
    setSlashFilter('');
  }, [appearance.full?.intimateDetails, onUpdateAppearance, appliedCommands]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onUpdateAppearance('full', 'intimateDetails', value);
    
    // Check for slash command trigger
    const slashMatch = value.match(/\/(\w*)$/);
    if (slashMatch) {
      setSlashFilter(slashMatch[1]);
      setShowSlashMenu(true);
      
      // Calculate menu position
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom + 4, left: rect.left });
      }
    } else {
      setShowSlashMenu(false);
      setSlashFilter('');
    }
    
    // Update applied commands tracking
    const newApplied = SLASH_COMMANDS.filter(cmd => {
      const firstKeyword = cmd.keywords.split(', ')[0];
      return value.toLowerCase().includes(firstKeyword.toLowerCase());
    }).map(cmd => cmd.command);
    setAppliedCommands(newApplied);
  }, [onUpdateAppearance]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setShowSlashMenu(false);
    if (showSlashMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSlashMenu]);

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
      <div className="border border-primary/30 rounded-lg p-3 bg-primary/5 mt-4 relative">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <label className="text-sm font-medium text-primary">Additional Details</label>
        </div>
        
        {/* Applied Commands Tags */}
        {appliedCommands.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {appliedCommands.map(cmdName => {
              const cmd = SLASH_COMMANDS.find(c => c.command === cmdName);
              if (!cmd) return null;
              const IconComponent = cmd.icon;
              return (
                <button
                  key={cmd.command}
                  type="button"
                  onClick={() => applySlashCommand(cmd)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    "bg-gradient-to-r text-white transition-all hover:scale-105",
                    cmd.color
                  )}
                  title={`Click to remove /${cmd.command}`}
                >
                  <IconComponent className="w-3 h-3" />
                  /{cmd.command}
                  <span className="ml-1 opacity-70">×</span>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground mb-2">
          ✨ Type <code className="bg-muted px-1 rounded">/</code> to see style presets • <code className="bg-muted px-1 rounded">/fantasy</code> <code className="bg-muted px-1 rounded">/elegant</code> <code className="bg-muted px-1 rounded">/alluring</code>
        </p>
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={appearance.full?.intimateDetails || ''}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (showSlashMenu && e.key === 'Escape') {
                setShowSlashMenu(false);
                setSlashFilter('');
              }
            }}
            placeholder="Type / to see presets, or describe: rose gold jewelry, sleeve tattoo, chrome cybernetic arm..."
            className="w-full p-2 rounded-lg bg-background border border-border/50 text-sm min-h-[60px] resize-none"
            maxLength={500}
          />
          
          {/* Slash Command Autocomplete Menu */}
          {showSlashMenu && filteredCommands.length > 0 && (
            <div 
              className="absolute z-50 left-0 right-0 bottom-full mb-1 max-h-64 overflow-y-auto rounded-lg border border-primary/30 bg-background shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 border-b border-border/30 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Type to filter • {filteredCommands.length} commands available
                </p>
              </div>
              {Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category}>
                  <div className="px-2 py-1 bg-muted/20 text-xs font-semibold text-muted-foreground sticky top-0">
                    {categoryLabels[category] || category}
                  </div>
                  {commands.map(cmd => {
                    const IconComponent = cmd.icon;
                    const isApplied = appliedCommands.includes(cmd.command);
                    return (
                      <button
                        key={cmd.command}
                        type="button"
                        onClick={() => applySlashCommand(cmd)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-left transition-all",
                          "hover:bg-primary/10",
                          isApplied && "bg-primary/20"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br",
                          cmd.color
                        )}>
                          <IconComponent className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-primary">/{cmd.command}</span>
                            <span className="text-xs text-muted-foreground truncate">{cmd.description}</span>
                          </div>
                        </div>
                        {isApplied && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {(appearance.full?.intimateDetails || '').length}/500
        </p>
      </div>
    </div>
  );
}
