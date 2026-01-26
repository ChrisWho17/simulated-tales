// ============================================================================
// COMPANION CREATOR WIZARD V2 - Full rebuild with deep personality options
// ============================================================================

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Brain, Sword, Sparkles, Shuffle, ChevronLeft, ChevronRight,
  Check, X, Loader2, Eye, Heart, Shield, Target, Users, Wand2,
  Skull, Star, Moon, Sun, Flame, Droplet, Wind, Mountain,
  BookOpen, Crown, Zap, Ghost, Feather, Scale, Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TouchScrollContainer } from '@/components/ui/touch-scroll-container';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Gender } from '@/types/characterCreation';
import { PersonalityTrait, companionSystem, CompanionState } from '@/game/companionSystem';
import { deriveBeliefSystem, calculateFirstImpression, evaluateJoiningDecision, buildCompanionIdentity, IMPRESSION_DESCRIPTIONS } from '@/game/companionSentienceSystem';
import { generateRoleBasedEquipment, companionEquipmentManager, CombatRole } from '@/game/companionEquipmentSystem';
import { generateVoiceProfile, buildSpeechInstructions, getQuickSpeechSummary } from '@/game/randomizedSpeechSystem';
import { createDefaultAutonomyState, generateCompanionGoals, AutonomyState } from '@/game/companion/companionAutonomy';
import { RPGCharacter } from '@/types/rpgCharacter';

// ============================================================================
// TYPES
// ============================================================================

type WizardStep = 'identity' | 'psyche' | 'beliefs' | 'combat' | 'voice' | 'preview';

interface DeepPersonality {
  // Core fears (what terrifies them)
  fears: string[];
  // Deep desires (what they truly want)
  desires: string[];
  // Hidden depths (secrets, shame, regrets)
  hiddenDepths: string[];
  // Core beliefs about the world
  worldview: {
    trustInOthers: number; // 0-100
    beliefInFate: number;
    valueOfLife: number;
    viewOfAuthority: number;
  };
  // Emotional patterns
  emotionalPatterns: {
    angerTriggers: string[];
    comfortSources: string[];
    copingMechanisms: string[];
  };
}

interface CompanionCreatorStateV2 {
  // Identity
  name: string;
  gender: Gender;
  age: string;
  title?: string;
  backstory: string;
  
  // Personality
  traits: PersonalityTrait[];
  deepPersonality: DeepPersonality;
  
  // Combat
  combatRole: CombatRole;
  armorLevel: 'none' | 'light' | 'medium' | 'heavy';
  combatStyle: string;
  
  // Voice & Speech
  voiceStyle: 'formal' | 'casual' | 'gruff' | 'eloquent' | 'mysterious' | 'sardonic';
  speechQuirks: string[];
  catchphrases: string[];
  
  // Autonomy
  autonomyLevel: 'passive' | 'reactive' | 'proactive' | 'independent';
  
  // Appearance timing
  appearanceTiming: 'immediately' | 'next_scene' | 'contextual';
  originStory: string;
}

