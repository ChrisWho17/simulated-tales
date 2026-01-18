import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  CharacterStats,
  getStatModifier,
} from '@/types/rpgCharacter';
import { GameGenre, GENRE_DATA, createGenreCharacter } from '@/types/genreData';
import { 
  DetailLevel, Gender, TieredAppearance, 
  GENDER_OPTIONS, HEIGHT_OPTIONS, BUILD_OPTIONS,
  SKIN_TONES, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, FACE_SHAPES,
  DISTINGUISHING_FEATURES, ACCESSORIES,
  BUST_OPTIONS, HIP_OPTIONS, MUSCLE_OPTIONS, BODY_HAIR_OPTIONS,
  PIERCING_OPTIONS, TATTOO_OPTIONS, TATTOO_STYLE_OPTIONS,
  SCAR_OPTIONS, PROSTHETIC_OPTIONS, IMPLANT_OPTIONS, MUTATION_OPTIONS,
  CLOTHING_STYLE_OPTIONS, CLOTHING_DETAIL_OPTIONS,
  formatAppearanceForAI
} from '@/types/characterCreation';
import { storyAIIntegration } from '@/game/storyAIIntegration';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronRight, ChevronLeft, ChevronDown, Sword, Shield, Wand2, Heart, Sparkles, 
  Dices, Rocket, Skull, Search, Compass, User, Loader2, Wand, AlertCircle,
  Eye, Crosshair, Zap, Blend, Plus, Shirt, Scissors, Syringe, Palette
} from 'lucide-react';
import { toast } from 'sonner';
import { savePlayerPortraitReference, savePlayerPortraitUrl } from '@/game/playerPortraitReference';
import { SecondaryGenre } from './AdventureCreator';
import { getBlendedClasses, getBlendedBackgrounds, getBlendedTraits, getHybridTraits, HybridTrait } from '@/game/genreBlendSystem';
import { getGenreTitle, GENRE_ICONS } from '@/lib/genreDetection';
import { CustomClassBuilder, CustomClassData } from './CustomClassBuilder';
import { StartingGearEditor } from './StartingGearEditor';
import { StartingGearItem } from '@/game/storyInventoryBridge';
import { AppearanceAccordions } from './AppearanceAccordions';

interface CharacterCreationProps {
  genre: GameGenre;
  scenario: string;
  genreTitle: string;
  onComplete: (character: ReturnType<typeof createGenreCharacter>, scenario: string) => void;
  onBack: () => void;
  isLoading: boolean;
  secondaryGenres?: SecondaryGenre[];
  defaultClass?: string;
}

type CreationStep = 'name' | 'appearance' | 'class' | 'background' | 'stats' | 'traits' | 'phobias' | 'portrait';

// Available phobias for character creation
const AVAILABLE_PHOBIAS = [
  { id: 'fear_heights', name: 'Fear of Heights', description: 'Intense fear when in high places' },
  { id: 'fear_darkness', name: 'Fear of Darkness', description: 'Uncomfortable in dark environments' },
  { id: 'fear_water', name: 'Fear of Water', description: 'Afraid of deep water or swimming' },
  { id: 'fear_crowds', name: 'Fear of Crowds', description: 'Anxious in crowded spaces' },
  { id: 'fear_enclosed', name: 'Fear of Enclosed Spaces', description: 'Claustrophobic in tight areas' },
  { id: 'fear_spiders', name: 'Fear of Spiders', description: 'Terrified of arachnids' },
  { id: 'fear_blood', name: 'Fear of Blood', description: 'Uneasy at the sight of blood' },
  { id: 'fear_fire', name: 'Fear of Fire', description: 'Afraid of flames and burning' },
  { id: 'fear_storms', name: 'Fear of Storms', description: 'Anxious during thunderstorms' },
  { id: 'fear_dead', name: 'Fear of the Dead', description: 'Uncomfortable around corpses' },
  { id: 'fear_isolation', name: 'Fear of Isolation', description: 'Afraid of being alone' },
  { id: 'fear_failure', name: 'Fear of Failure', description: 'Paralyzed by fear of failing' },
];

const STAT_POINT_POOL = 15;

