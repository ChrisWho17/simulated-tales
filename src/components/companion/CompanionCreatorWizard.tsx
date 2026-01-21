// ============================================================================
// COMPANION CREATOR WIZARD - Step-by-step companion creation with full randomization
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Palette, Brain, Sword, Sparkles, Shuffle, ChevronLeft, ChevronRight,
  Check, X, Loader2, Eye, Heart, Shield, Zap, Target, Users, Wand2,
  Clock, Volume2, Dices
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Gender, SKIN_TONES, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, BUILD_OPTIONS, HEIGHT_OPTIONS } from '@/types/characterCreation';
import { PersonalityTrait, companionSystem, CompanionState } from '@/game/companionSystem';
import { deriveBeliefSystem, calculateFirstImpression, evaluateJoiningDecision, buildCompanionIdentity, IMPRESSION_DESCRIPTIONS } from '@/game/companionSentienceSystem';
import { generateRoleBasedEquipment, companionEquipmentManager, CombatRole } from '@/game/companionEquipmentSystem';
import { generateVoiceProfile } from '@/game/randomizedSpeechSystem';
import { RPGCharacter } from '@/types/rpgCharacter';

// ============================================================================
// TYPES
// ============================================================================

type WizardStep = 'identity' | 'appearance' | 'personality' | 'combat' | 'preview';

interface CompanionCreatorState {
  name: string;
  gender: Gender;
  height: string;
  build: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  age: string;
  distinguishingFeatures: string[];
  traits: PersonalityTrait[];
  combatRole: CombatRole;
  armorLevel: 'none' | 'light' | 'medium' | 'heavy';
  originStory: string;
  appearanceTiming: 'immediately' | 'next_scene' | 'contextual';
  backstory: string;
  quirks: string[];
  speechPattern: string;
  catchphrases: string[];
  // Body shape
  bustSize?: string;
  hipWidth?: string;
  shoulderWidth?: string;
  physique?: string;
  portraitUrl: string | null;
}

interface CompanionCreatorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanionCreated: (companion: CompanionState) => void;
  genre?: string;
  character?: RPGCharacter;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WIZARD_STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'identity', label: 'Identity', icon: <User className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { id: 'personality', label: 'Personality', icon: <Brain className="w-4 h-4" /> },
  { id: 'combat', label: 'Combat', icon: <Sword className="w-4 h-4" /> },
  { id: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
];

const PERSONALITY_TRAITS: PersonalityTrait[] = [
  'honorable', 'ruthless', 'kind', 'cruel', 'brave', 'cowardly',
  'greedy', 'generous', 'loyal', 'treacherous', 'romantic', 'pragmatic',
  'spiritual', 'skeptical', 'vengeful', 'forgiving', 'ambitious', 'humble'
];

const COMBAT_ROLES: { id: CombatRole; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'tank', label: 'Tank', description: 'High defense, protects allies', icon: <Shield className="w-4 h-4" /> },
  { id: 'damage', label: 'Damage', description: 'High attack, glass cannon', icon: <Sword className="w-4 h-4" /> },
  { id: 'support', label: 'Support', description: 'Healing and buffs', icon: <Heart className="w-4 h-4" /> },
  { id: 'ranged', label: 'Ranged', description: 'Distance attacks, precision', icon: <Target className="w-4 h-4" /> },
];

const ORIGIN_STORIES = [
  { id: 'mentor', label: 'Sent by Mentor', description: 'A trusted mentor sent them to aid you' },
  { id: 'divine', label: 'Divine Intervention', description: 'A higher power guided them to your path' },
  { id: 'old_friend', label: 'Old Friend', description: "A friend from your past has arrived to help" },
  { id: 'stranger', label: 'Mysterious Stranger', description: 'They appeared when you needed them most' },
  { id: 'mutual_enemy', label: 'Mutual Enemy', description: 'United against a common foe' },
  { id: 'debt', label: 'Owes a Debt', description: "They owe you or someone you know" },
];

const APPEARANCE_TIMING = [
  { id: 'immediately', label: 'Immediately', description: 'Appears on the very next action' },
  { id: 'next_scene', label: 'Next Scene', description: 'Appears when the next scenario starts' },
  { id: 'contextual', label: 'Later On', description: 'Appears when it makes narrative sense' },
];