interface CompanionCreatorWizardV2Props {
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
  { id: 'psyche', label: 'Psyche', icon: <Brain className="w-4 h-4" /> },
  { id: 'beliefs', label: 'Beliefs', icon: <Scale className="w-4 h-4" /> },
  { id: 'combat', label: 'Combat', icon: <Sword className="w-4 h-4" /> },
  { id: 'voice', label: 'Voice', icon: <Feather className="w-4 h-4" /> },
  { id: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
];

const PERSONALITY_TRAITS: PersonalityTrait[] = [
  'honorable', 'ruthless', 'kind', 'cruel', 'brave', 'cowardly',
  'greedy', 'generous', 'loyal', 'treacherous', 'romantic', 'pragmatic',
  'spiritual', 'skeptical', 'vengeful', 'forgiving', 'ambitious', 'humble'
];

const TRAIT_ICONS: Partial<Record<PersonalityTrait, React.ReactNode>> = {
  honorable: <Crown className="w-3 h-3" />,
  ruthless: <Skull className="w-3 h-3" />,
  kind: <Heart className="w-3 h-3" />,
  brave: <Shield className="w-3 h-3" />,
  spiritual: <Star className="w-3 h-3" />,
  romantic: <Heart className="w-3 h-3 text-pink-400" />,
  vengeful: <Flame className="w-3 h-3" />,
  ambitious: <Crown className="w-3 h-3" />,
};

const FEAR_OPTIONS = [
  { id: 'abandonment', label: 'Abandonment', icon: <Ghost className="w-4 h-4" /> },
  { id: 'failure', label: 'Failure', icon: <Target className="w-4 h-4" /> },
  { id: 'death', label: 'Death', icon: <Skull className="w-4 h-4" /> },
  { id: 'betrayal', label: 'Being Betrayed', icon: <Heart className="w-4 h-4" /> },
  { id: 'weakness', label: 'Showing Weakness', icon: <Shield className="w-4 h-4" /> },
  { id: 'loss', label: 'Losing Loved Ones', icon: <Users className="w-4 h-4" /> },
  { id: 'truth', label: 'The Truth Coming Out', icon: <Eye className="w-4 h-4" /> },
  { id: 'darkness', label: 'The Unknown/Darkness', icon: <Moon className="w-4 h-4" /> },
];

const DESIRE_OPTIONS = [
  { id: 'power', label: 'Power & Control', icon: <Crown className="w-4 h-4" /> },
  { id: 'love', label: 'True Love', icon: <Heart className="w-4 h-4" /> },
  { id: 'redemption', label: 'Redemption', icon: <Sun className="w-4 h-4" /> },
  { id: 'revenge', label: 'Revenge', icon: <Flame className="w-4 h-4" /> },
  { id: 'freedom', label: 'Freedom', icon: <Wind className="w-4 h-4" /> },
  { id: 'knowledge', label: 'Knowledge', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'belonging', label: 'Belonging', icon: <Users className="w-4 h-4" /> },
  { id: 'legacy', label: 'Legacy', icon: <Mountain className="w-4 h-4" /> },
];

const HIDDEN_DEPTH_OPTIONS = [
  { id: 'past_crime', label: 'Committed a terrible crime', severity: 'dark' },
  { id: 'lost_love', label: 'Lost someone they loved deeply', severity: 'sad' },
  { id: 'secret_identity', label: 'Hiding their true identity', severity: 'mystery' },
  { id: 'broken_oath', label: 'Broke a sacred oath', severity: 'shame' },
  { id: 'family_secret', label: 'Carries a dark family secret', severity: 'mystery' },
  { id: 'former_villain', label: 'Was once a villain/enemy', severity: 'dark' },
  { id: 'prophecy', label: 'Connected to a prophecy', severity: 'mystery' },
  { id: 'debt', label: 'Owes a dangerous debt', severity: 'threat' },
];

const COMBAT_ROLES: { id: CombatRole; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'tank', label: 'Guardian', description: 'Protects allies, absorbs damage', icon: <Shield className="w-5 h-5" /> },
  { id: 'damage', label: 'Striker', description: 'High damage, aggressive fighter', icon: <Sword className="w-5 h-5" /> },
  { id: 'support', label: 'Supporter', description: 'Heals, buffs, tactical aid', icon: <Heart className="w-5 h-5" /> },
  { id: 'ranged', label: 'Sharpshooter', description: 'Precision attacks from distance', icon: <Target className="w-5 h-5" /> },
];

const VOICE_STYLES = [
  { id: 'formal', label: 'Formal', description: 'Proper, educated speech' },
  { id: 'casual', label: 'Casual', description: 'Relaxed, friendly tone' },
  { id: 'gruff', label: 'Gruff', description: 'Rough, no-nonsense delivery' },
  { id: 'eloquent', label: 'Eloquent', description: 'Poetic, expressive language' },
  { id: 'mysterious', label: 'Mysterious', description: 'Cryptic, enigmatic words' },
  { id: 'sardonic', label: 'Sardonic', description: 'Dry wit, cutting remarks' },
];

