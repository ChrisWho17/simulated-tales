// ============================================================================
// ADVENTURE MODALS - Extracted modal rendering from AdventureDisplay
// ============================================================================

import { GameGenre } from '@/types/genreData';
import { RPGCharacter, DiceRoll } from '@/types/rpgCharacter';
import { CoreMoodType, MoodLogEntry } from '@/game/moodSystem';
import { WeatherState, WeatherType, WEATHER_CONFIGS, getWeatherTransitionOpacity, generateWeatherForecast, tickWeather } from '@/game/weatherSystem';
import { GameTimeState, TimeSkipConsequence, TIME_MULTIPLIER_CONFIG, hoursToWeatherTicks } from '@/game/timeProgressionSystem';
import { QuestLog } from '@/game/questSystem';
import { ModifierState } from '@/game/buffDebuffSystem';
import { DiceRollResult } from '@/game/diceSystem';
import { LevelUpChoice, LevelingState } from '@/game/levelingSystem';
import { GameModalsState, GameModalsActions } from '@/hooks/useGameModals';
import { GameSave } from '@/lib/saveSystem';
import { DevPanelMode } from '@/components/debug/CheatModeSplash';
import { StoryEntry } from './types';
import { useToast } from '@/hooks/use-toast';

// Modal Components
import { CharacterSheet } from './CharacterSheet';
import { SettingsPanel } from '@/components/game/SettingsPanel';
import { BookmarksSidebar } from '@/components/ui/BookmarksSidebar';
import { StoryRollbackModal } from './StoryRollbackModal';
import { LevelUpModal } from './LevelUpModal';
import { CheatModeSplash } from '@/components/debug/CheatModeSplash';
import { SessionRecapSplash } from '@/components/game/SessionRecapSplash';
import { QuickDiceRoll } from '@/components/game/QuickDiceRoll';
import { RelationshipsQuickView } from '@/components/game/RelationshipsQuickView';
import { TimeDisplay } from '@/components/game/TimeDisplay';
import { TimeSkipModal } from '@/components/game/TimeSkipModal';
import { QuestQuickView } from '@/components/game/QuestQuickView';
import { MobileQuickMenu } from '@/components/game/MobileQuickMenu';
import { RadialQuickMenu } from '@/components/game/RadialQuickMenu';
import { AmbientFeedModal } from '@/components/game/AmbientFeedModal';
import { CompanionPanel } from '@/components/game/CompanionPanel';
import { InventoryScreen } from '@/game/inventorySystem';
import { DiceRollModal } from './DiceRollModal';
import { DiceRollDisplay } from '@/components/game/DiceRollDisplay';
import { OnboardingOverlay } from '@/components/game/OnboardingOverlay';
import { CompanionStoryEventsContainer } from '@/components/game/CompanionStoryEvents';
import { CompanionQuickView, CompanionWarningToast } from '@/components/companion';
import { ConsequenceFeed } from '@/components/game/ConsequenceFeed';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeatherModalParticles } from '@/components/ui/weather-modal-particles';
import { Heart, Sun, Cloud, CloudRain, CloudLightning, CloudFog, Wind, Snowflake, Flame, Timer, AlertTriangle } from 'lucide-react';
import { AdrenalineSystemState } from '@/game/adrenalineCombatIntegration';
import { AmbientEntry } from '@/hooks/useAmbientFeed';
import { useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface NPCMapEntry {
  id?: string;
  name: string;
  occupation?: string;
  trust?: number;
  respect?: number;
  romance?: number;
  romanceUnlocked?: boolean;
  portraitUrl?: string;
}

interface GameMechanics {
  rollRequired?: {
    stat: string;
    difficulty: number;
    reason: string;
  };
}

export interface AdventureModalsProps {
  // Modal state from useGameModals hook
  modals: GameModalsState;
  modalActions: GameModalsActions;
  
  // Character data
  character: RPGCharacter;
  onUpdateCharacter: (character: RPGCharacter) => void;
  genre: GameGenre;
  
  // Mood
  currentMood: CoreMoodType;
  moodHistory: MoodLogEntry[];
  onMoodChange?: (mood: CoreMoodType) => void;
  
  // Weather & Time
  weatherState: WeatherState;
  onWeatherStateChange: (state: WeatherState) => void;
  timeState: GameTimeState;
  onTimeStateChange: (state: GameTimeState) => void;
  
  // Modifiers
  getModifierState: () => ModifierState | null;
  
  // Dice roll
  currentDiceRoll: DiceRollResult | null;
  onDiceRollClose: () => void;
  pendingMechanics?: GameMechanics;
  onClearMechanics: () => void;
  // Legacy dice roll uses DiceRoll, new system uses DiceRollResult
  onLegacyDiceRollComplete: (roll: DiceRoll) => void;
  
  // Leveling
  showLevelUpModal: boolean;
  levelUpChoices: LevelUpChoice[];
  levelingState: LevelingState;
  onLevelUpChoice: (choice: LevelUpChoice) => void;
  
  // Rollback
  rollbackTarget: { index: number; text: string } | null;
  onRollbackConfirm: () => void;
  onRollbackCancel: () => void;
  
  // Settings
  onManualSave: () => Promise<void>;
  onLoadSave: (save: GameSave) => void;
  
  // Story data
  story: StoryEntry[];
  campaignId: string;
  scrollRef: React.RefObject<HTMLDivElement>;
  
  // Quests
  questLog: QuestLog;
  
  // NPCs
  npcNameMap: Record<string, NPCMapEntry>;
  
  // Adrenaline
  adrenalineState?: AdrenalineSystemState;
  
  // Ambient feed
  ambientEntries: AmbientEntry[];
  onClearAmbientFeed: () => void;
  
  // Cheat mode
  cheatModeIsOpen: boolean;
  cheatModeInitialMode: DevPanelMode;
  onCheatModeClose: () => void;
  
  // Check self
  checkSelfThoroughness: 'quick' | 'careful' | 'thorough';
  setCheckSelfThoroughness: (t: 'quick' | 'careful' | 'thorough') => void;
  onCheckSelf: () => void;
  
  // Onboarding
  showOnboarding: boolean;
  onCompleteOnboarding: () => void;
  
  // Player action
  onPlayerAction: (action: string) => void;
  onRestart: () => void;
  
  // Game context settings
  showConsequenceFeed: boolean;
  
  // Systems test
  onRunSystemsTest?: (testConfig: any, scenario: any) => Promise<void>;
  isLoading: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AdventureModals({
  modals,
  modalActions,
  character,
  onUpdateCharacter,
  genre,
  currentMood,
  moodHistory,
  onMoodChange,
  weatherState,
  onWeatherStateChange,
  timeState,
  onTimeStateChange,
  getModifierState,
  currentDiceRoll,
  onDiceRollClose,
  pendingMechanics,
  onClearMechanics,
  onLegacyDiceRollComplete,
  showLevelUpModal,
  levelUpChoices,
  levelingState,
  onLevelUpChoice,
  rollbackTarget,
  onRollbackConfirm,
  onRollbackCancel,
  onManualSave,
  onLoadSave,
  story,
  campaignId,
  scrollRef,
  questLog,
  npcNameMap,
  adrenalineState,
  ambientEntries,
  onClearAmbientFeed,
  cheatModeIsOpen,
  cheatModeInitialMode,
  onCheatModeClose,
  checkSelfThoroughness,
  setCheckSelfThoroughness,
  onCheckSelf,
  showOnboarding,
  onCompleteOnboarding,
  onPlayerAction,
  onRestart,
  showConsequenceFeed,
  onRunSystemsTest,
  isLoading,
}: AdventureModalsProps) {
  const { toast } = useToast();
  const weatherTickRef = useRef(0);

  // Helper for bookmark navigation
  const handleJumpToEntry = (entryId: string, entryIndex: number) => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    
    const entries = viewport.querySelectorAll('[data-story-index]');
    const targetEntry = Array.from(entries).find(
      el => el.getAttribute('data-story-index') === String(entryIndex)
    ) as HTMLElement;
    if (targetEntry) {
      targetEntry.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEntry.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        targetEntry.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  };

  // Time skip handler
  const handleTimeSkip = (newState: GameTimeState, consequences: TimeSkipConsequence[]) => {
    onTimeStateChange(newState);
    // Advance weather based on hours skipped
    const hoursDiff = Math.floor((newState.totalMinutes - timeState.totalMinutes) / 60);
    const weatherTicks = hoursToWeatherTicks(hoursDiff);
    let currentWeather = weatherState;
    for (let i = 0; i < weatherTicks; i++) {
      currentWeather = tickWeather(currentWeather, weatherTickRef.current + i);
    }
    onWeatherStateChange(currentWeather);
    weatherTickRef.current += weatherTicks;
    
    // Show consequences as toasts
    consequences.forEach(c => {
      toast({
        title: c.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: c.description,
        duration: 4000,
      });
    });
  };

  return (
    <>
      {/* Dice Roll Display */}
      {modals.quickDiceRoll && currentDiceRoll && (
        <DiceRollDisplay
          roll={currentDiceRoll}
          onClose={onDiceRollClose}
          autoClose={true}
          autoCloseDelay={3500}
        />
      )}

      {/* Legacy Dice Roll Modal */}
      {modals.quickDiceRoll && !currentDiceRoll && pendingMechanics?.rollRequired && (
        <DiceRollModal
          stat={pendingMechanics.rollRequired.stat as any}
          difficulty={pendingMechanics.rollRequired.difficulty}
          reason={pendingMechanics.rollRequired.reason}
          characterStats={character.stats}
          onRoll={onLegacyDiceRollComplete}
          onCancel={() => {
            modalActions.close('quickDiceRoll');
            onClearMechanics();
          }}
        />
      )}

      {/* Character Sheet Modal */}
      {modals.characterSheet && (
        <CharacterSheet
          character={character}
          onClose={() => modalActions.close('characterSheet')}
          onUpdateCharacter={onUpdateCharacter}
          modifierState={getModifierState()}
          moodState={{ currentMood, moodIntensity: 0.6, moodHistory, lastChangeTimestamp: Date.now() }}
          genre={genre}
          onMoodChange={onMoodChange}
          weatherState={weatherState}
          activeConditions={getModifierState()?.activeModifiers.map(m => m.name) || []}
          hasBloodLoss={adrenalineState?.hiddenDamage?.revealedWounds?.some(w => (w.bleedRate || 0) > 0) || false}
        />
      )}

      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={modals.settings} 
        onClose={() => modalActions.close('settings')}
        onManualSave={onManualSave}
        onLoadSave={onLoadSave}
        currentCharacterName={character.name}
        currentTimeMultiplier={timeState.multiplier}
        onTimeMultiplierChange={(multiplier) => {
          onTimeStateChange({ ...timeState, multiplier });
          toast({
            title: "Time Pace Changed",
            description: `Each action now advances ${TIME_MULTIPLIER_CONFIG[multiplier].label.toLowerCase()} of game time.`,
          });
        }}
        currentGenre={genre}
        onRunSystemsTest={onRunSystemsTest}
        isRunningTest={isLoading}
      />

      {/* Bookmarks Sidebar */}
      <BookmarksSidebar
        campaignId={campaignId}
        open={modals.bookmarks}
        onOpenChange={(open) => open ? modalActions.open('bookmarks') : modalActions.close('bookmarks')}
        trigger={<></>}
        onJumpToEntry={handleJumpToEntry}
      />

      {/* Story Rollback Modal */}
      <StoryRollbackModal
        isOpen={!!rollbackTarget}
        previewText={rollbackTarget?.text || ''}
        onConfirm={onRollbackConfirm}
        onCancel={onRollbackCancel}
      />

      {/* Level-Up Modal */}
      <LevelUpModal
        isOpen={showLevelUpModal}
        choices={levelUpChoices}
        currentLevel={character.level}
        isChapterReward={levelingState.levelUpType === 'chapter_reward'}
        characterName={character.name}
        onSelectChoice={onLevelUpChoice}
      />

      {/* Cheat Mode / Developer Panel */}
      <CheatModeSplash
        isOpen={cheatModeIsOpen}
        onClose={onCheatModeClose}
        character={character}
        onUpdateCharacter={onUpdateCharacter}
        genre={genre}
        initialMode={cheatModeInitialMode}
      />

      {/* Consequence Feed */}
      {showConsequenceFeed && <ConsequenceFeed compact={false} />}

      {/* Check Self Modal */}
      {modals.checkSelfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-primary/20">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Assess Yourself</h2>
                <p className="text-sm text-muted-foreground">Check for hidden injuries</p>
              </div>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Take a moment to check your body for wounds you might not have noticed in the heat of the moment.
            </p>
            
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium">Thoroughness</label>
              <div className="flex gap-2">
                <Button
                  variant={checkSelfThoroughness === 'quick' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCheckSelfThoroughness('quick')}
                  className="flex-1"
                >
                  Quick
                </Button>
                <Button
                  variant={checkSelfThoroughness === 'careful' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCheckSelfThoroughness('careful')}
                  className="flex-1"
                >
                  Careful
                </Button>
                <Button
                  variant={checkSelfThoroughness === 'thorough' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCheckSelfThoroughness('thorough')}
                  className="flex-1"
                >
                  Thorough
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {checkSelfThoroughness === 'quick' && 'Fast check, may miss some injuries'}
                {checkSelfThoroughness === 'careful' && 'Balanced check, good chance to find injuries'}
                {checkSelfThoroughness === 'thorough' && 'Slow and methodical, high chance to find everything'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => modalActions.close('checkSelfModal')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={onCheckSelf}
                className="flex-1"
              >
                Check Self
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Tip: Type <code className="bg-muted px-1 rounded">/checkself</code> or <code className="bg-muted px-1 rounded">/checkself thorough</code>
            </p>
          </div>
        </div>
      )}

      {/* Weather Modal */}
      {modals.weatherModal && (
        <WeatherModal
          weatherState={weatherState}
          onClose={() => modalActions.close('weatherModal')}
        />
      )}

      {/* Inventory Screen Modal */}
      <InventoryScreen 
        isOpen={modals.inventory} 
        onClose={() => modalActions.close('inventory')} 
        availableMods={[]} 
      />

      {/* Session Recap Splash */}
      <SessionRecapSplash
        isOpen={modals.sessionRecap}
        onClose={() => modalActions.close('sessionRecap')}
        storyEntries={story}
        characterName={character.name}
        currentLocation={
          story.filter(e => e.role === 'narrator').slice(-1)[0]?.content.match(/\*\*([^*]+)\*\*/)?.[1] || 
          'an unknown location'
        }
        genre={genre}
      />

      {/* Quick Dice Roll */}
      <QuickDiceRoll
        open={modals.quickDiceRoll}
        onClose={() => modalActions.close('quickDiceRoll')}
      />

      {/* Relationships Quick View */}
      <RelationshipsQuickView
        open={modals.relationshipsQuickView}
        onClose={() => modalActions.close('relationshipsQuickView')}
        relationships={Object.values(npcNameMap).map(npc => ({
          id: npc.id || npc.name.toLowerCase().replace(/\s+/g, '-'),
          name: npc.name,
          occupation: npc.occupation,
          trust: npc.trust ?? 0,
          respect: npc.respect ?? 0,
          romance: npc.romance,
          romanceUnlocked: npc.romanceUnlocked,
          portraitUrl: npc.portraitUrl,
        }))}
      />

      {/* Time Display */}
      {modals.timeDisplay && (
        <TimeDisplay
          timeState={timeState}
          weatherState={weatherState}
          onClose={() => modalActions.close('timeDisplay')}
          onOpenTimeSkip={() => modalActions.open('timeSkipModal')}
          onTimeMultiplierChange={(multiplier) => {
            onTimeStateChange({ ...timeState, multiplier });
            toast({
              title: "Time Pace Changed",
              description: `Each action now advances ${TIME_MULTIPLIER_CONFIG[multiplier].label.toLowerCase()} of game time.`,
            });
          }}
        />
      )}

      {/* Time Skip Modal */}
      <TimeSkipModal
        open={modals.timeSkipModal}
        onClose={() => modalActions.close('timeSkipModal')}
        currentTimeState={timeState}
        onTimeSkip={handleTimeSkip}
      />

      {/* Quest Quick View */}
      {modals.questQuickView && (
        <QuestQuickView
          questLog={questLog}
          onClose={() => modalActions.close('questQuickView')}
        />
      )}

      {/* First-time player onboarding */}
      <OnboardingOverlay 
        onComplete={onCompleteOnboarding}
        forceShow={showOnboarding}
      />

      {/* Mobile Quick Menu */}
      <MobileQuickMenu
        isOpen={modals.mobileQuickMenu}
        onClose={() => modalActions.close('mobileQuickMenu')}
        onOpenSettings={() => modalActions.open('settings')}
        onOpenCharacterSheet={() => modalActions.open('characterSheet')}
        onOpenInventory={() => modalActions.open('inventory')}
        onOpenBookmarks={() => modalActions.open('bookmarks')}
        onOpenWeather={() => modalActions.open('weatherModal')}
        onOpenTime={() => modalActions.open('timeDisplay')}
        onOpenRecap={() => modalActions.open('sessionRecap')}
        onOpenSaves={() => window.dispatchEvent(new CustomEvent('open-saves-dropdown'))}
        onRestart={onRestart}
        onOpenCompanions={() => modalActions.open('companions')}
        characterName={character.name}
        currentTime={`${timeState.hour}:${String(timeState.minute).padStart(2, '0')}`}
        currentWeather={WEATHER_CONFIGS[weatherState.current].name}
      />

      {/* Radial Quick Menu */}
      <RadialQuickMenu
        onOpenSettings={() => modalActions.open('settings')}
        onOpenCharacterSheet={() => modalActions.open('characterSheet')}
        onOpenInventory={() => modalActions.open('inventory')}
        onOpenBookmarks={() => modalActions.open('bookmarks')}
        onOpenWeather={() => modalActions.open('weatherModal')}
        onOpenTime={() => modalActions.open('timeDisplay')}
        onOpenRecap={() => modalActions.open('sessionRecap')}
        onOpenSaves={() => window.dispatchEvent(new CustomEvent('open-saves-dropdown'))}
        onRestart={onRestart}
        onOpenCompanions={() => modalActions.open('companions')}
      />

      {/* Companion Story Events */}
      <CompanionStoryEventsContainer
        onInjectToStory={(text) => {
          onPlayerAction(`[COMPANION EVENT] ${text}`);
        }}
      />

      {/* Ambient Feed Modal */}
      <AmbientFeedModal
        isOpen={modals.ambientFeedModal}
        onClose={() => modalActions.close('ambientFeedModal')}
        entries={ambientEntries}
        onClearEntries={onClearAmbientFeed}
      />

      {/* Companion Quick View */}
      <CompanionQuickView
        onOpenPanel={() => modalActions.open('companions')}
        className="fixed top-20 right-4 z-30 hidden md:block"
      />

      {/* Companion Warning Toast */}
      <CompanionWarningToast />

      {/* Companion Panel Modal */}
      <CompanionPanel
        isOpen={modals.companions}
        onClose={() => modalActions.close('companions')}
        genre={genre}
      />
    </>
  );
}

// ============================================================================
// WEATHER MODAL SUB-COMPONENT
// ============================================================================

function WeatherModal({ 
  weatherState, 
  onClose 
}: { 
  weatherState: WeatherState; 
  onClose: () => void;
}) {
  const transitionOpacity = getWeatherTransitionOpacity(weatherState);
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="glass-panel p-6 max-w-md w-full mx-4 space-y-4 animate-scale-in relative overflow-hidden max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Particle Effects Background */}
        <WeatherModalParticles 
          weather={weatherState.current} 
          intensity={weatherState.intensity}
          transitionOpacity={transitionOpacity.current}
        />
        {weatherState.transitioningTo && transitionOpacity.next > 0 && (
          <WeatherModalParticles 
            weather={weatherState.transitioningTo} 
            intensity={weatherState.intensity}
            transitionOpacity={transitionOpacity.next}
          />
        )}
        
        <Tabs defaultValue="current" className="relative z-10">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-background/80 backdrop-blur-sm">
            <TabsTrigger value="current" className="data-[state=active]:bg-primary/20">Current</TabsTrigger>
            <TabsTrigger value="forecast" className="data-[state=active]:bg-primary/20">Forecast</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="space-y-4 text-center">
            {/* Weather Icon */}
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              weatherState.current === 'storm' ? 'bg-yellow-500/20 animate-pulse' : 
              weatherState.current === 'rain' ? 'bg-blue-500/20' : 
              weatherState.current === 'heat_wave' ? 'bg-red-500/20 animate-pulse' : 
              'bg-muted/30'
            }`}>
              <WeatherIcon weather={weatherState.current} />
            </div>
            
            <h3 className="text-2xl font-display font-bold">{WEATHER_CONFIGS[weatherState.current].name}</h3>
            
            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Timer className="w-3 h-3" />
              <div className="w-24 h-1.5 bg-background/50 rounded-full overflow-hidden">
                <div className="h-full bg-primary/70 transition-all" style={{ width: `${(weatherState.ticksRemaining / weatherState.totalDuration) * 100}%` }} />
              </div>
              <span>{weatherState.ticksRemaining} turns</span>
            </div>
            
            <p className="text-sm text-muted-foreground">{WEATHER_CONFIGS[weatherState.current].description}</p>
            <p className="text-xs italic text-foreground/60">{WEATHER_CONFIGS[weatherState.current].ambientText}</p>
            
            {weatherState.transitioningTo && (
              <div className="text-xs text-muted-foreground animate-pulse">
                Weather changing to <span className="font-medium">{WEATHER_CONFIGS[weatherState.transitioningTo].name}</span> soon...
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="forecast" className="space-y-3">
            <div className="bg-primary/5 rounded-lg p-2 border-l-2 border-primary/50 mb-3">
              <p className="text-xs italic text-muted-foreground">
                "{['My instruments are telling me...', 'Based on my experience...', 'The signs suggest...', 'If my calculations are correct...'][Math.floor(Date.now() / 10000) % 4]}"
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-yellow-500 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Forecasts may be inaccurate</span>
            </div>
            
            {generateWeatherForecast(weatherState).map((forecast, idx) => (
              <div key={idx} className="flex items-center justify-between bg-muted/20 rounded-lg p-2.5 border border-border/30">
                <div className="flex items-center gap-2">
                  <WeatherIcon weather={forecast.predictedWeather} small />
                  <div>
                    <p className="text-xs font-medium">{forecast.label}</p>
                    <p className="text-[10px] text-muted-foreground">{WEATHER_CONFIGS[forecast.predictedWeather].name}</p>
                  </div>
                </div>
                <div className="text-right w-14">
                  <p className={`text-xs font-medium ${
                    forecast.confidence >= 70 ? 'text-green-400' : 
                    forecast.confidence >= 45 ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    {forecast.confidence}%
                  </p>
                  <Progress value={forecast.confidence} className="h-1 mt-0.5" />
                </div>
              </div>
            ))}
            
            <p className="text-[10px] text-center text-muted-foreground italic mt-2">
              ⚠️ Trust at your own risk
            </p>
          </TabsContent>
        </Tabs>
        
        <Button onClick={onClose} className="w-full relative z-10" variant="outline">
          Close
        </Button>
      </div>
    </div>
  );
}

// Weather icon helper
function WeatherIcon({ weather, small = false }: { weather: WeatherType; small?: boolean }) {
  const size = small ? 'w-4 h-4' : 'w-8 h-8';
  switch (weather) {
    case 'storm': return <CloudLightning className={`${size} text-yellow-400`} />;
    case 'rain': return <CloudRain className={`${size} text-blue-400`} />;
    case 'fog': return <CloudFog className={`${size} text-violet-400`} />;
    case 'heat_wave': return <Flame className={`${size} text-red-400`} />;
    case 'wind': return <Wind className={`${size} text-orange-400`} />;
    case 'snow': return <Snowflake className={`${size} text-cyan-400`} />;
    case 'cloudy': return <Cloud className={`${size} text-slate-400`} />;
    default: return <Sun className={`${size} text-amber-400`} />;
  }
}
