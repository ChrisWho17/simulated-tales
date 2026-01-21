// ============================================================================
// COMPANION CHEAT PANEL - Dedicated debug panel for companion manipulation
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, X, Heart, Shield, Brain, Sword, Zap, Star, Sparkles,
  Plus, Trash2, Edit3, RefreshCw, Crown, Eye, Volume2,
  ChevronDown, ChevronUp, Save, AlertTriangle, Skull, Activity,
  MessageSquare, HeartPulse, Target, Flame, Clock, Infinity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  companionSystem,
  CompanionState,
  CompanionMood,
  CompanionStatus,
  PersonalityTrait,
} from '@/game/companionSystem';
import { generateVoiceProfile, buildSpeechInstructions, getQuickSpeechSummary } from '@/game/randomizedSpeechSystem';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { StateSyncBus } from '@/services/stateSyncBus';

// ============================================================================
// TYPES
// ============================================================================

interface CompanionCheatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  genre?: string;
}

const PERSONALITY_TRAITS: PersonalityTrait[] = [
  'honorable', 'ruthless', 'kind', 'cruel', 'brave', 'cowardly',
  'greedy', 'generous', 'loyal', 'treacherous', 'romantic', 'pragmatic',
  'spiritual', 'skeptical', 'vengeful', 'forgiving', 'ambitious', 'humble'
];

const MOOD_OPTIONS: CompanionMood[] = [
  'joyful', 'content', 'neutral', 'annoyed', 'angry', 
  'sad', 'fearful', 'disgusted', 'romantic', 'betrayed'
];

const STATUS_OPTIONS: CompanionStatus[] = [
  'active', 'waiting', 'left', 'hostile', 'dead', 'romance', 'rejected'
];

const MOOD_COLORS: Record<CompanionMood, string> = {
  joyful: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  content: 'bg-green-500/20 text-green-400 border-green-500/30',
  neutral: 'bg-muted text-muted-foreground border-border',
  annoyed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  angry: 'bg-red-500/20 text-red-400 border-red-500/30',
  sad: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fearful: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  disgusted: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  romantic: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  betrayed: 'bg-red-600/20 text-red-300 border-red-600/30',
};