const AUTONOMY_LEVELS = [
  { id: 'passive', label: 'Passive', description: 'Follows your lead, rarely speaks up' },
  { id: 'reactive', label: 'Reactive', description: 'Responds to events, voices opinions' },
  { id: 'proactive', label: 'Proactive', description: 'Initiates conversations, has goals' },
  { id: 'independent', label: 'Independent', description: 'May refuse, leave, or act alone' },
];

const GENRE_NAMES: Record<string, { male: string[]; female: string[]; other: string[] }> = {
  fantasy: {
    male: ['Marcus', 'Aldric', 'Gareth', 'Theron', 'Roland', 'Cedric', 'Edmund', 'Gideon'],
    female: ['Elena', 'Lyra', 'Seraphina', 'Celeste', 'Diana', 'Freya', 'Helena', 'Iris'],
    other: ['Rowan', 'Sage', 'Ash', 'Morgan', 'Raven', 'Quinn', 'Wren', 'Phoenix'],
  },
  modern: {
    male: ['James', 'Michael', 'David', 'Ryan', 'Alex', 'Chris', 'Daniel', 'Marcus'],
    female: ['Sarah', 'Emily', 'Jessica', 'Amanda', 'Nicole', 'Rachel', 'Megan', 'Lauren'],
    other: ['Jordan', 'Alex', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn'],
  },
  scifi: {
    male: ['Zane', 'Marcus', 'Rex', 'Cole', 'Jax', 'Kane', 'Dex', 'Orion'],
    female: ['Nova', 'Stella', 'Vera', 'Lyra', 'Zara', 'Kira', 'Mira', 'Astra'],
    other: ['Seren', 'Kai', 'Sol', 'Phoenix', 'Onyx', 'Rune', 'Cipher', 'Echo'],
  },
};

const ADULT_AGES = ['young adult (20s)', 'adult (30s)', 'mature (40s)', 'middle-aged (50s)', 'senior (60+)'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRandomName(genre: string, gender: string): string {
  const pool = GENRE_NAMES[genre.toLowerCase()] || GENRE_NAMES.fantasy;
  const genderKey = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other';
  const names = pool[genderKey] || pool.other;
  return names[Math.floor(Math.random() * names.length)];
}

function getDefaultState(): CompanionCreatorStateV2 {
  return {
    name: '',
    gender: 'other',
    age: 'adult (30s)',
    backstory: '',
    traits: ['loyal', 'brave'],
    deepPersonality: {
      fears: [],
      desires: [],
      hiddenDepths: [],
      worldview: {
        trustInOthers: 50,
        beliefInFate: 50,
        valueOfLife: 70,
        viewOfAuthority: 50,
      },
      emotionalPatterns: {
        angerTriggers: [],
        comfortSources: [],
        copingMechanisms: [],
      },
    },
    combatRole: 'damage',
    armorLevel: 'light',
    combatStyle: 'balanced',
    voiceStyle: 'casual',
    speechQuirks: [],
    catchphrases: [],
    autonomyLevel: 'reactive',
    appearanceTiming: 'contextual',
    originStory: 'stranger',
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CompanionCreatorWizardV2({
  isOpen,
  onClose,
  onCompanionCreated,
  genre = 'fantasy',
  character,
}: CompanionCreatorWizardV2Props) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('identity');
  const [state, setState] = useState<CompanionCreatorStateV2>(getDefaultState());
  const [isCreating, setIsCreating] = useState(false);
  const [voicePreview, setVoicePreview] = useState<string>('');

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);

  // Full randomization
  const handleFullRandomize = useCallback(() => {
    const genderOptions: Gender[] = ['male', 'female', 'other'];
    const randomGender = genderOptions[Math.floor(Math.random() * genderOptions.length)];
    const randomName = generateRandomName(genre, randomGender);
    
    const traitCount = 2 + Math.floor(Math.random() * 2);
    const shuffledTraits = [...PERSONALITY_TRAITS].sort(() => Math.random() - 0.5);
    
    const fearCount = 1 + Math.floor(Math.random() * 2);
    const shuffledFears = [...FEAR_OPTIONS].sort(() => Math.random() - 0.5);
    
    const desireCount = 1 + Math.floor(Math.random() * 2);
    const shuffledDesires = [...DESIRE_OPTIONS].sort(() => Math.random() - 0.5);
    
    const depthCount = Math.random() > 0.5 ? 1 : 0;
    const shuffledDepths = [...HIDDEN_DEPTH_OPTIONS].sort(() => Math.random() - 0.5);
    
    setState({
      name: randomName,
      gender: randomGender,
      age: ADULT_AGES[Math.floor(Math.random() * ADULT_AGES.length)],
      backstory: '',
      traits: shuffledTraits.slice(0, traitCount) as PersonalityTrait[],
      deepPersonality: {
        fears: shuffledFears.slice(0, fearCount).map(f => f.id),
        desires: shuffledDesires.slice(0, desireCount).map(d => d.id),
        hiddenDepths: shuffledDepths.slice(0, depthCount).map(h => h.id),
        worldview: {
          trustInOthers: Math.floor(Math.random() * 100),
          beliefInFate: Math.floor(Math.random() * 100),
          valueOfLife: 30 + Math.floor(Math.random() * 70),
          viewOfAuthority: Math.floor(Math.random() * 100),
        },
        emotionalPatterns: {
          angerTriggers: [],
          comfortSources: [],
          copingMechanisms: [],
        },
      },
      combatRole: COMBAT_ROLES[Math.floor(Math.random() * COMBAT_ROLES.length)].id,
      armorLevel: ['none', 'light', 'medium', 'heavy'][Math.floor(Math.random() * 4)] as any,
      combatStyle: 'balanced',
      voiceStyle: VOICE_STYLES[Math.floor(Math.random() * VOICE_STYLES.length)].id as any,
      speechQuirks: [],
      catchphrases: [],
      autonomyLevel: AUTONOMY_LEVELS[Math.floor(Math.random() * AUTONOMY_LEVELS.length)].id as any,
      appearanceTiming: ['immediately', 'next_scene', 'contextual'][Math.floor(Math.random() * 3)] as any,
      originStory: 'stranger',
    });
    
    toast.success('Companion fully randomized!');
  }, [genre]);

  // Toggle functions
  const toggleTrait = useCallback((trait: PersonalityTrait) => {
    setState(prev => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter(t => t !== trait)
        : prev.traits.length < 5 ? [...prev.traits, trait] : prev.traits,
    }));
  }, []);

  const toggleFear = useCallback((fearId: string) => {
    setState(prev => ({
      ...prev,
      deepPersonality: {
        ...prev.deepPersonality,
        fears: prev.deepPersonality.fears.includes(fearId)
          ? prev.deepPersonality.fears.filter(f => f !== fearId)
          : prev.deepPersonality.fears.length < 3 ? [...prev.deepPersonality.fears, fearId] : prev.deepPersonality.fears,
      },
    }));
  }, []);

  const toggleDesire = useCallback((desireId: string) => {
    setState(prev => ({
      ...prev,
      deepPersonality: {
        ...prev.deepPersonality,
        desires: prev.deepPersonality.desires.includes(desireId)
          ? prev.deepPersonality.desires.filter(d => d !== desireId)
          : prev.deepPersonality.desires.length < 3 ? [...prev.deepPersonality.desires, desireId] : prev.deepPersonality.desires,
      },
    }));
  }, []);

  const toggleHiddenDepth = useCallback((depthId: string) => {
    setState(prev => ({
      ...prev,
      deepPersonality: {
        ...prev.deepPersonality,
        hiddenDepths: prev.deepPersonality.hiddenDepths.includes(depthId)
          ? prev.deepPersonality.hiddenDepths.filter(d => d !== depthId)
          : prev.deepPersonality.hiddenDepths.length < 2 ? [...prev.deepPersonality.hiddenDepths, depthId] : prev.deepPersonality.hiddenDepths,
      },
    }));
  }, []);

  // Navigation validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'identity': return state.name.trim().length >= 2;
      case 'psyche': return state.traits.length >= 1;
      case 'beliefs': return true;
      case 'combat': return true;
      case 'voice': return true;
      case 'preview': return true;
      default: return false;
    }
  }, [currentStep, state]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex + 1].id);
    }
  }, [currentStepIndex]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].id);
    }
  }, [currentStepIndex]);

  // Generate voice preview
  const handleGenerateVoice = useCallback(() => {
    const profile = generateVoiceProfile(
      `preview_${Date.now()}`,
      state.traits,
      { genre }
    );
    const instructions = buildSpeechInstructions(profile, 'neutral', state.name || 'Companion');
    setVoicePreview(instructions);
    toast.success('Voice profile generated!');
  }, [state.traits, state.name, genre]);

  // Create companion
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
      
      // Build rich personality from deep state
      const customPersonality = {
        traits: state.traits,
        values: {
          honor: state.traits.includes('honorable') ? 80 : state.traits.includes('ruthless') ? 20 : 50,
          wealth: state.traits.includes('greedy') ? 90 : state.traits.includes('generous') ? 20 : 50,
          power: state.traits.includes('ambitious') ? 80 : state.traits.includes('humble') ? 20 : 50,
          love: state.traits.includes('romantic') ? 80 : state.traits.includes('pragmatic') ? 30 : 50,
          freedom: state.deepPersonality.desires.includes('freedom') ? 90 : 60,
          justice: state.traits.includes('kind') ? 70 : state.traits.includes('cruel') ? 20 : 50,
          knowledge: state.deepPersonality.desires.includes('knowledge') ? 80 : 50,
          family: state.deepPersonality.desires.includes('belonging') ? 75 : 50,
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
          enabled: state.traits.includes('romantic') || state.deepPersonality.desires.includes('love'),
          preferredGender: 'any' as const,
          attractedToPlayer: state.traits.includes('romantic'),
          romanceThreshold: 70,
        },
        betrayalThreshold: state.traits.includes('loyal') ? -80 : -40,
        departureThreshold: state.traits.includes('loyal') ? -60 : -30,
        speechPattern: state.voiceStyle,
        catchphrases: state.catchphrases.length > 0 ? state.catchphrases : ['I see...', 'Interesting.'],
        quirks: state.speechQuirks,
        hiddenQuirks: state.deepPersonality.hiddenDepths.map(d => 
          HIDDEN_DEPTH_OPTIONS.find(o => o.id === d)?.label || d
        ),
      };
      
      const storyIntroduction = joiningDecision.willJoin 
        ? `${state.backstory || 'A new ally appears.'}\n\n${joiningDecision.dialogueResponse}`
        : joiningDecision.dialogueResponse;
      
      const startingAffinity = Math.floor(firstImpression.score / 2);
      const startingTrust = joiningDecision.willJoin ? 40 + Math.floor(firstImpression.score / 5) : 20;
      
      // Create autonomy state based on settings
      const autonomyState = createDefaultAutonomyState(state.traits);
      autonomyState.level = state.autonomyLevel;
      
      // Generate goals from personality
      const goals = generateCompanionGoals(state.traits);
      
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
        romanticInterest: customPersonality.romanticInterest.enabled ? 20 : 0,
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
          description: `Joined via creator wizard - ${state.autonomyLevel} autonomy`,
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
        hasSecret: state.deepPersonality.hiddenDepths.length > 0,
        secretRevealed: false,
      };
      
      // Register and equip
      companionSystem.registerCompanion(companion);
      companionSystem.recruitCompanion(companion.id);
      
      const startingEquipment = generateRoleBasedEquipment(genre, state.combatRole, 'uncommon');
      if (startingEquipment.weapon) companionEquipmentManager.equip(companionId, startingEquipment.weapon);
      if (startingEquipment.armor) companionEquipmentManager.equip(companionId, startingEquipment.armor);
      
      // Store autonomy and deep personality
      const { compressAndStore } = await import('@/lib/storageCleanup');
      const companionExtras = JSON.parse(localStorage.getItem('companion-extras') || '{}');
      companionExtras[companionId] = {
        autonomy: autonomyState,
        deepPersonality: state.deepPersonality,
        goals,
        voiceStyle: state.voiceStyle,
      };
      compressAndStore('companion-extras', companionExtras);
      
      onCompanionCreated(companion);
      
      if (joiningDecision.willJoin) {
        toast.success(`${identity.displayName} has joined!`, {
          description: `${IMPRESSION_DESCRIPTIONS[firstImpression.level].emoji} ${IMPRESSION_DESCRIPTIONS[firstImpression.level].label}`,
        });
      } else {
        toast.warning(`${identity.displayName} declined.`, {
          description: joiningDecision.alternativeCondition,
        });
      }
      
      setState(getDefaultState());
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
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-3xl h-[90vh] max-h-[90vh] flex flex-col rounded-2xl border border-primary/30 shadow-2xl"
        style={{
          background: 'rgba(15, 15, 25, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/40 shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Create Companion</h2>
              <p className="text-xs text-muted-foreground">Step {currentStepIndex + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStepIndex]?.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleFullRandomize} className="gap-2 bg-background/50 hover:bg-background/80">
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline">Randomize</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/20 hover:text-destructive">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Step Progress - Outside scroll container, explicit pointer events */}
        <div className="flex items-center justify-center gap-1 px-4 py-3 bg-muted/20 border-b border-border/30 relative z-10">
          {WIZARD_STEPS.map((step, idx) => {
            const isAccessible = idx <= currentStepIndex;
            const isCurrent = currentStep === step.id;
            const isCompleted = idx < currentStepIndex;
            
            return (
              <button
                key={step.id}
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && setCurrentStep(step.id)}
                style={{ touchAction: 'manipulation' }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  "touch-manipulation select-none",
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : isCompleted
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : "bg-muted/50 text-muted-foreground opacity-50"
                )}
              >
                {step.icon}
                <span className="hidden md:inline">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content - Scrollable with visible slider */}
        <TouchScrollContainer className="flex-1 min-h-0">
          <div className="p-6 pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
              {/* Identity Step */}
              {currentStep === 'identity' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Who Is This Companion?</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <Label>Name <span className="text-destructive">*</span></Label>
                      <Input
                        value={state.name}
                        onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter their name..."
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Label>Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        value={state.title || ''}
                        onChange={(e) => setState(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="The Brave, Shadow Walker..."
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Gender</Label>
                      <Select 
                        value={state.gender} 
                        onValueChange={(v) => setState(prev => ({ ...prev, gender: v as Gender }))}
                      >
                        <SelectTrigger className="mt-1 bg-background/80">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Non-binary / Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Age</Label>
                      <Select 
                        value={state.age} 
                        onValueChange={(v) => setState(prev => ({ ...prev, age: v }))}
                      >
                        <SelectTrigger className="mt-1 bg-background/80">
                          <SelectValue placeholder="Select age" />
                        </SelectTrigger>
                        <SelectContent>
                          {ADULT_AGES.map(age => (
                            <SelectItem key={age} value={age}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Backstory <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Textarea
                      value={state.backstory}
                      onChange={(e) => setState(prev => ({ ...prev, backstory: e.target.value }))}
                      placeholder="A brief history of this companion..."
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                </div>
              )}

              {/* Psyche Step - Traits, Fears, Desires */}
              {currentStep === 'psyche' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personality Traits</h3>
                    <p className="text-sm text-muted-foreground mb-4">Select 1-5 traits that define their character.</p>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {PERSONALITY_TRAITS.map(trait => (
                        <Button
                          key={trait}
                          variant={state.traits.includes(trait) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleTrait(trait)}
                          className={cn(
                            "capitalize gap-1",
                            state.traits.includes(trait) && "ring-2 ring-primary/50"
                          )}
                        >
                          {TRAIT_ICONS[trait]}
                          {trait}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Core Fears</h3>
                    <p className="text-sm text-muted-foreground mb-4">What haunts them? (Select up to 3)</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {FEAR_OPTIONS.map(fear => (
                        <Button
                          key={fear.id}
                          variant={state.deepPersonality.fears.includes(fear.id) ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => toggleFear(fear.id)}
                          className="gap-2 justify-start"
                        >
                          {fear.icon}
                          {fear.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Deep Desires</h3>
                    <p className="text-sm text-muted-foreground mb-4">What do they truly want? (Select up to 3)</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {DESIRE_OPTIONS.map(desire => (
                        <Button
                          key={desire.id}
                          variant={state.deepPersonality.desires.includes(desire.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleDesire(desire.id)}
                          className="gap-2 justify-start"
                        >
                          {desire.icon}
                          {desire.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Beliefs Step - Worldview, Hidden Depths */}
              {currentStep === 'beliefs' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Worldview</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Trust in Others</Label>
                          <span className="text-xs text-muted-foreground">
                            {state.deepPersonality.worldview.trustInOthers < 30 ? 'Cynical' : 
                             state.deepPersonality.worldview.trustInOthers > 70 ? 'Trusting' : 'Cautious'}
                          </span>
                        </div>
                        <Slider
                          value={[state.deepPersonality.worldview.trustInOthers]}
                          onValueChange={([v]) => setState(prev => ({
                            ...prev,
                            deepPersonality: {
                              ...prev.deepPersonality,
                              worldview: { ...prev.deepPersonality.worldview, trustInOthers: v }
                            }
                          }))}
                          max={100}
                          step={5}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Belief in Fate</Label>
                          <span className="text-xs text-muted-foreground">
                            {state.deepPersonality.worldview.beliefInFate < 30 ? 'Free Will' : 
                             state.deepPersonality.worldview.beliefInFate > 70 ? 'Fatalistic' : 'Balanced'}
                          </span>
                        </div>
                        <Slider
                          value={[state.deepPersonality.worldview.beliefInFate]}
                          onValueChange={([v]) => setState(prev => ({
                            ...prev,
                            deepPersonality: {
                              ...prev.deepPersonality,
                              worldview: { ...prev.deepPersonality.worldview, beliefInFate: v }
                            }
                          }))}
                          max={100}
                          step={5}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>View of Authority</Label>
                          <span className="text-xs text-muted-foreground">
                            {state.deepPersonality.worldview.viewOfAuthority < 30 ? 'Rebellious' : 
                             state.deepPersonality.worldview.viewOfAuthority > 70 ? 'Respectful' : 'Pragmatic'}
                          </span>
                        </div>
                        <Slider
                          value={[state.deepPersonality.worldview.viewOfAuthority]}
                          onValueChange={([v]) => setState(prev => ({
                            ...prev,
                            deepPersonality: {
                              ...prev.deepPersonality,
                              worldview: { ...prev.deepPersonality.worldview, viewOfAuthority: v }
                            }
                          }))}
                          max={100}
                          step={5}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Hidden Depths</h3>
                    <p className="text-sm text-muted-foreground mb-4">Secrets that may be revealed over time. (Select up to 2)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {HIDDEN_DEPTH_OPTIONS.map(depth => (
                        <Button
                          key={depth.id}
                          variant={state.deepPersonality.hiddenDepths.includes(depth.id) ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => toggleHiddenDepth(depth.id)}
                          className="justify-start text-left h-auto py-2"
                        >
                          <Ghost className="w-4 h-4 mr-2 shrink-0" />
                          <span className="truncate">{depth.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Autonomy Level</h3>
                    <p className="text-sm text-muted-foreground mb-3">How independently will they act?</p>
                    <Select 
                      value={state.autonomyLevel} 
                      onValueChange={(v) => setState(prev => ({ ...prev, autonomyLevel: v as any }))}
                    >
                      <SelectTrigger className="bg-background/80">
                        <SelectValue placeholder="Select autonomy level" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTONOMY_LEVELS.map(level => (
                          <SelectItem key={level.id} value={level.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{level.label}</span>
                              <span className="text-xs text-muted-foreground">{level.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Combat Step */}
              {currentStep === 'combat' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Combat Role</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {COMBAT_ROLES.map(role => (
                        <Button
                          key={role.id}
                          variant={state.combatRole === role.id ? 'default' : 'outline'}
                          className="h-auto py-4 flex-col items-center gap-2"
                          onClick={() => setState(prev => ({ ...prev, combatRole: role.id }))}
                        >
                          <div className="p-2 rounded-full bg-muted">{role.icon}</div>
                          <span className="font-semibold">{role.label}</span>
                          <span className="text-xs text-muted-foreground text-center">{role.description}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Armor Level</Label>
                    <Select 
                      value={state.armorLevel} 
                      onValueChange={(v) => setState(prev => ({ ...prev, armorLevel: v as any }))}
                    >
                      <SelectTrigger className="mt-2 bg-background/80">
                        <SelectValue placeholder="Select armor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None - Unarmored</SelectItem>
                        <SelectItem value="light">Light - Leather/Cloth</SelectItem>
                        <SelectItem value="medium">Medium - Chainmail</SelectItem>
                        <SelectItem value="heavy">Heavy - Plate Armor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Voice Step */}
              {currentStep === 'voice' && (
              <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Voice Style</h3>
                    <p className="text-sm text-muted-foreground mb-3">How will this companion speak?</p>
                    <Select 
                      value={state.voiceStyle} 
                      onValueChange={(v) => setState(prev => ({ ...prev, voiceStyle: v as any }))}
                    >
                      <SelectTrigger className="bg-background/80">
                        <SelectValue placeholder="Select voice style" />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICE_STYLES.map(style => (
                          <SelectItem key={style.id} value={style.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{style.label}</span>
                              <span className="text-xs text-muted-foreground">{style.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Voice Preview</Label>
                      <Button variant="outline" size="sm" onClick={handleGenerateVoice} className="gap-1">
                        <Wand2 className="w-3 h-3" /> Generate
                      </Button>
                    </div>
                    {voicePreview ? (
                      <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap max-h-32 overflow-auto">
                        {voicePreview}
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground italic">
                        Click "Generate" to preview how this companion will speak
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Step */}
              {currentStep === 'preview' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <h3 className="text-xl font-bold mb-1">
                      {state.name || 'Unnamed Companion'}
                      {state.title && <span className="text-muted-foreground font-normal ml-2 text-sm">{state.title}</span>}
                    </h3>
                    <p className="text-sm text-muted-foreground">{state.age}, {state.gender}</p>
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {state.traits.map(trait => (
                        <Badge key={trait} variant="secondary" className="capitalize">
                          {TRAIT_ICONS[trait]} {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg border border-border">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Skull className="w-4 h-4 text-destructive" /> Fears
                      </h4>
                      {state.deepPersonality.fears.length > 0 ? (
                        <ul className="space-y-1">
                          {state.deepPersonality.fears.map(f => (
                            <li key={f} className="text-muted-foreground">
                              • {FEAR_OPTIONS.find(o => o.id === f)?.label}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground italic">None selected</p>
                      )}
                    </div>
                    <div className="p-3 rounded-lg border border-border">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-primary" /> Desires
                      </h4>
                      {state.deepPersonality.desires.length > 0 ? (
                        <ul className="space-y-1">
                          {state.deepPersonality.desires.map(d => (
                            <li key={d} className="text-muted-foreground">
                              • {DESIRE_OPTIONS.find(o => o.id === d)?.label}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground italic">None selected</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Combat Role</div>
                      <div className="font-semibold capitalize">{state.combatRole}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Voice</div>
                      <div className="font-semibold capitalize">{state.voiceStyle}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Autonomy</div>
                      <div className="font-semibold capitalize">{state.autonomyLevel}</div>
                    </div>
                  </div>

                  {state.deepPersonality.hiddenDepths.length > 0 && (
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-amber-400">
                        <Ghost className="w-4 h-4" /> Hidden Depths
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {state.deepPersonality.hiddenDepths.map(d => (
                          <li key={d} className="text-muted-foreground">
                            • {HIDDEN_DEPTH_OPTIONS.find(o => o.id === d)?.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          </div>
        </TouchScrollContainer>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-gradient-to-r from-muted/20 via-transparent to-muted/20">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="gap-2 bg-background/50 hover:bg-background/80"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          {currentStep === 'preview' ? (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !state.name.trim()}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/30"
            >
              {isCreating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                <><Check className="w-4 h-4" /> Create Companion</>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="gap-2 shadow-lg"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CompanionCreatorWizardV2;