const ADULT_AGE_CATEGORIES = ['young adult (20s)', 'adult (30s)', 'mature adult (40s)', 'middle-aged (50s)', 'senior (60+)'];

const PERSONALITY_QUIRKS = [
  'hums when nervous', 'always carries a lucky charm', 'quotes old proverbs',
  'talks to themselves quietly', 'cracks knuckles when thinking', 'never sits with back to door',
  'collects small trinkets', 'always hungry', 'overly polite to strangers',
  'tells stories about "the old days"', 'laughs at inappropriate moments', 'fidgets with jewelry',
  'apologizes too much', 'gives nicknames to everyone', 'obsessed with cleanliness',
];

const BACKSTORY_TEMPLATES = [
  'A former soldier who left the battlefield seeking redemption.',
  'An exile from a distant land, carrying secrets of their homeland.',
  'A scholar who abandoned their studies for the call of adventure.',
  'Once a thief, now seeking to make amends for past crimes.',
  'A hunter from the wild frontiers, more comfortable with beasts than people.',
  'Survivor of a great tragedy, searching for meaning.',
  'Noble blood runs in their veins, though they hide their heritage.',
  'A wanderer with no memory of their past, piecing together their identity.',
];

// Genre-specific name pools
const GENRE_NAMES: Record<string, { male: string[]; female: string[]; other: string[]; lastNames?: string[] }> = {
  fantasy: {
    male: ['Marcus', 'Aldric', 'Gareth', 'Theron', 'Roland', 'Cedric', 'Edmund', 'Gideon', 'Hadrian', 'Leander'],
    female: ['Elena', 'Lyra', 'Seraphina', 'Celeste', 'Diana', 'Freya', 'Helena', 'Iris', 'Luna', 'Ophelia'],
    other: ['Rowan', 'Sage', 'Ash', 'Morgan', 'Raven', 'Quinn', 'Wren', 'Phoenix', 'River', 'Storm'],
    lastNames: ['Stormwind', 'Ironforge', 'Brightblade', 'Shadowmere', 'Thornwood', 'Silverhand'],
  },
  modern: {
    male: ['James', 'Michael', 'David', 'Ryan', 'Alex', 'Chris', 'Daniel', 'Marcus', 'Jason', 'Kevin'],
    female: ['Sarah', 'Emily', 'Jessica', 'Amanda', 'Nicole', 'Rachel', 'Megan', 'Lauren', 'Natalie', 'Samantha'],
    other: ['Jordan', 'Alex', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Jamie', 'Drew'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'],
  },
  scifi: {
    male: ['Zane', 'Marcus', 'Rex', 'Cole', 'Jax', 'Kane', 'Dex', 'Orion', 'Atlas', 'Cyrus'],
    female: ['Nova', 'Stella', 'Vera', 'Lyra', 'Zara', 'Kira', 'Mira', 'Astra', 'Cora', 'Vega'],
    other: ['Seren', 'Kai', 'Sol', 'Phoenix', 'Onyx', 'Rune', 'Cipher', 'Nova', 'Echo', 'Argo'],
    lastNames: ['Vance', 'Sterling', 'Cross', 'Drake', 'Frost', 'Stone', 'Hawk', 'Wolf'],
  },
  western: {
    male: ['Jack', 'William', 'Samuel', 'Thomas', 'Henry', 'James', 'Wyatt', 'Cole', 'Jesse', 'Eli'],
    female: ['Mary', 'Sarah', 'Emma', 'Grace', 'Rose', 'Clara', 'Annie', 'Lily', 'Ruth', 'Pearl'],
    other: ['Dakota', 'Carson', 'Morgan', 'Riley', 'Jesse', 'Quinn', 'Sage', 'Reese', 'Lane', 'Arden'],
    lastNames: ['Earp', 'Holliday', 'Masterson', 'Garrett', 'Cassidy', 'Hickok'],
  },
  horror: {
    male: ['Thomas', 'Edward', 'Victor', 'Charles', 'Henry', 'William', 'James', 'Robert', 'Arthur', 'George'],
    female: ['Elizabeth', 'Mary', 'Victoria', 'Catherine', 'Rose', 'Clara', 'Evelyn', 'Margaret', 'Ruth', 'Helen'],
    other: ['Morgan', 'Raven', 'Quinn', 'Ash', 'Blair', 'Salem', 'Shadow', 'Vesper', 'Crow', 'Winter'],
    lastNames: ['Blackwood', 'Ravenscroft', 'Thornwood', 'Darkholme', 'Graves', 'Nightshade'],
  },
};