const MOOD_EMOJIS: Record<CompanionMood, string> = {
  joyful: '😊', content: '🙂', neutral: '😐', annoyed: '😤',
  angry: '😠', sad: '😢', fearful: '😰', disgusted: '😒',
  romantic: '💕', betrayed: '💔',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CompanionCheatPanel({ isOpen, onClose, genre = 'fantasy' }: CompanionCheatPanelProps) {
  const [companions, setCompanions] = useState<CompanionState[]>([]);
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionState | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'spawn' | 'voice'>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    stats: true,
    personality: false,
    memory: false,
    autonomy: false,
  });
  
  // Spawn state
  const [spawnName, setSpawnName] = useState('');
  const [spawnTraits, setSpawnTraits] = useState<PersonalityTrait[]>(['loyal', 'brave']);
  
  // Voice preview
  const [voicePreview, setVoicePreview] = useState<string>('');
  
  // Load companions
  const refreshCompanions = useCallback(() => {
    setCompanions(companionSystem.getAllCompanions());
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      refreshCompanions();
    }
  }, [isOpen, refreshCompanions]);
  
  // Persist changes
  const persistChanges = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANION_STATE, JSON.stringify(companionSystem.serialize()));
      StateSyncBus.emit('player:state-changed', { changes: { companions: 'updated' } }, 'companion-cheat-panel');
      toast.success('Changes saved!');
    } catch (e) {
      toast.error('Failed to save changes');
    }
  }, []);
  
  // ============================================================================
  // CHEAT ACTIONS
  // ============================================================================
  
  const setMaxAffinity = (companion: CompanionState) => {
    const updated = { ...companion, affinity: 100, trust: 100, respect: 100 };
    companionSystem.registerCompanion(updated);
    refreshCompanions();
    setSelectedCompanion(updated);
    persistChanges();
    toast.success(`${companion.name} now loves you!`);
  };
  
  const setMinAffinity = (companion: CompanionState) => {
    const updated = { ...companion, affinity: -100, trust: 0, respect: 0 };
    companionSystem.registerCompanion(updated);
    refreshCompanions();
    setSelectedCompanion(updated);
    persistChanges();
    toast.success(`${companion.name} now hates you!`);
  };
  
  const maxRomance = (companion: CompanionState) => {
    const updated = { 
      ...companion, 
      romanticInterest: 100, 
      affinity: Math.max(companion.affinity, 80),
      mood: 'romantic' as CompanionMood,
      status: 'romance' as CompanionStatus,
    };
    companionSystem.registerCompanion(updated);
    refreshCompanions();
    setSelectedCompanion(updated);
    persistChanges();
    toast.success(`${companion.name} is now in love with you! 💕`);
  };
  
  const resurrectCompanion = (companion: CompanionState) => {
    const updated = { ...companion, status: 'active' as CompanionStatus };
    companionSystem.registerCompanion(updated);
    refreshCompanions();
    setSelectedCompanion(updated);
    persistChanges();
    toast.success(`${companion.name} has risen from the dead!`);
  };
  
  const killCompanion = (companion: CompanionState) => {
    const updated = { ...companion, status: 'dead' as CompanionStatus };
    companionSystem.registerCompanion(updated);
    refreshCompanions();
    setSelectedCompanion(updated);
    persistChanges();
    toast.error(`${companion.name} has been slain.`);
  };
  
  const makeHostile = (companion: CompanionState) => {
    const updated = { 
      ...companion, 
      status: 'hostile' as CompanionStatus,
      affinity: -80,
      mood: 'betrayed' as CompanionMood,
    };
    companionSystem.registerCompanion(updated);
    refreshCompanions();
    setSelectedCompanion(updated);
    persistChanges();
    toast.error(`${companion.name} has turned against you!`);
  };
  
  const revealAllSecrets = (companion: CompanionState) => {
    const updated = { 
      ...companion, 
      secretRevealed: true,
      quirkDiscovery: {
        ...companion.quirkDiscovery,
        discoveredQuirks: companion.personality.hiddenQuirks || [],
      },
    };
    companionSystem.registerCompanion(updated);
    refreshCompanions();
    setSelectedCompanion(updated);
    persistChanges();
    toast.success(`All of ${companion.name}'s secrets revealed!`);
  };
  
  const updateCompanionStat = (key: keyof CompanionState, value: any) => {
    if (!selectedCompanion) return;
    const updated = { ...selectedCompanion, [key]: value };
    companionSystem.registerCompanion(updated);
    refreshCompanions();
    setSelectedCompanion(updated);
  };
  
  const toggleTrait = (trait: PersonalityTrait) => {
    if (!selectedCompanion) return;
    const currentTraits = selectedCompanion.personality.traits;
    const newTraits = currentTraits.includes(trait)
      ? currentTraits.filter(t => t !== trait)
      : [...currentTraits, trait].slice(0, 5);
    
    const updated = {
      ...selectedCompanion,
      personality: { ...selectedCompanion.personality, traits: newTraits },
    };
    companionSystem.registerCompanion(updated);
    refreshCompanions();
    setSelectedCompanion(updated);
  };
  
  const spawnCompanion = () => {
    if (!spawnName.trim()) {
      toast.error('Enter a name first');
      return;
    }
    
    const companionId = `cheat_companion_${Date.now()}`;
    const companion: CompanionState = {
      id: companionId,
      name: spawnName.trim(),
      status: 'active',
      mood: 'content',
      moodIntensity: 60,
      affinity: 50,
      trust: 50,
      respect: 50,
      fear: 0,
      romanticInterest: spawnTraits.includes('romantic') ? 30 : 0,
      personality: {
        traits: spawnTraits,
        values: { honor: 50, wealth: 50, power: 50, love: 50, freedom: 50, justice: 50, knowledge: 50, family: 50 },
        approves: ['loyalty', 'bravery'],
        disapproves: ['cowardice', 'betrayal'],
        romanticInterest: { enabled: spawnTraits.includes('romantic'), preferredGender: 'any', attractedToPlayer: false, romanceThreshold: 70 },
        betrayalThreshold: -50,
        departureThreshold: -30,
        speechPattern: 'casual, friendly',
        catchphrases: ['Indeed.', 'I see.'],
        quirks: [],
        hiddenQuirks: ['secretly collects trinkets'],
      },
      quirkDiscovery: { discoveredQuirks: [], lastDiscoveryCheck: Date.now() },
      conversationMemory: { companionId, sharedTopics: [], askedTopics: [], lastAskedAt: 0, conversationDepth: 0 },
      memories: [{ timestamp: Date.now(), type: 'event', description: 'Spawned via cheat menu', affinityChange: 0, forgotten: false }],
      internalThoughts: 'I was created by debug magic.',
      wantsToSpeak: true,
      combatRole: 'damage',
      skills: ['basic_attack'],
      equipment: [],
      joinedAt: Date.now(),
      lastSpoke: 0,
      confessedLove: false,
      wasBetrayed: false,
      hasSecret: true,
      secretRevealed: false,
    };
    
    companionSystem.registerCompanion(companion);
    companionSystem.recruitCompanion(companion.id);
    refreshCompanions();
    setSpawnName('');
    persistChanges();
    toast.success(`${companion.name} spawned!`);
  };
  
  const generateVoice = () => {
    if (!selectedCompanion) return;
    const profile = generateVoiceProfile(
      selectedCompanion.id,
      selectedCompanion.personality.traits,
      { genre }
    );
    const instructions = buildSpeechInstructions(profile, selectedCompanion.mood, selectedCompanion.name);
    setVoicePreview(instructions);
    setActiveTab('voice');
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[90vh] bg-card border-2 border-amber-500/30 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                Companion Debug Panel
              </h2>
              <p className="text-xs text-muted-foreground">Full control over companion states</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshCompanions} className="gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Companion List Sidebar */}
          <div className="w-64 border-r border-border bg-muted/20 flex flex-col">
            <div className="p-3 border-b border-border">
              <h3 className="font-medium text-sm mb-2">Companions ({companions.length})</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {companions.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCompanion(c); setActiveTab('edit'); }}
                    className={cn(
                      "w-full p-2 rounded-lg text-left transition-all",
                      selectedCompanion?.id === c.id
                        ? "bg-primary/20 border border-primary/30"
                        : "hover:bg-muted border border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{c.name}</span>
                      <span className="text-xs">{MOOD_EMOJIS[c.mood]}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1">
                        {c.status}
                      </Badge>
                      <span className={cn("text-[10px]", c.affinity > 0 ? "text-green-400" : c.affinity < 0 ? "text-red-400" : "text-muted-foreground")}>
                        {c.affinity > 0 ? '+' : ''}{c.affinity}
                      </span>
                    </div>
                  </button>
                ))}
                {companions.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No companions</p>
                )}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-1"
                onClick={() => setActiveTab('spawn')}
              >
                <Plus className="w-3 h-3" /> Spawn New
              </Button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-3 justify-start">
                <TabsTrigger value="overview" className="gap-1"><Activity className="w-3 h-3" /> Overview</TabsTrigger>
                <TabsTrigger value="edit" disabled={!selectedCompanion} className="gap-1"><Edit3 className="w-3 h-3" /> Edit</TabsTrigger>
                <TabsTrigger value="spawn" className="gap-1"><Plus className="w-3 h-3" /> Spawn</TabsTrigger>
                <TabsTrigger value="voice" disabled={!selectedCompanion} className="gap-1"><Volume2 className="w-3 h-3" /> Voice</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 p-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border bg-muted/20">
                      <h4 className="font-medium text-sm mb-2">Quick Stats</h4>
                      <div className="space-y-1 text-sm">
                        <p>Total: {companions.length}</p>
                        <p>Active: {companions.filter(c => c.status === 'active').length}</p>
                        <p>Dead: {companions.filter(c => c.status === 'dead').length}</p>
                        <p>Hostile: {companions.filter(c => c.status === 'hostile').length}</p>
                        <p>In Romance: {companions.filter(c => c.status === 'romance').length}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-border bg-muted/20">
                      <h4 className="font-medium text-sm mb-2">Bulk Actions</h4>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            companions.forEach(c => {
                              companionSystem.registerCompanion({ ...c, affinity: 100, trust: 100 });
                            });
                            refreshCompanions();
                            persistChanges();
                            toast.success('All companions now love you!');
                          }}
                        >
                          <Heart className="w-3 h-3 text-pink-400" /> Max All Affinity
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            companions.filter(c => c.status === 'dead').forEach(c => {
                              companionSystem.registerCompanion({ ...c, status: 'active' });
                            });
                            refreshCompanions();
                            persistChanges();
                            toast.success('All companions resurrected!');
                          }}
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" /> Resurrect All Dead
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start gap-2 text-red-400 hover:text-red-300"
                          onClick={() => {
                            companions.forEach(c => {
                              companionSystem.dismissCompanion(c.id, 'player');
                            });
                            refreshCompanions();
                            persistChanges();
                            toast.success('All companions removed!');
                          }}
                        >
                          <Trash2 className="w-3 h-3" /> Remove All
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Active companions grid */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Active Companions</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {companions.filter(c => c.status === 'active').map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCompanion(c); setActiveTab('edit'); }}
                          className="p-3 rounded-lg border border-border hover:border-primary/50 bg-muted/20 text-left transition-all"
                        >
                          <div className="font-medium text-sm truncate">{c.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={cn("text-[10px]", MOOD_COLORS[c.mood])}>{c.mood}</Badge>
                            <span className="text-[10px] text-muted-foreground">❤️{c.affinity}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Edit Tab */}
                <TabsContent value="edit" className="mt-0">
                  {selectedCompanion ? (
                    <div className="space-y-4">
                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setMaxAffinity(selectedCompanion)} className="gap-1">
                          <Heart className="w-3 h-3 text-pink-400" /> Max Love
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setMinAffinity(selectedCompanion)} className="gap-1">
                          <Skull className="w-3 h-3 text-red-400" /> Max Hate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => maxRomance(selectedCompanion)} className="gap-1">
                          <HeartPulse className="w-3 h-3 text-pink-400" /> Romance
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => revealAllSecrets(selectedCompanion)} className="gap-1">
                          <Eye className="w-3 h-3" /> Reveal Secrets
                        </Button>
                        <Button size="sm" variant="outline" onClick={generateVoice} className="gap-1">
                          <Volume2 className="w-3 h-3" /> Gen Voice
                        </Button>
                        {selectedCompanion.status === 'dead' ? (
                          <Button size="sm" variant="outline" onClick={() => resurrectCompanion(selectedCompanion)} className="gap-1 text-green-400">
                            <Sparkles className="w-3 h-3" /> Resurrect
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => killCompanion(selectedCompanion)} className="gap-1 text-red-400">
                            <Skull className="w-3 h-3" /> Kill
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => makeHostile(selectedCompanion)} className="gap-1 text-orange-400">
                          <AlertTriangle className="w-3 h-3" /> Make Hostile
                        </Button>
                      </div>
                      
                      {/* Stats Section */}
                      <div className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSection('stats')}
                          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50"
                        >
                          <span className="font-medium text-sm">Stats & Status</span>
                          {expandedSections.stats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.stats && (
                          <div className="p-4 space-y-4">
                            {/* Status & Mood */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs">Status</Label>
                                <Select 
                                  value={selectedCompanion.status} 
                                  onValueChange={(v) => updateCompanionStat('status', v)}
                                >
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Mood</Label>
                                <Select 
                                  value={selectedCompanion.mood} 
                                  onValueChange={(v) => updateCompanionStat('mood', v)}
                                >
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {MOOD_OPTIONS.map(m => <SelectItem key={m} value={m}>{MOOD_EMOJIS[m]} {m}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            {/* Relationship Stats */}
                            <div className="space-y-3">
                              <StatSlider 
                                label="Affinity" 
                                value={selectedCompanion.affinity} 
                                min={-100} max={100}
                                onChange={(v) => updateCompanionStat('affinity', v)}
                                colorPositive="bg-green-500"
                                colorNegative="bg-red-500"
                              />
                              <StatSlider 
                                label="Trust" 
                                value={selectedCompanion.trust} 
                                min={0} max={100}
                                onChange={(v) => updateCompanionStat('trust', v)}
                              />
                              <StatSlider 
                                label="Respect" 
                                value={selectedCompanion.respect} 
                                min={0} max={100}
                                onChange={(v) => updateCompanionStat('respect', v)}
                              />
                              <StatSlider 
                                label="Fear" 
                                value={selectedCompanion.fear} 
                                min={0} max={100}
                                onChange={(v) => updateCompanionStat('fear', v)}
                                colorPositive="bg-purple-500"
                              />
                              <StatSlider 
                                label="Romance Interest" 
                                value={selectedCompanion.romanticInterest} 
                                min={0} max={100}
                                onChange={(v) => updateCompanionStat('romanticInterest', v)}
                                colorPositive="bg-pink-500"
                              />
                            </div>
                            
                            {/* Flags */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center justify-between p-2 rounded border border-border">
                                <span className="text-sm">Confessed Love</span>
                                <Switch 
                                  checked={selectedCompanion.confessedLove}
                                  onCheckedChange={(v) => updateCompanionStat('confessedLove', v)}
                                />
                              </div>
                              <div className="flex items-center justify-between p-2 rounded border border-border">
                                <span className="text-sm">Was Betrayed</span>
                                <Switch 
                                  checked={selectedCompanion.wasBetrayed}
                                  onCheckedChange={(v) => updateCompanionStat('wasBetrayed', v)}
                                />
                              </div>
                              <div className="flex items-center justify-between p-2 rounded border border-border">
                                <span className="text-sm">Has Secret</span>
                                <Switch 
                                  checked={selectedCompanion.hasSecret}
                                  onCheckedChange={(v) => updateCompanionStat('hasSecret', v)}
                                />
                              </div>
                              <div className="flex items-center justify-between p-2 rounded border border-border">
                                <span className="text-sm">Secret Revealed</span>
                                <Switch 
                                  checked={selectedCompanion.secretRevealed}
                                  onCheckedChange={(v) => updateCompanionStat('secretRevealed', v)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Personality Section */}
                      <div className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSection('personality')}
                          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50"
                        >
                          <span className="font-medium text-sm">Personality Traits</span>
                          {expandedSections.personality ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.personality && (
                          <div className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {PERSONALITY_TRAITS.map(trait => (
                                <Badge
                                  key={trait}
                                  variant={selectedCompanion.personality.traits.includes(trait) ? "default" : "outline"}
                                  className="cursor-pointer capitalize"
                                  onClick={() => toggleTrait(trait)}
                                >
                                  {trait}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Memory Section */}
                      <div className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSection('memory')}
                          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50"
                        >
                          <span className="font-medium text-sm">Memories ({selectedCompanion.memories.length})</span>
                          {expandedSections.memory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {expandedSections.memory && (
                          <div className="p-4 space-y-2 max-h-40 overflow-y-auto">
                            {selectedCompanion.memories.slice(-10).reverse().map((m, i) => (
                              <div key={i} className="text-xs p-2 rounded bg-muted/30 border border-border">
                                <span className={m.affinityChange > 0 ? 'text-green-400' : m.affinityChange < 0 ? 'text-red-400' : 'text-muted-foreground'}>
                                  {m.affinityChange > 0 ? '+' : ''}{m.affinityChange}
                                </span>
                                {' '}{m.description}
                              </div>
                            ))}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-xs"
                              onClick={() => {
                                updateCompanionStat('memories', []);
                                toast.success('Memories cleared!');
                              }}
                            >
                              Clear All Memories
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Save Button */}
                      <Button className="w-full gap-2" onClick={persistChanges}>
                        <Save className="w-4 h-4" /> Save All Changes
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a companion from the sidebar
                    </div>
                  )}
                </TabsContent>
                
                {/* Spawn Tab */}
                <TabsContent value="spawn" className="mt-0">
                  <div className="space-y-4">
                    <div>
                      <Label>Companion Name</Label>
                      <Input 
                        value={spawnName}
                        onChange={(e) => setSpawnName(e.target.value)}
                        placeholder="Enter name..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Personality Traits ({spawnTraits.length}/5)</Label>
                      <div className="flex flex-wrap gap-2">
                        {PERSONALITY_TRAITS.map(trait => (
                          <Badge
                            key={trait}
                            variant={spawnTraits.includes(trait) ? "default" : "outline"}
                            className="cursor-pointer capitalize"
                            onClick={() => {
                              if (spawnTraits.includes(trait)) {
                                setSpawnTraits(spawnTraits.filter(t => t !== trait));
                              } else if (spawnTraits.length < 5) {
                                setSpawnTraits([...spawnTraits, trait]);
                              }
                            }}
                          >
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full gap-2" onClick={spawnCompanion}>
                      <Plus className="w-4 h-4" /> Spawn Companion
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Voice Tab */}
                <TabsContent value="voice" className="mt-0">
                  {selectedCompanion && voicePreview ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Voice Profile: {selectedCompanion.name}</h4>
                        <Button size="sm" variant="outline" onClick={generateVoice} className="gap-1">
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </Button>
                      </div>
                      <pre className="text-xs p-4 rounded-lg bg-muted/30 border border-border overflow-auto max-h-96 whitespace-pre-wrap">
                        {voicePreview}
                      </pre>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm text-amber-400">
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          This voice profile is used by the AI to generate dialogue for this companion.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a companion and click "Gen Voice" to preview their voice profile
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface StatSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  colorPositive?: string;
  colorNegative?: string;
}

function StatSlider({ label, value, min, max, onChange, colorPositive = 'bg-primary', colorNegative = 'bg-red-500' }: StatSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const isNegativeCapable = min < 0;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className={value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-muted-foreground'}>
          {value > 0 && '+'}{value}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={1}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))}
          className="w-16 h-7 text-xs text-center"
        />
      </div>
    </div>
  );
}

export default CompanionCheatPanel;