export function CharacterCreation({ genre, scenario, genreTitle, onComplete, onBack, isLoading, secondaryGenres = [], defaultClass }: CharacterCreationProps) {
  const genreData = GENRE_DATA[genre];
  
  // Use blended data when secondary genres are present
  const blendedClasses = useMemo(() => {
    if (secondaryGenres.length === 0) return genreData.classes;
    return getBlendedClasses(genre, secondaryGenres);
  }, [genre, secondaryGenres, genreData.classes]);
  
  const blendedBackgrounds = useMemo(() => {
    if (secondaryGenres.length === 0) return genreData.backgrounds;
    return getBlendedBackgrounds(genre, secondaryGenres);
  }, [genre, secondaryGenres, genreData.backgrounds]);
  
  const blendedTraits = useMemo(() => {
    if (secondaryGenres.length === 0) return genreData.traits;
    return getBlendedTraits(genre, secondaryGenres);
  }, [genre, secondaryGenres, genreData.traits]);
  
  // Get hybrid traits with narrative hooks
  const hybridTraits = useMemo(() => {
    if (secondaryGenres.length === 0) return [];
    return getHybridTraits(genre, secondaryGenres);
  }, [genre, secondaryGenres]);
  
  // Track selected hybrid traits separately
  const [selectedHybridTraits, setSelectedHybridTraits] = useState<string[]>([]);
  
  // Count hybrid classes added
  const hybridClassCount = blendedClasses.length - genreData.classes.length;
  
  const [step, setStep] = useState<CreationStep>('name');
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>(defaultClass || '');
  const [selectedBackground, setSelectedBackground] = useState<string>('');
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedPhobias, setSelectedPhobias] = useState<string[]>([]);
  const [statAllocation, setStatAllocation] = useState<Partial<CharacterStats>>({
    strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0,
  });
  
  // Appearance state
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('simple');
  const [appearance, setAppearance] = useState<TieredAppearance>({
    detailLevel: 'simple',
    simple: { gender: 'male', height: 'average', build: 'average' },
    detailed: { skinTone: 'Medium', hairStyle: 'Medium', hairColor: 'Brown', eyeColor: 'Brown', faceShape: 'oval', distinguishingFeatures: [], accessories: [] },
    full: { bustSize: 'medium', hipWidth: 'average', muscleDefinition: 'toned', bodyHair: 'light', isHermaphrodite: false, intimateDetails: '', piercings: [], piercingStyle: '', tattoos: [], tattooStyle: '', scars: [], prosthetics: [], implants: [], mutations: [], clothingStyle: 'genre_default', clothingDetails: [] },
  });
  
  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    bodyMods: false,
    physicalMods: false,
    clothing: false,
  });
  
  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // Portrait state
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [detectedKeywords, setDetectedKeywords] = useState<{
    personalityScore: number;
    keywords: { category: string; keyword: string; effect: string }[];
    colorMods: string[];
    patternMods: string[];
    physiqueMods: string[];
    clothFitMods: string[];
    clothingItems?: { item: string; slot: string; genre?: string[]; tags: string[] }[];
    genre?: string;
  } | null>(null);
  
  // Detected clothing from portrait
  const [detectedClothing, setDetectedClothing] = useState<{
    items: Record<string, any>;
    description: string;
    source: 'portrait_detected' | 'genre_fallback';
  } | null>(null);
  
  // Custom class state
  const [showCustomClassBuilder, setShowCustomClassBuilder] = useState(false);
  const [customClass, setCustomClass] = useState<CustomClassData | null>(null);
  
  // Starting gear customization
  const [customGear, setCustomGear] = useState<StartingGearItem[] | null>(null);
  
  const handleGearChange = useCallback((gear: StartingGearItem[]) => {
    setCustomGear(gear);
  }, []);
  
  const handleCustomClassComplete = useCallback((data: CustomClassData) => {
    setCustomClass(data);
    setSelectedClass(data.id);
    setShowCustomClassBuilder(false);
  }, []);

  const pointsSpent = Object.values(statAllocation).reduce((sum, val) => sum + (val || 0), 0);
  const pointsRemaining = STAT_POINT_POOL - pointsSpent;

  const adjustStat = (stat: keyof CharacterStats, delta: number) => {
    const current = statAllocation[stat] || 0;
    const newValue = current + delta;
    if (newValue < 0 || newValue > 7) return;
    if (delta > 0 && pointsRemaining <= 0) return;
    setStatAllocation(prev => ({ ...prev, [stat]: newValue }));
  };

  const toggleTrait = (trait: string) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(prev => prev.filter(t => t !== trait));
    } else if (selectedTraits.length < 3) {
      setSelectedTraits(prev => [...prev, trait]);
    }
  };

  const togglePhobia = (phobiaId: string) => {
    if (selectedPhobias.includes(phobiaId)) {
      setSelectedPhobias(prev => prev.filter(p => p !== phobiaId));
    } else if (selectedPhobias.length < 5) {
      setSelectedPhobias(prev => [...prev, phobiaId]);
    }
  };

  const toggleFeature = (feature: string) => {
    const current = appearance.detailed?.distinguishingFeatures || [];
    if (current.includes(feature)) {
      updateAppearance('detailed', 'distinguishingFeatures', current.filter(f => f !== feature));
    } else if (current.length < 5) {
      updateAppearance('detailed', 'distinguishingFeatures', [...current, feature]);
    }
  };

  const toggleAccessory = (accessory: string) => {
    const current = appearance.detailed?.accessories || [];
    if (current.includes(accessory)) {
      updateAppearance('detailed', 'accessories', current.filter(a => a !== accessory));
    } else if (current.length < 4) {
      updateAppearance('detailed', 'accessories', [...current, accessory]);
    }
  };

  const togglePiercing = (piercing: string) => {
    const current = appearance.full?.piercings || [];
    if (current.includes(piercing)) {
      updateAppearance('full', 'piercings', current.filter(p => p !== piercing));
    } else {
      updateAppearance('full', 'piercings', [...current, piercing]);
    }
  };

  const toggleTattoo = (tattoo: string) => {
    const current = appearance.full?.tattoos || [];
    if (current.includes(tattoo)) {
      updateAppearance('full', 'tattoos', current.filter(t => t !== tattoo));
    } else {
      updateAppearance('full', 'tattoos', [...current, tattoo]);
    }
  };

  const toggleScar = (scar: string) => {
    const current = appearance.full?.scars || [];
    if (current.includes(scar)) {
      updateAppearance('full', 'scars', current.filter(s => s !== scar));
    } else {
      updateAppearance('full', 'scars', [...current, scar]);
    }
  };

  const toggleProsthetic = (prosthetic: string) => {
    const current = appearance.full?.prosthetics || [];
    if (current.includes(prosthetic)) {
      updateAppearance('full', 'prosthetics', current.filter(p => p !== prosthetic));
    } else {
      updateAppearance('full', 'prosthetics', [...current, prosthetic]);
    }
  };

  const toggleImplant = (implant: string) => {
    const current = appearance.full?.implants || [];
    if (current.includes(implant)) {
      updateAppearance('full', 'implants', current.filter(i => i !== implant));
    } else {
      updateAppearance('full', 'implants', [...current, implant]);
    }
  };

  const toggleMutation = (mutation: string) => {
    const current = appearance.full?.mutations || [];
    if (current.includes(mutation)) {
      updateAppearance('full', 'mutations', current.filter(m => m !== mutation));
    } else {
      updateAppearance('full', 'mutations', [...current, mutation]);
    }
  };

  const toggleClothingDetail = (detail: string) => {
    const current = appearance.full?.clothingDetails || [];
    if (current.includes(detail)) {
      updateAppearance('full', 'clothingDetails', current.filter(d => d !== detail));
    } else {
      updateAppearance('full', 'clothingDetails', [...current, detail]);
    }
  };

  const updateAppearance = (level: 'simple' | 'detailed' | 'full', key: string, value: any) => {
    setAppearance(prev => ({
      ...prev,
      detailLevel,
      [level]: { ...prev[level], [key]: value }
    }));
  };

  const handleGeneratePortrait = async () => {
    setIsGeneratingPortrait(true);
    try {
      const { generatePortraitWithCharacterData } = await import('@/services/fluxImageGeneration');
      
      // Get class name for prompt
      const selectedClassData = customClass && selectedClass === customClass.id
        ? { name: customClass.name }
        : blendedClasses.find(c => c.id === selectedClass);
      const className = selectedClassData?.name || selectedClass;
      
      // Build character appearance data including all customizations - pass directly to edge function
      const characterData = {
        name: name,
        gender: appearance.simple?.gender || 'male',
        build: appearance.simple?.build || 'average',
        height: appearance.simple?.height || 'average',
        hairColor: appearance.detailed?.hairColor || 'brown',
        hairStyle: appearance.detailed?.hairStyle || 'short',
        eyeColor: appearance.detailed?.eyeColor || 'brown',
        skinTone: appearance.detailed?.skinTone || 'medium',
        faceShape: appearance.detailed?.faceShape,
        // Distinguishing features and accessories
        distinguishingFeatures: appearance.detailed?.distinguishingFeatures || [],
        accessories: appearance.detailed?.accessories || [],
        details: [
          ...(appearance.detailed?.distinguishingFeatures || []),
          ...(appearance.detailed?.accessories || []),
        ],
        // Body shape details (bust, hips, muscle)
        bustSize: appearance.full?.bustSize,
        hipWidth: appearance.full?.hipWidth,
        muscleDefinition: appearance.full?.muscleDefinition,
        bodyHair: appearance.full?.bodyHair,
        // CRITICAL: Body modifications - passed directly to edge function
        piercings: appearance.full?.piercings || [],
        piercingStyle: appearance.full?.piercingStyle || '',
        tattoos: appearance.full?.tattoos || [],
        tattooStyle: appearance.full?.tattooStyle,
        scars: appearance.full?.scars || [],
        prosthetics: appearance.full?.prosthetics || [],
        implants: appearance.full?.implants || [],
        mutations: appearance.full?.mutations || [],
        clothingStyle: appearance.full?.clothingStyle || 'genre_default',
        clothingDetails: appearance.full?.clothingDetails || [],
        // CRITICAL: Free-form description from "Additional Details" textarea
        additionalDetails: appearance.full?.intimateDetails || '',
        // Class info for role-appropriate styling
        characterClass: className,
        portraitHints: (selectedClassData as any)?.portraitHints || [],
      };
      
      console.log('[FLUX] Generating portrait with body modifications:', {
        piercings: characterData.piercings.length,
        tattoos: characterData.tattoos.length,
        scars: characterData.scars.length,
        implants: characterData.implants.length,
        prosthetics: characterData.prosthetics.length,
        mutations: characterData.mutations.length,
      });
      
      const result = await generatePortraitWithCharacterData(characterData, genre);
      setPortraitUrl(result.imageUrl);
      setDetectedKeywords(result.detectedKeywords || null);
      
      // Map detected clothing items from portrait to inventory
      if (result.detectedKeywords?.clothingItems && result.detectedKeywords.clothingItems.length > 0) {
        const { mapPortraitClothingToInventory } = await import('@/game/portraitClothingMapper');
        const mappedClothing = mapPortraitClothingToInventory(
          result.detectedKeywords.clothingItems as any,
          genre
        );
        setDetectedClothing(mappedClothing);
        console.log('[CharacterCreation] Mapped clothing from portrait:', mappedClothing);
      }
      
      toast.success('Portrait generated!');
    } catch (error) {
      console.error('Error generating portrait:', error);
      toast.error('Failed to generate portrait', { 
        description: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  const handleComplete = () => {
    // Resolve class and background from blended lists or custom class
    let classData = customClass && selectedClass === customClass.id
      ? { id: customClass.id, name: customClass.name, description: customClass.description, statBonuses: customClass.statBonuses, startingItems: [] as string[], abilities: customClass.abilities, portraitHints: [] as string[], clothingStyle: undefined }
      : blendedClasses.find(c => c.id === selectedClass);
    
    const backgroundData = blendedBackgrounds.find(b => b.id === selectedBackground);
    
    const character = createGenreCharacter(name, selectedClass, selectedBackground, selectedTraits, statAllocation, genre, portraitUrl || undefined, classData, backgroundData);
    // Add phobias to character data
    (character as any).phobias = selectedPhobias;
    // Add custom class data if using a custom class
    if (customClass && selectedClass === customClass.id) {
      (character as any).customClass = customClass;
      // Note: stat bonuses are already applied in createGenreCharacter via classData
      // Note: abilities are already set in createGenreCharacter via classData
    }
    // Add custom gear if modified
    if (customGear) {
      (character as any).customStartingGear = customGear;
    }
    // Add selected hybrid traits
    if (selectedHybridTraits.length > 0) {
      (character as any).hybridTraits = selectedHybridTraits;
    }
    // Add appearance data for consistent scene illustrations
    (character as any).gender = appearance.simple?.gender || 'male';
    (character as any).build = appearance.simple?.build || 'average';
    (character as any).height = appearance.simple?.height || 'average';
    (character as any).hairColor = appearance.detailed?.hairColor || 'brown';
    (character as any).hairStyle = appearance.detailed?.hairStyle || 'short';
    (character as any).eyeColor = appearance.detailed?.eyeColor || 'brown';
    (character as any).skinTone = appearance.detailed?.skinTone || 'medium';
    (character as any).role = classData?.name?.toLowerCase() || selectedClass;
    (character as any).details = [
      ...(appearance.detailed?.distinguishingFeatures || []),
      ...(appearance.detailed?.accessories || []),
    ];
    
    // Add full appearance data for adult content (18+) - stored separately for AI context
    (character as any).fullAppearance = appearance.full;
    (character as any).tieredAppearance = appearance;
    
    // Generate full appearance description for AI using the formatAppearanceForAI helper
    (character as any).appearanceDescription = formatAppearanceForAI(appearance, genre);
    
    // Set up clothing context for NPC reactions
    if (appearance.full) {
      storyAIIntegration.setPlayerClothing({
        clothingStyle: appearance.full.clothingStyle,
        clothingDetails: appearance.full.clothingDetails,
        piercings: appearance.full.piercings,
        tattoos: appearance.full.tattoos,
        prosthetics: appearance.full.prosthetics,
        implants: appearance.full.implants,
        mutations: appearance.full.mutations,
      }, genre);
    }
    
    // Save the locked portrait reference for gameplay regeneration
    savePlayerPortraitReference(
      {
        name,
        gender: appearance.simple?.gender || 'male',
        build: appearance.simple?.build || 'average',
        height: appearance.simple?.height || 'average',
        skinTone: appearance.detailed?.skinTone || 'medium',
        hairColor: appearance.detailed?.hairColor || 'brown',
        hairStyle: appearance.detailed?.hairStyle || 'short',
        eyeColor: appearance.detailed?.eyeColor || 'brown',
        role: classData?.name?.toLowerCase() || selectedClass,
        details: [
          ...(appearance.detailed?.distinguishingFeatures || []),
          ...(appearance.detailed?.accessories || []),
        ],
        tieredAppearance: appearance,
        appearanceDescription: formatAppearanceForAI(appearance, genre),
      },
      genre,
      classData?.name,
      classData?.portraitHints
    );
    
    // Save the portrait URL if generated
    if (portraitUrl) {
      savePlayerPortraitUrl(portraitUrl);
    }
    
    // Add detected clothing from portrait for inventory initialization
    if (detectedClothing) {
      (character as any).detectedClothing = detectedClothing;
      console.log('[CharacterCreation] Adding detected clothing to character:', detectedClothing);
    }
    
    console.log('[CharacterCreation] Saved portrait reference for consistent regeneration');
    
    onComplete(character, scenario);
  };

  const canProceed = () => {
    switch (step) {
      case 'name': return name.trim().length >= 2;
      case 'appearance': return true;
      case 'class': return selectedClass !== '';
      case 'background': return selectedBackground !== '';
      case 'stats': return true;
      case 'traits': return selectedTraits.length >= 1;
      case 'phobias': return true; // Phobias are optional
      case 'portrait': return true;
    }
  };

  const steps: CreationStep[] = ['name', 'appearance', 'class', 'background', 'stats', 'traits', 'phobias', 'portrait'];
  
  const nextStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) setStep(steps[currentIndex + 1]);
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    } else {
      onBack();
    }
  };

  const getClassIcon = (classId: string) => {
    if (genre === 'scifi') return <Rocket className="w-5 h-5" />;
    if (genre === 'cyberpunk') return <Zap className="w-5 h-5" />;
    if (genre === 'horror' || genre === 'postapoc') return <Skull className="w-5 h-5" />;
    if (genre === 'mystery') return <Search className="w-5 h-5" />;
    if (genre === 'pirate') return <Compass className="w-5 h-5" />;
    if (genre === 'western') return <Crosshair className="w-5 h-5" />;
    
    switch (classId) {
      case 'warrior': case 'marine': case 'enforcer': case 'solo': return <Sword className="w-5 h-5" />;
      case 'mage': case 'hacker': case 'occultist': case 'netrunner': return <Wand2 className="w-5 h-5" />;
      case 'cleric': case 'medic': case 'frontier_doctor': return <Heart className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const renderDetailLevelSelector = () => (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Detail Level</h3>
      <div className="flex gap-2">
        {[
          { level: 'simple' as DetailLevel, label: 'Simple', desc: 'Gender, Height, Build' },
          { level: 'detailed' as DetailLevel, label: 'Detailed', desc: 'Hair, Eyes, Skin, Features' },
          { level: 'all' as DetailLevel, label: 'All (18+)', desc: 'Full body customization' },
        ].map(({ level, label, desc }) => (
          <button
            key={level}
            onClick={() => {
              setDetailLevel(level);
              setAppearance(prev => ({ ...prev, detailLevel: level }));
            }}
            className={`flex-1 p-3 rounded-lg text-left transition-all border ${
              detailLevel === level
                ? 'bg-primary/20 border-primary'
                : 'bg-background/50 border-border/30 hover:border-primary/50'
            }`}
          >
            <div className="font-medium text-sm">{label}</div>
            <div className="text-xs text-muted-foreground">{desc}</div>
          </button>
        ))}
      </div>
      {detailLevel === 'all' && (
        <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
          <p className="text-xs text-destructive">Adult content mode enabled. This includes mature body customization options.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          {/* Genre Blend Indicator */}
          <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <span>{GENRE_ICONS[genre]}</span>
              {genreData.name}
            </span>
            {secondaryGenres.length > 0 && (
              <>
                <span className="text-muted-foreground text-xs">+</span>
                {secondaryGenres.map((sg) => (
                  <span key={sg.genreId} className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span>{GENRE_ICONS[sg.genreId]}</span>
                    {getGenreTitle(sg.genreId)}
                    <span className="text-[10px] opacity-70">({sg.blendStrength}%)</span>
                  </span>
                ))}
              </>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-narrative font-bold text-gradient-gold mt-3 mb-2">
            Create Your Hero
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {scenario.slice(0, 80)}...
          </p>
          <p className="text-muted-foreground mt-2">
            Step {steps.indexOf(step) + 1} of {steps.length}
          </p>
        </div>

        {/* Step Content */}
        <div className="bg-card/50 border border-border/30 rounded-lg p-6 mb-6 animate-fade-in">
          {/* Name Step */}
          {step === 'name' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">What is your name?</h2>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your character's name..."
                className="text-lg py-6 bg-background border-border/50"
                autoFocus
              />
            </div>
          )}

          {/* Appearance Step */}
          {step === 'appearance' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Define Your Appearance</h2>
              
              {renderDetailLevelSelector()}
              
              <ScrollArea className="h-[350px] pr-4">
                {/* Simple Level - Always shown */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Gender</h3>
                    <div className="flex flex-wrap gap-2">
                      {GENDER_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateAppearance('simple', 'gender', opt.value as Gender)}
                          className={`px-4 py-2 rounded-lg text-sm transition-all border ${
                            appearance.simple.gender === opt.value
                              ? 'bg-primary/20 border-primary'
                              : 'bg-background/50 border-border/30 hover:border-primary/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {appearance.simple.gender === 'other' && detailLevel === 'all' && (
                      <label className="flex items-center gap-2 mt-2 text-sm">
                        <input
                          type="checkbox"
                          checked={appearance.full?.isHermaphrodite || false}
                          onChange={(e) => updateAppearance('full', 'isHermaphrodite', e.target.checked)}
                          className="rounded"
                        />
                        <span>Both anatomies</span>
                      </label>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Height</h3>
                    <div className="flex flex-wrap gap-2">
                      {HEIGHT_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateAppearance('simple', 'height', opt.value)}
                          className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                            appearance.simple.height === opt.value
                              ? 'bg-primary/20 border-primary'
                              : 'bg-background/50 border-border/30 hover:border-primary/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Build</h3>
                    <div className="flex flex-wrap gap-2">
                      {BUILD_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateAppearance('simple', 'build', opt.value)}
                          className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                            appearance.simple.build === opt.value
                              ? 'bg-primary/20 border-primary'
                              : 'bg-background/50 border-border/30 hover:border-primary/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detailed Level */}
                {(detailLevel === 'detailed' || detailLevel === 'all') && (
                  <div className="space-y-4 mt-6 pt-4 border-t border-border/30">
                    <h3 className="text-primary font-medium">Detailed Features</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Skin Tone</label>
                        <select
                          value={appearance.detailed?.skinTone || 'Medium'}
                          onChange={(e) => updateAppearance('detailed', 'skinTone', e.target.value)}
                          className="w-full mt-1 p-2 rounded-lg bg-background border border-border/50"
                        >
                          {SKIN_TONES.map(tone => <option key={tone} value={tone}>{tone}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Face Shape</label>
                        <select
                          value={appearance.detailed?.faceShape || 'oval'}
                          onChange={(e) => updateAppearance('detailed', 'faceShape', e.target.value)}
                          className="w-full mt-1 p-2 rounded-lg bg-background border border-border/50"
                        >
                          {FACE_SHAPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Hair Style</label>
                        <select
                          value={appearance.detailed?.hairStyle || 'Medium'}
                          onChange={(e) => updateAppearance('detailed', 'hairStyle', e.target.value)}
                          className="w-full mt-1 p-2 rounded-lg bg-background border border-border/50"
                        >
                          {HAIR_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Hair Color</label>
                        <select
                          value={appearance.detailed?.hairColor || 'Brown'}
                          onChange={(e) => updateAppearance('detailed', 'hairColor', e.target.value)}
                          className="w-full mt-1 p-2 rounded-lg bg-background border border-border/50"
                        >
                          {HAIR_COLORS.map(color => <option key={color} value={color}>{color}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Eye Color</label>
                        <select
                          value={appearance.detailed?.eyeColor || 'Brown'}
                          onChange={(e) => updateAppearance('detailed', 'eyeColor', e.target.value)}
                          className="w-full mt-1 p-2 rounded-lg bg-background border border-border/50"
                        >
                          {EYE_COLORS.map(color => <option key={color} value={color}>{color}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground">Distinguishing Features (up to 5)</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {DISTINGUISHING_FEATURES.map(feature => (
                          <button
                            key={feature}
                            onClick={() => toggleFeature(feature)}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              appearance.detailed?.distinguishingFeatures?.includes(feature)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background/50 border border-border/30 hover:border-primary/50'
                            }`}
                          >
                            {feature}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground">Accessories (up to 4)</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ACCESSORIES.map(acc => (
                          <button
                            key={acc}
                            onClick={() => toggleAccessory(acc)}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              appearance.detailed?.accessories?.includes(acc)
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background/50 border border-border/30 hover:border-primary/50'
                            }`}
                          >
                            {acc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* All Level (18+) */}
                {detailLevel === 'all' && (
                  <div className="space-y-4 mt-6 pt-4 border-t border-destructive/30">
                    <h3 className="text-destructive font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Adult Content
                    </h3>
                    
                    {/* Body Shape Options */}
                    {(appearance.simple.gender === 'female' || appearance.simple.gender === 'other') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Bust Size</label>
                          <select
                            value={appearance.full?.bustSize || 'medium'}
                            onChange={(e) => updateAppearance('full', 'bustSize', e.target.value)}
                            className="w-full mt-1 p-2 rounded-lg bg-background border border-border/50"
                          >
                            {BUST_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Hip Width</label>
                          <select
                            value={appearance.full?.hipWidth || 'average'}
                            onChange={(e) => updateAppearance('full', 'hipWidth', e.target.value)}
                            className="w-full mt-1 p-2 rounded-lg bg-background border border-border/50"
                          >
                            {HIP_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {(appearance.simple.gender === 'male' || appearance.simple.gender === 'other') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground">Muscle Definition</label>
                          <select
                            value={appearance.full?.muscleDefinition || 'toned'}
                            onChange={(e) => updateAppearance('full', 'muscleDefinition', e.target.value)}
                            className="w-full mt-1 p-2 rounded-lg bg-background border border-border/50"
                          >
                            {MUSCLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Body Hair</label>
                          <select
                            value={appearance.full?.bodyHair || 'light'}
                            onChange={(e) => updateAppearance('full', 'bodyHair', e.target.value)}
                            className="w-full mt-1 p-2 rounded-lg bg-background border border-border/50"
                          >
                            {BODY_HAIR_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Appearance Accordions - Clothing, Piercings, Tattoos, Mods */}
                    <AppearanceAccordions 
                      appearance={appearance}
                      onUpdateAppearance={updateAppearance}
                      genre={genre}
                    />
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Class Step */}
          {step === 'class' && (
            <div className="space-y-4">
              {showCustomClassBuilder ? (
                <CustomClassBuilder
                  genre={genre}
                  secondaryGenres={secondaryGenres}
                  onComplete={handleCustomClassComplete}
                  onCancel={() => setShowCustomClassBuilder(false)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-primary">Choose your role</h2>
                    <div className="flex items-center gap-2">
                      {hybridClassCount > 0 && (
                        <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                          <Blend className="w-3 h-3" />
                          +{hybridClassCount} hybrid roles
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="grid gap-3">
                      {/* Custom Class Option */}
                      {customClass && (
                        <button
                          onClick={() => setSelectedClass(customClass.id)}
                          className={`w-full p-4 rounded-lg text-left transition-all ${
                            selectedClass === customClass.id 
                              ? 'bg-primary/20 border-2 border-primary' 
                              : 'bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-primary mt-0.5"><Sparkles className="w-5 h-5" /></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">{customClass.name}</h3>
                                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Custom
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{customClass.description}</p>
                              <div className="flex gap-4 mt-2 text-xs text-primary/80">
                                <span>
                                  +{Object.entries(customClass.statBonuses)
                                    .filter(([_, v]) => v > 0)
                                    .map(([k, v]) => `${v} ${k.slice(0, 3).toUpperCase()}`)
                                    .join(', +') || 'No bonuses'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {customClass.abilities.map(ability => (
                                  <span key={ability} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    {ability}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      )}
                      
                      {blendedClasses.map((charClass) => {
                        const isHybrid = !genreData.classes.some(c => c.id === charClass.id);
                        return (
                          <button
                            key={charClass.id}
                            onClick={() => setSelectedClass(charClass.id)}
                            className={`w-full p-4 rounded-lg text-left transition-all ${
                              selectedClass === charClass.id 
                                ? 'bg-primary/20 border-2 border-primary' 
                                : isHybrid 
                                  ? 'bg-accent/10 border border-accent/30 hover:border-accent/50'
                                  : 'bg-background/50 border border-border/30 hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-primary mt-0.5">{getClassIcon(charClass.id)}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground">{charClass.name}</h3>
                                  {isHybrid && (
                                    <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded uppercase tracking-wider">
                                      Hybrid
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{charClass.description}</p>
                                <div className="flex gap-4 mt-2 text-xs text-primary/80">
                                  <span>+{Object.entries(charClass.statBonuses).map(([k, v]) => `${v} ${k.slice(0, 3).toUpperCase()}`).join(', +')}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {charClass.abilities.map(ability => (
                                    <span key={ability} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      {ability}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  {/* Create Custom Class Button */}
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomClassBuilder(true)}
                    className="w-full gap-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/10"
                  >
                    <Plus className="w-4 h-4" />
                    Create Custom Class
                  </Button>
                  
                  {/* Starting Gear Editor */}
                  {selectedClass && (
                    <StartingGearEditor
                      genre={genre}
                      characterClass={customClass && selectedClass === customClass.id ? 'default' : selectedClass}
                      onGearChange={handleGearChange}
                      initialGear={customGear || undefined}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Background Step */}
          {step === 'background' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary">What is your origin?</h2>
                {blendedBackgrounds.length > genreData.backgrounds.length && (
                  <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                    <Blend className="w-3 h-3" />
                    +{blendedBackgrounds.length - genreData.backgrounds.length} hybrid origins
                  </span>
                )}
              </div>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-3">
                  {blendedBackgrounds.map((bg) => {
                    const isHybrid = !genreData.backgrounds.some(b => b.id === bg.id);
                    return (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBackground(bg.id)}
                        className={`w-full p-4 rounded-lg text-left transition-all ${
                          selectedBackground === bg.id 
                            ? 'bg-primary/20 border-2 border-primary' 
                            : isHybrid 
                              ? 'bg-accent/10 border border-accent/30 hover:border-accent/50'
                              : 'bg-background/50 border border-border/30 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{bg.name}</h3>
                          {isHybrid && (
                            <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Hybrid
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{bg.description}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {bg.skills.map(skill => (
                            <span key={skill} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Stats Step */}
          {step === 'stats' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-primary">Allocate your stats</h2>
                <span className={`text-sm font-mono ${pointsRemaining > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {pointsRemaining} points remaining
                </span>
              </div>
              <div className="grid gap-3">
                {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((stat) => {
                  const base = 8;
                  const allocated = statAllocation[stat] || 0;
                  // Check custom class first, then blended classes
                  const classBonus = (customClass && selectedClass === customClass.id)
                    ? (customClass.statBonuses[stat] || 0)
                    : (blendedClasses.find(c => c.id === selectedClass)?.statBonuses[stat] || 0);
                  const bgBonus = blendedBackgrounds.find(b => b.id === selectedBackground)?.statBonuses[stat] || 0;
                  const total = base + allocated + classBonus + bgBonus;
                  const modifier = getStatModifier(total);

                  return (
                    <div key={stat} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
                      <div>
                        <span className="font-medium capitalize">{stat}</span>
                        {(classBonus > 0 || bgBonus > 0) && (
                          <span className="text-xs text-primary ml-2">(+{classBonus + bgBonus})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => adjustStat(stat, -1)} disabled={allocated <= 0} className="h-8 w-8">-</Button>
                        <div className="w-16 text-center">
                          <span className="text-lg font-bold">{total}</span>
                          <span className="text-sm text-muted-foreground ml-1">({modifier >= 0 ? '+' : ''}{modifier})</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => adjustStat(stat, 1)} disabled={allocated >= 7 || pointsRemaining <= 0} className="h-8 w-8">+</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Traits Step */}
          {step === 'traits' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Select up to 3 personality traits</h2>
              
              {/* Hybrid Traits Section - Special narrative hooks */}
              {hybridTraits.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Blend className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-accent">Hybrid Traits (Narrative Hooks)</span>
                  </div>
                  <div className="grid gap-2 mb-4">
                    {hybridTraits.map((trait) => (
                      <button
                        key={trait.id}
                        onClick={() => {
                          if (selectedHybridTraits.includes(trait.id)) {
                            setSelectedHybridTraits(prev => prev.filter(t => t !== trait.id));
                          } else if (selectedHybridTraits.length < 2) {
                            setSelectedHybridTraits(prev => [...prev, trait.id]);
                          }
                        }}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedHybridTraits.includes(trait.id)
                            ? 'bg-accent/20 border-2 border-accent'
                            : 'bg-accent/5 border border-accent/30 hover:border-accent/50'
                        }`}
                        disabled={!selectedHybridTraits.includes(trait.id) && selectedHybridTraits.length >= 2}
                      >
                        <div className="flex items-start gap-2">
                          <Sparkles className={`w-4 h-4 mt-0.5 ${selectedHybridTraits.includes(trait.id) ? 'text-accent' : 'text-accent/60'}`} />
                          <div>
                            <div className="font-medium text-sm">{trait.name}</div>
                            <p className="text-xs text-muted-foreground">{trait.description}</p>
                            <p className="text-xs text-accent/80 mt-1 italic">✦ {trait.narrativeHook}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Hybrid traits: {selectedHybridTraits.length}/2 (these unlock special story moments)</p>
                  <div className="border-t border-border/30 pt-3" />
                </div>
              )}
              
              {/* Standard Traits */}
              <div className="flex flex-wrap gap-2">
                {blendedTraits.map((trait) => {
                  const isFromSecondary = !genreData.traits.includes(trait);
                  return (
                    <button
                      key={trait}
                      onClick={() => toggleTrait(trait)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedTraits.includes(trait)
                          ? 'bg-primary text-primary-foreground'
                          : isFromSecondary
                            ? 'bg-accent/10 border border-accent/30 hover:border-accent/50'
                            : 'bg-background/50 border border-border/30 hover:border-primary/50'
                      }`}
                      disabled={!selectedTraits.includes(trait) && selectedTraits.length >= 3}
                    >
                      {trait}
                      {isFromSecondary && !selectedTraits.includes(trait) && (
                        <span className="ml-1 text-[10px] text-accent">•</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">Standard traits: {selectedTraits.length}/3</p>
            </div>
          )}

          {/* Phobias Step */}
          {step === 'phobias' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Character Fears (Optional)</h2>
              <p className="text-sm text-muted-foreground">
                Select up to 5 phobias that shape how your character reacts. These affect roleplay and dialogue, 
                not stats. You can skip this step if you prefer.
              </p>
              <p className="text-xs text-primary/70 italic">
                Note: Additional phobias can develop during gameplay from traumatic events.
              </p>
              <ScrollArea className="h-[300px] pr-4">
                <div className="grid gap-2">
                  {AVAILABLE_PHOBIAS.map((phobia) => (
                    <button
                      key={phobia.id}
                      onClick={() => togglePhobia(phobia.id)}
                      className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                        selectedPhobias.includes(phobia.id)
                          ? 'bg-modifier-neutral/20 border-2 border-modifier-neutral'
                          : 'bg-background/50 border border-border/30 hover:border-modifier-neutral/50'
                      }`}
                      disabled={!selectedPhobias.includes(phobia.id) && selectedPhobias.length >= 5}
                    >
                      <Eye className={`w-5 h-5 shrink-0 ${
                        selectedPhobias.includes(phobia.id) ? 'text-modifier-neutral' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-sm ${
                          selectedPhobias.includes(phobia.id) ? 'text-modifier-neutral' : 'text-foreground'
                        }`}>
                          {phobia.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{phobia.description}</p>
                      </div>
                      {selectedPhobias.includes(phobia.id) && (
                        <div className="w-5 h-5 rounded-full bg-modifier-neutral flex items-center justify-center shrink-0">
                          <span className="text-xs text-background font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedPhobias.length}/5
                </p>
                {selectedPhobias.length > 0 && (
                  <button 
                    onClick={() => setSelectedPhobias([])}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Portrait Step */}
          {step === 'portrait' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">Generate Your Portrait</h2>
              
              <div className="flex flex-col md:flex-row gap-6 items-center">
                {/* Portrait Preview */}
                <div className="w-48 h-64 rounded-lg border-2 border-dashed border-border/50 bg-muted/20 flex items-center justify-center overflow-hidden shrink-0">
                  {portraitUrl ? (
                    <img src={portraitUrl} alt="Character portrait" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-muted-foreground/30" />
                  )}
                </div>
                
                <div className="flex-1 space-y-4">
                  {/* Character Summary */}
                  <div className="p-4 bg-background/50 rounded-lg border border-border/30">
                    <h3 className="font-semibold text-primary mb-2">Character Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Name:</span> {name}</div>
                      <div><span className="text-muted-foreground">Role:</span> {
                        customClass && selectedClass === customClass.id
                          ? customClass.name
                          : blendedClasses.find(c => c.id === selectedClass)?.name || selectedClass
                      }</div>
                      <div><span className="text-muted-foreground">Background:</span> {
                        blendedBackgrounds.find(b => b.id === selectedBackground)?.name || selectedBackground
                      }</div>
                      <div><span className="text-muted-foreground">Starting {genreData.currency}:</span> {genreData.startingCurrency}</div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGeneratePortrait}
                    disabled={isGeneratingPortrait}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    {isGeneratingPortrait ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand className="w-4 h-4" />
                        {portraitUrl ? 'Regenerate Portrait' : 'Generate AI Portrait'}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Portrait is optional. You can skip this step.
                  </p>
                  
                  {/* Detected Keywords Feedback */}
                  {detectedKeywords && detectedKeywords.keywords.length > 0 && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                      <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Detected Style Keywords
                      </h4>
                      
                      {/* Personality Score */}
                      {detectedKeywords.personalityScore !== 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Personality:</span>
                          <span className={`font-medium ${
                            detectedKeywords.personalityScore < 0 
                              ? 'text-blue-500' 
                              : detectedKeywords.personalityScore > 0 
                                ? 'text-rose-500' 
                                : 'text-muted-foreground'
                          }`}>
                            {detectedKeywords.personalityScore <= -2 ? 'Very Modest' :
                             detectedKeywords.personalityScore === -1 ? 'Modest' :
                             detectedKeywords.personalityScore === 1 ? 'Alluring' :
                             detectedKeywords.personalityScore === 2 ? 'Seductive' :
                             detectedKeywords.personalityScore >= 3 ? 'Very Provocative' : 'Neutral'}
                          </span>
                          <span className="text-muted-foreground/60">
                            (score: {detectedKeywords.personalityScore})
                          </span>
                        </div>
                      )}
                      
                      {/* Keywords by Category */}
                      <div className="flex flex-wrap gap-1">
                        {detectedKeywords.keywords.map((kw, idx) => (
                          <span 
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              kw.category === 'personality' 
                                ? kw.effect === 'modest' 
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-rose-500/20 text-rose-400'
                                : kw.category === 'color'
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : kw.category === 'pattern'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : kw.category === 'physique'
                                      ? 'bg-green-500/20 text-green-400'
                                      : kw.category === 'fit'
                                        ? 'bg-cyan-500/20 text-cyan-400'
                                        : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {kw.category}: {kw.keyword}
                          </span>
                        ))}
                      </div>
                      
                      {/* Summary by category */}
                      <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/30">
                        {detectedKeywords.colorMods.length > 0 && (
                          <div><Palette className="w-3 h-3 inline mr-1" />Colors: {detectedKeywords.colorMods.join(', ')}</div>
                        )}
                        {detectedKeywords.patternMods.length > 0 && (
                          <div><Shirt className="w-3 h-3 inline mr-1" />Patterns: {detectedKeywords.patternMods.join(', ')}</div>
                        )}
                        {detectedKeywords.physiqueMods.length > 0 && (
                          <div><User className="w-3 h-3 inline mr-1" />Physique: {detectedKeywords.physiqueMods.join(', ')}</div>
                        )}
                        {detectedKeywords.clothFitMods.length > 0 && (
                          <div><Scissors className="w-3 h-3 inline mr-1" />Clothing Fit: {detectedKeywords.clothFitMods.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Detected Clothing Items from Portrait */}
                  {detectedClothing && (
                    <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20 space-y-2">
                      <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                        <Shirt className="w-4 h-4" />
                        Starting Clothing (from Portrait)
                        <span className="text-[10px] font-normal text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">
                          {detectedClothing.source === 'portrait_detected' ? 'AI Detected' : 'Genre Default'}
                        </span>
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(detectedClothing.items).map(([slot, item]) => (
                          item && (
                            <div 
                              key={slot}
                              className="flex items-center gap-2 p-2 bg-background/30 rounded border border-border/20"
                            >
                              <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
                                {slot === 'head' && <span className="text-xs">🎩</span>}
                                {slot === 'torso' && <span className="text-xs">👕</span>}
                                {slot === 'legs' && <span className="text-xs">👖</span>}
                                {slot === 'feet' && <span className="text-xs">👟</span>}
                                {slot === 'hands' && <span className="text-xs">🧤</span>}
                                {slot === 'accessory' && <span className="text-xs">💍</span>}
                                {slot === 'outfit' && <span className="text-xs">👔</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">{(item as any).name}</div>
                                <div className="text-[10px] text-muted-foreground capitalize">{slot}</div>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                      
                      <p className="text-[10px] text-muted-foreground italic">
                        These items will be added to your inventory when you start the adventure.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="ghost" onClick={prevStep} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {step === 'portrait' ? (
            <Button onClick={handleComplete} disabled={!canProceed() || isLoading} className="gap-2 bg-primary text-primary-foreground">
              <Dices className="w-4 h-4" />
              Begin Adventure
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()} className="gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Dices className="w-12 h-12 text-primary mx-auto animate-spin" />
            <p className="text-foreground font-narrative text-xl">Your fate is being written...</p>
          </div>
        </div>
      )}
    </div>
  );
}