const NATURAL_SKIN_TONES = ['Porcelain', 'Ivory', 'Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Caramel', 'Brown', 'Dark Brown', 'Ebony'];
const NATURAL_HAIR_COLORS = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Auburn', 'Red', 'Blonde', 'Platinum Blonde', 'Gray', 'White'];
const NATURAL_EYE_COLORS = ['Brown', 'Dark Brown', 'Hazel', 'Amber', 'Green', 'Blue', 'Gray'];
const SIMPLE_HAIR_STYLES = ['Short', 'Medium', 'Long', 'Ponytail', 'Braided', 'Curly', 'Wavy', 'Bun'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateFullName(genre: string, gender: string): string {
  const normalizedGenre = genre.toLowerCase().replace(/[_\s-]/g, '');
  const genreMap: Record<string, string> = { modernlife: 'modern', postapoc: 'western', cyberpunk: 'scifi' };
  const mappedGenre = genreMap[normalizedGenre] || normalizedGenre;
  const namePool = GENRE_NAMES[mappedGenre] || GENRE_NAMES.fantasy;
  
  const genderKey = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other';
  const firstNames = namePool[genderKey] || namePool.other;
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  
  if (namePool.lastNames && Math.random() < 0.7) {
    const lastName = namePool.lastNames[Math.floor(Math.random() * namePool.lastNames.length)];
    return `${firstName} ${lastName}`;
  }
  return firstName;
}

function getDefaultCreatorState(): CompanionCreatorState {
  return {
    name: '',
    gender: 'other',
    height: 'average',
    build: 'average',
    skinTone: 'Medium',
    hairStyle: 'Medium',
    hairColor: 'Brown',
    eyeColor: 'Brown',
    age: 'adult (30s)',
    distinguishingFeatures: [],
    traits: ['loyal', 'brave'],
    combatRole: 'damage',
    armorLevel: 'light',
    originStory: 'stranger',
    appearanceTiming: 'contextual',
    backstory: '',
    quirks: [],
    speechPattern: 'casual, friendly',
    catchphrases: [],
    portraitUrl: null,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CompanionCreatorWizard({
  isOpen,
  onClose,
  onCompanionCreated,
  genre = 'fantasy',
  character,
}: CompanionCreatorWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('identity');
  const [state, setState] = useState<CompanionCreatorState>(getDefaultCreatorState());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);

  // Full randomization - randomizes EVERYTHING
  const handleFullRandomize = useCallback(() => {
    const genderOptions: Gender[] = ['male', 'female', 'other'];
    const randomGender = genderOptions[Math.floor(Math.random() * genderOptions.length)];
    const randomName = generateFullName(genre, randomGender);
    
    const traitCount = 2 + Math.floor(Math.random() * 2);
    const shuffledTraits = [...PERSONALITY_TRAITS].sort(() => Math.random() - 0.5);
    const randomTraits = shuffledTraits.slice(0, traitCount) as PersonalityTrait[];
    
    const quirkCount = 1 + Math.floor(Math.random() * 2);
    const shuffledQuirks = [...PERSONALITY_QUIRKS].sort(() => Math.random() - 0.5);
    const randomQuirks = shuffledQuirks.slice(0, quirkCount);
    
    const randomRole = COMBAT_ROLES[Math.floor(Math.random() * COMBAT_ROLES.length)].id;
    const armorLevels: ('none' | 'light' | 'medium' | 'heavy')[] = ['none', 'light', 'medium', 'heavy'];
    const randomArmor = armorLevels[Math.floor(Math.random() * armorLevels.length)];
    const randomOrigin = ORIGIN_STORIES[Math.floor(Math.random() * ORIGIN_STORIES.length)].id;
    const timingOptions: ('immediately' | 'next_scene' | 'contextual')[] = ['immediately', 'next_scene', 'contextual'];
    const randomTiming = timingOptions[Math.floor(Math.random() * timingOptions.length)];
    const randomBackstory = BACKSTORY_TEMPLATES[Math.floor(Math.random() * BACKSTORY_TEMPLATES.length)];
    const randomAge = ADULT_AGE_CATEGORIES[Math.floor(Math.random() * ADULT_AGE_CATEGORIES.length)];
    
    // Body-specific randomization
    const bustSizes = ['A', 'B', 'C', 'D', 'DD'];
    const hipWidths = ['narrow', 'average', 'wide'];
    const shoulderWidths = ['narrow', 'average', 'broad'];
    const physiqueOptions = ['slim', 'average', 'athletic', 'muscular', 'stocky'];

    setState({
      name: randomName,
      gender: randomGender,
      height: HEIGHT_OPTIONS[Math.floor(Math.random() * HEIGHT_OPTIONS.length)].value,
      build: BUILD_OPTIONS[Math.floor(Math.random() * BUILD_OPTIONS.length)].value,
      skinTone: NATURAL_SKIN_TONES[Math.floor(Math.random() * NATURAL_SKIN_TONES.length)],
      hairStyle: SIMPLE_HAIR_STYLES[Math.floor(Math.random() * SIMPLE_HAIR_STYLES.length)],
      hairColor: NATURAL_HAIR_COLORS[Math.floor(Math.random() * NATURAL_HAIR_COLORS.length)],
      eyeColor: NATURAL_EYE_COLORS[Math.floor(Math.random() * NATURAL_EYE_COLORS.length)],
      age: randomAge,
      distinguishingFeatures: [],
      traits: randomTraits,
      combatRole: randomRole,
      armorLevel: randomArmor,
      originStory: randomOrigin,
      appearanceTiming: randomTiming,
      backstory: randomBackstory,
      quirks: randomQuirks,
      speechPattern: 'casual, friendly',
      catchphrases: [],
      bustSize: randomGender === 'female' ? bustSizes[Math.floor(Math.random() * bustSizes.length)] : undefined,
      hipWidth: randomGender === 'female' ? hipWidths[Math.floor(Math.random() * hipWidths.length)] : undefined,
      shoulderWidth: randomGender === 'male' ? shoulderWidths[Math.floor(Math.random() * shoulderWidths.length)] : undefined,
      physique: randomGender === 'male' ? physiqueOptions[Math.floor(Math.random() * physiqueOptions.length)] : undefined,
      portraitUrl: null,
    });
    
    toast.success('Companion fully randomized!', { description: 'A unique character has been generated.' });
  }, [genre]);

  // Section-specific randomization
  const randomizeSection = useCallback((section: WizardStep) => {
    setState(prev => {
      switch (section) {
        case 'identity': {
          const randomName = generateFullName(genre, prev.gender);
          const randomAge = ADULT_AGE_CATEGORIES[Math.floor(Math.random() * ADULT_AGE_CATEGORIES.length)];
          const randomOrigin = ORIGIN_STORIES[Math.floor(Math.random() * ORIGIN_STORIES.length)].id;
          const randomBackstory = BACKSTORY_TEMPLATES[Math.floor(Math.random() * BACKSTORY_TEMPLATES.length)];
          return { ...prev, name: randomName, age: randomAge, originStory: randomOrigin, backstory: randomBackstory };
        }
        case 'appearance': {
          const bustSizes = ['A', 'B', 'C', 'D', 'DD'];
          const hipWidths = ['narrow', 'average', 'wide'];
          const shoulderWidths = ['narrow', 'average', 'broad'];
          const physiqueOptions = ['slim', 'average', 'athletic', 'muscular', 'stocky'];
          return {
            ...prev,
            height: HEIGHT_OPTIONS[Math.floor(Math.random() * HEIGHT_OPTIONS.length)].value,
            build: BUILD_OPTIONS[Math.floor(Math.random() * BUILD_OPTIONS.length)].value,
            skinTone: NATURAL_SKIN_TONES[Math.floor(Math.random() * NATURAL_SKIN_TONES.length)],
            hairStyle: SIMPLE_HAIR_STYLES[Math.floor(Math.random() * SIMPLE_HAIR_STYLES.length)],
            hairColor: NATURAL_HAIR_COLORS[Math.floor(Math.random() * NATURAL_HAIR_COLORS.length)],
            eyeColor: NATURAL_EYE_COLORS[Math.floor(Math.random() * NATURAL_EYE_COLORS.length)],
            bustSize: prev.gender === 'female' ? bustSizes[Math.floor(Math.random() * bustSizes.length)] : undefined,
            hipWidth: prev.gender === 'female' ? hipWidths[Math.floor(Math.random() * hipWidths.length)] : undefined,
            shoulderWidth: prev.gender === 'male' ? shoulderWidths[Math.floor(Math.random() * shoulderWidths.length)] : undefined,
            physique: prev.gender === 'male' ? physiqueOptions[Math.floor(Math.random() * physiqueOptions.length)] : undefined,
          };
        }
        case 'personality': {
          const traitCount = 2 + Math.floor(Math.random() * 2);
          const shuffledTraits = [...PERSONALITY_TRAITS].sort(() => Math.random() - 0.5);
          const quirkCount = 1 + Math.floor(Math.random() * 2);
          const shuffledQuirks = [...PERSONALITY_QUIRKS].sort(() => Math.random() - 0.5);
          return {
            ...prev,
            traits: shuffledTraits.slice(0, traitCount) as PersonalityTrait[],
            quirks: shuffledQuirks.slice(0, quirkCount),
          };
        }
        case 'combat': {
          const armorLevels: ('none' | 'light' | 'medium' | 'heavy')[] = ['none', 'light', 'medium', 'heavy'];
          const timingOptions: ('immediately' | 'next_scene' | 'contextual')[] = ['immediately', 'next_scene', 'contextual'];
          return {
            ...prev,
            combatRole: COMBAT_ROLES[Math.floor(Math.random() * COMBAT_ROLES.length)].id,
            armorLevel: armorLevels[Math.floor(Math.random() * armorLevels.length)],
            appearanceTiming: timingOptions[Math.floor(Math.random() * timingOptions.length)],
          };
        }
        default:
          return prev;
      }
    });
    toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} randomized!`);
  }, [genre]);

  const toggleTrait = useCallback((trait: PersonalityTrait) => {
    setState(prev => {
      if (prev.traits.includes(trait)) {
        return { ...prev, traits: prev.traits.filter(t => t !== trait) };
      } else if (prev.traits.length < 5) {
        return { ...prev, traits: [...prev.traits, trait] };
      }
      return prev;
    });
  }, []);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'identity':
        return state.name.trim().length >= 2;
      case 'appearance':
        return true;
      case 'personality':
        return state.traits.length >= 1;
      case 'combat':
        return true;
      case 'preview':
        return true;
      default:
        return false;
    }
  }, [currentStep, state]);

  const handleNext = useCallback(() => {
    const idx = currentStepIndex;
    if (idx < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[idx + 1].id);
    }
  }, [currentStepIndex]);

  const handleBack = useCallback(() => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(WIZARD_STEPS[idx - 1].id);
    }
  }, [currentStepIndex]);

  const handleCreate = useCallback(async () => {
    if (!state.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setIsCreating(true);

    try {
      const companionId = `companion_${Date.now()}`;
      const beliefs = deriveBeliefSystem(state.traits);
      
      const playerReputation = { honor: 0, infamy: 0, kindness: 0, wealth: character?.gold || 0 };
      const firstImpression = calculateFirstImpression(state.traits, beliefs, character, playerReputation);
      const joiningDecision = evaluateJoiningDecision(
        { id: companionId, name: state.name.trim(), personality: { traits: state.traits } } as CompanionState,
        beliefs,
        firstImpression,
        playerReputation
      );
      
      const identity = buildCompanionIdentity(state.name.trim(), true);
      
      const customPersonality = {
        traits: state.traits,
        values: {
          honor: state.traits.includes('honorable') ? 80 : state.traits.includes('ruthless') ? 20 : 50,
          wealth: state.traits.includes('greedy') ? 90 : state.traits.includes('generous') ? 20 : 50,
          power: state.traits.includes('ambitious') ? 80 : state.traits.includes('humble') ? 20 : 50,
          love: state.traits.includes('romantic') ? 80 : state.traits.includes('pragmatic') ? 30 : 50,
          freedom: 60,
          justice: state.traits.includes('kind') ? 70 : state.traits.includes('cruel') ? 20 : 50,
          knowledge: 50,
          family: 50,
        },
        approves: state.traits.includes('honorable') 
          ? ['truth', 'loyalty', 'bravery'] 
          : state.traits.includes('greedy')
          ? ['theft', 'greed']
          : ['diplomacy', 'mercy'],
        disapproves: state.traits.includes('kind')
          ? ['cruelty', 'betrayal']
          : state.traits.includes('ruthless')
          ? ['mercy', 'charity']
          : ['cowardice'],
        romanticInterest: {
          enabled: state.traits.includes('romantic'),
          preferredGender: 'any' as const,
          attractedToPlayer: state.traits.includes('romantic'),
          romanceThreshold: 70,
        },
        betrayalThreshold: state.traits.includes('loyal') ? -80 : -40,
        departureThreshold: state.traits.includes('loyal') ? -60 : -30,
        speechPattern: state.speechPattern,
        catchphrases: state.catchphrases.length > 0 ? state.catchphrases : ['Interesting...', 'I see.'],
        quirks: state.quirks,
        hiddenQuirks: [],
      };
      
      const storyIntroduction = joiningDecision.willJoin 
        ? `${state.backstory || 'A new companion appears.'}\n\n${joiningDecision.dialogueResponse}`
        : joiningDecision.dialogueResponse;
      
      const startingAffinity = Math.floor(firstImpression.score / 2);
      const startingTrust = joiningDecision.willJoin ? 40 + Math.floor(firstImpression.score / 5) : 20;
      
      const companion: CompanionState = {
        id: companionId,
        name: identity.characterSheetName,
        status: joiningDecision.willJoin ? 'active' : 'waiting',
        mood: joiningDecision.willJoin ? 'content' : 'neutral',
        moodIntensity: 60,
        affinity: startingAffinity,
        trust: startingTrust,
        respect: startingTrust,
        fear: 0,
        romanticInterest: state.traits.includes('romantic') ? 20 : 0,
        personality: customPersonality as any,
        quirkDiscovery: { discoveredQuirks: [], lastDiscoveryCheck: Date.now() },
        conversationMemory: {
          companionId,
          sharedTopics: [],
          askedTopics: [],
          lastAskedAt: 0,
          conversationDepth: 0,
        },
        memories: [{
          timestamp: Date.now(),
          type: 'event' as const,
          description: `Joined the party: ${ORIGIN_STORIES.find(o => o.id === state.originStory)?.label || 'Mysterious arrival'}`,
          affinityChange: joiningDecision.willJoin ? 20 : 0,
          forgotten: false,
        }],
        internalThoughts: joiningDecision.willJoin 
          ? 'Ready to prove myself to this new companion.'
          : "I'm not sure about this person yet...",
        wantsToSpeak: true,
        pendingReaction: storyIntroduction,
        combatRole: state.combatRole,
        skills: ['basic_attack', 'defend'],
        equipment: [],
        joinedAt: Date.now(),
        lastSpoke: 0,
        confessedLove: false,
        wasBetrayed: false,
        hasSecret: Math.random() > 0.5,
        secretRevealed: false,
      };
      
      // Register and equip
      companionSystem.registerCompanion(companion);
      companionSystem.recruitCompanion(companion.id);
      
      const startingEquipment = generateRoleBasedEquipment(genre, state.combatRole, 'uncommon');
      if (startingEquipment.weapon) companionEquipmentManager.equip(companionId, startingEquipment.weapon);
      if (startingEquipment.armor) companionEquipmentManager.equip(companionId, startingEquipment.armor);
      if (startingEquipment.accessory) companionEquipmentManager.equip(companionId, startingEquipment.accessory);
      
      // Queue introduction
      const { compressAndStore, decompressAndLoad } = await import('@/lib/storageCleanup');
      const pendingIntros = decompressAndLoad<any[]>('pending-companion-introductions', []);
      pendingIntros.push({
        companionId,
        name: companion.name,
        introduction: storyIntroduction,
        portraitUrl: state.portraitUrl,
        origin: state.originStory,
        appearanceTiming: state.appearanceTiming,
        timestamp: Date.now(),
        displayed: false,
        contextTriggers: { turnsSinceCreated: 0 },
      });
      compressAndStore('pending-companion-introductions', pendingIntros);
      
      // Save appearance
      const companionAppearances = JSON.parse(localStorage.getItem('companion-appearances') || '{}');
      companionAppearances[companionId] = {
        gender: state.gender,
        height: state.height,
        build: state.build,
        skinTone: state.skinTone,
        hairStyle: state.hairStyle,
        hairColor: state.hairColor,
        eyeColor: state.eyeColor,
        armorLevel: state.armorLevel,
        age: state.age,
        portraitUrl: state.portraitUrl,
      };
      compressAndStore('companion-appearances', companionAppearances);
      
      onCompanionCreated(companion);
      
      if (joiningDecision.willJoin) {
        toast.success(`${identity.displayName} has decided to join!`, {
          description: `${IMPRESSION_DESCRIPTIONS[firstImpression.level].emoji} ${IMPRESSION_DESCRIPTIONS[firstImpression.level].label} first impression`,
        });
      } else {
        toast.warning(`${identity.displayName} declined to join.`, {
          description: joiningDecision.alternativeCondition,
        });
      }
      
      // Reset and close
      setState(getDefaultCreatorState());
      setCurrentStep('identity');
      onClose();
    } catch (error) {
      console.error('Failed to create companion:', error);
      toast.error('Failed to create companion');
    } finally {
      setIsCreating(false);
    }
  }, [state, genre, character, onCompanionCreated, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Create Companion</h2>
              <p className="text-xs text-muted-foreground">Step {currentStepIndex + 1} of {WIZARD_STEPS.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleFullRandomize} className="gap-2">
              <Dices className="w-4 h-4" />
              Full Random
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 px-6 py-3 bg-muted/20 border-b border-border">
          {WIZARD_STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : idx < currentStepIndex
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Identity Step */}
              {currentStep === 'identity' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Identity</h3>
                    <Button variant="ghost" size="sm" onClick={() => randomizeSection('identity')} className="gap-1">
                      <Shuffle className="w-3 h-3" /> Randomize
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <Label>Name</Label>
                      <Input
                        value={state.name}
                        onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter companion name..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={state.gender} onValueChange={(v) => setState(prev => ({ ...prev, gender: v as Gender }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Non-binary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Age</Label>
                      <Select value={state.age} onValueChange={(v) => setState(prev => ({ ...prev, age: v }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ADULT_AGE_CATEGORIES.map(age => (
                            <SelectItem key={age} value={age}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Origin</Label>
                      <Select value={state.originStory} onValueChange={(v) => setState(prev => ({ ...prev, originStory: v }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORIGIN_STORIES.map(origin => (
                            <SelectItem key={origin.id} value={origin.id}>{origin.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Backstory (optional)</Label>
                    <Textarea
                      value={state.backstory}
                      onChange={(e) => setState(prev => ({ ...prev, backstory: e.target.value }))}
                      placeholder="Their background story..."
                      className="mt-1 h-20 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Appearance Step */}
              {currentStep === 'appearance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Appearance</h3>
                    <Button variant="ghost" size="sm" onClick={() => randomizeSection('appearance')} className="gap-1">
                      <Shuffle className="w-3 h-3" /> Randomize
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Height</Label>
                      <Select value={state.height} onValueChange={(v) => setState(prev => ({ ...prev, height: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {HEIGHT_OPTIONS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Build</Label>
                      <Select value={state.build} onValueChange={(v) => setState(prev => ({ ...prev, build: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BUILD_OPTIONS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Skin Tone</Label>
                      <Select value={state.skinTone} onValueChange={(v) => setState(prev => ({ ...prev, skinTone: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {NATURAL_SKIN_TONES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Eye Color</Label>
                      <Select value={state.eyeColor} onValueChange={(v) => setState(prev => ({ ...prev, eyeColor: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {NATURAL_EYE_COLORS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Hair Style</Label>
                      <Select value={state.hairStyle} onValueChange={(v) => setState(prev => ({ ...prev, hairStyle: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SIMPLE_HAIR_STYLES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Hair Color</Label>
                      <Select value={state.hairColor} onValueChange={(v) => setState(prev => ({ ...prev, hairColor: v }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {NATURAL_HAIR_COLORS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Gender-specific body options */}
                  {state.gender === 'female' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div>
                        <Label>Bust Size</Label>
                        <Select value={state.bustSize || 'C'} onValueChange={(v) => setState(prev => ({ ...prev, bustSize: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['A', 'B', 'C', 'D', 'DD', 'E'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Hip Width</Label>
                        <Select value={state.hipWidth || 'average'} onValueChange={(v) => setState(prev => ({ ...prev, hipWidth: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['narrow', 'average', 'wide', 'very wide'].map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {state.gender === 'male' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                      <div>
                        <Label>Shoulder Width</Label>
                        <Select value={state.shoulderWidth || 'average'} onValueChange={(v) => setState(prev => ({ ...prev, shoulderWidth: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['narrow', 'average', 'broad', 'very broad'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Physique</Label>
                        <Select value={state.physique || 'average'} onValueChange={(v) => setState(prev => ({ ...prev, physique: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['slim', 'average', 'athletic', 'muscular', 'stocky', 'dad bod'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Personality Step */}
              {currentStep === 'personality' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Personality</h3>
                    <Button variant="ghost" size="sm" onClick={() => randomizeSection('personality')} className="gap-1">
                      <Shuffle className="w-3 h-3" /> Randomize
                    </Button>
                  </div>

                  <div>
                    <Label className="mb-2 block">Traits ({state.traits.length}/5)</Label>
                    <div className="flex flex-wrap gap-2">
                      {PERSONALITY_TRAITS.map(trait => (
                        <Badge
                          key={trait}
                          variant={state.traits.includes(trait) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all capitalize",
                            state.traits.includes(trait) && "bg-primary"
                          )}
                          onClick={() => toggleTrait(trait)}
                        >
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Quirks (optional)</Label>
                    <div className="flex flex-wrap gap-2">
                      {PERSONALITY_QUIRKS.slice(0, 10).map(quirk => (
                        <Badge
                          key={quirk}
                          variant={state.quirks.includes(quirk) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            setState(prev => ({
                              ...prev,
                              quirks: prev.quirks.includes(quirk)
                                ? prev.quirks.filter(q => q !== quirk)
                                : prev.quirks.length < 3
                                ? [...prev.quirks, quirk]
                                : prev.quirks
                            }));
                          }}
                        >
                          {quirk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Combat Step */}
              {currentStep === 'combat' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Combat & Timing</h3>
                    <Button variant="ghost" size="sm" onClick={() => randomizeSection('combat')} className="gap-1">
                      <Shuffle className="w-3 h-3" /> Randomize
                    </Button>
                  </div>

                  <div>
                    <Label className="mb-2 block">Combat Role</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {COMBAT_ROLES.map(role => (
                        <button
                          key={role.id}
                          onClick={() => setState(prev => ({ ...prev, combatRole: role.id }))}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                            state.combatRole === role.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-md",
                            state.combatRole === role.id ? "bg-primary/20" : "bg-muted"
                          )}>
                            {role.icon}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{role.label}</div>
                            <div className="text-xs text-muted-foreground">{role.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">When They Appear</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {APPEARANCE_TIMING.map(timing => (
                        <button
                          key={timing.id}
                          onClick={() => setState(prev => ({ ...prev, appearanceTiming: timing.id as any }))}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                            state.appearanceTiming === timing.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Clock className="w-4 h-4" />
                          <div>
                            <div className="font-medium text-sm">{timing.label}</div>
                            <div className="text-xs text-muted-foreground">{timing.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Step */}
              {currentStep === 'preview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Preview</h3>
                  
                  <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-border flex items-center justify-center">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{state.name || 'Unnamed'}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {state.age} • {state.gender} • {state.combatRole}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {state.traits.map(trait => (
                            <Badge key={trait} variant="secondary" className="text-xs capitalize">{trait}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Origin:</span>{' '}
                        <span>{ORIGIN_STORIES.find(o => o.id === state.originStory)?.label}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Appears:</span>{' '}
                        <span>{APPEARANCE_TIMING.find(t => t.id === state.appearanceTiming)?.label}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Build:</span>{' '}
                        <span className="capitalize">{state.height}, {state.build}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hair:</span>{' '}
                        <span>{state.hairColor} {state.hairStyle}</span>
                      </div>
                    </div>

                    {state.backstory && (
                      <div className="pt-3 border-t border-border/50">
                        <p className="text-sm italic text-muted-foreground">"{state.backstory}"</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      Companions make their own decision to join based on their personality and your reputation!
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep === 'preview' ? (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !canProceed}
              className="gap-2"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Create Companion
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
