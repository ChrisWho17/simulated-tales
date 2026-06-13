import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { VERSION_STRING, BUILD_NUMBER } from '@/lib/version';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardInteractive } from '@/components/ui/card';
import { Sparkles, Shuffle, Sword, Rocket, Search, Skull, Castle, Compass, Zap, Sun, Loader2, ChevronDown, Shield, Lock, Plus, X, FolderOpen, Trash2, Palette, LogIn, Upload, Crosshair, ArrowRight } from 'lucide-react';
import { loadCampaignIndex, loadCampaign, deleteCampaignData, formatPlayTime, formatLastPlayed, setActiveCampaignId } from '@/lib/campaignStorage';
import { CampaignMetadata } from '@/types/campaign';
import { GameGenre, GENRE_DATA, WarEra, detectWarEra, getWarGenreData } from '@/types/genreData';
import { ColorSplashScreen } from '@/components/ui/ColorSplashScreen';
import { ThemedGoogleIcon } from '@/components/ui/ThemedGoogleIcon';
import { AtmosphericBackground } from '@/components/ui/particle-background';
import { detectGenreFromText, getAllGenres, getGenreTitle, GENRE_ICONS, parseGenreTagsFromText, stripGenreTagsFromText } from '@/lib/genreDetection';
import { DiceMode, saveDiceMode } from '@/game/diceSystem';
import { Switch } from '@/components/ui/switch';
import { GENRE_CLASSES, getGenreClasses, GenreClassOption } from '@/game/storyInventoryBridge';
import { Slider } from '@/components/ui/slider';
import { GameSettingsMenu } from './GameSettingsMenu';
import { LifetimeStatsModal } from './LifetimeStatsModal';
import { AuthModal } from '@/components/cloud/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { useCloudSyncStatus } from '@/hooks/useCloudSyncStatus';
import { useCampaignOptional } from '@/contexts/CampaignContext';
import { CloudStatusBadge } from '@/components/cloud/CloudStatusBadge';
import { ConflictResolutionModal } from '@/components/cloud/ConflictResolutionModal';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Genre Contract state shape
// Primary genre is always 50% minimum (100% when hard locked)
// Secondary genres can divide up to 50% total between up to 3 genres
export interface SecondaryGenre {
  genreId: GameGenre;
  blendStrength: number; // 0-50, total across all secondaries capped at 50
}

export interface GenreContractConfig {
  primaryGenre: GameGenre;
  secondaryGenres: SecondaryGenre[];
  hardLock: boolean;
}

export interface ScenarioSelection {
  scenario: string;
  genre: GameGenre;
  genreTitle: string;
  diceMode: DiceMode;
  genreContract?: GenreContractConfig;
  characterClass?: string;
}

interface AdventureCreatorProps {
  onSelect: (selection: ScenarioSelection) => void;
  onLoadCampaign?: (campaignId: string) => void;
  isLoading: boolean;
}

const PRESET_SCENARIOS = [
  { id: 'fantasy', genre: 'fantasy' as GameGenre, title: 'Fantasy Quest', description: 'Begin a fantasy adventure in a mystical realm where magic flows freely and ancient prophecies unfold.', icon: Castle, gradient: 'genre-fantasy' },
  { id: 'space', genre: 'scifi' as GameGenre, title: 'Space Explorer', description: 'Start a sci-fi journey aboard a deep space exploration vessel at the edge of known space.', icon: Rocket, gradient: 'genre-scifi' },
  { id: 'detective', genre: 'mystery' as GameGenre, title: 'Detective Mystery', description: 'Investigate a complex case in a noir mystery where nothing is quite what it seems.', icon: Search, gradient: 'genre-mystery' },
  { id: 'survival', genre: 'horror' as GameGenre, title: 'Survival Horror', description: 'Wake up in an abandoned facility with no memory. Something is hunting you in the dark.', icon: Skull, gradient: 'genre-horror' },
  { id: 'pirate', genre: 'pirate' as GameGenre, title: 'High Seas Adventure', description: 'Captain your own ship across treacherous waters in search of legendary treasure.', icon: Compass, gradient: 'genre-pirate' },
  { id: 'cyberpunk', genre: 'cyberpunk' as GameGenre, title: 'Neon Dystopia', description: 'Navigate the neon-lit streets of a corporate-controlled megacity as a skilled hacker or street samurai.', icon: Zap, gradient: 'genre-cyberpunk' },
  { id: 'war', genre: 'war' as GameGenre, title: 'Theater of War', description: 'Experience the chaos and heroism of warfare across any era - ancient battles, modern conflicts, or future wars.', icon: Shield, gradient: 'genre-western' },
  { id: 'military', genre: 'war' as GameGenre, title: 'Soldier on Tour', description: 'An average soldier deployed on active duty. Classic armor and camo, standard-issue gear, and the weight of orders over your shoulders.', icon: Crosshair, gradient: 'genre-western' },
  { id: 'western', genre: 'western' as GameGenre, title: 'Frontier Justice', description: 'Ride into a dusty frontier town where outlaws rule and justice needs a champion.', icon: Sun, gradient: 'genre-western' },
  { id: 'modern_life', genre: 'modern_life' as GameGenre, title: 'Modern Life', description: 'Start fresh in a bustling city. Build your career, nurture relationships, and chase your dreams in everyday life.', icon: Sparkles, gradient: 'genre-mystery' },
];

const RANDOM_SCENARIOS: Array<{ text: string; genre: GameGenre }> = [
  { text: "You are a thief who just discovered their target is actually their long-lost sibling.", genre: 'fantasy' },
  { text: "You're a time traveler stuck in ancient Rome with a smartphone that still works.", genre: 'scifi' },
  { text: "You wake up as the villain in a fairy tale, but you want to be a hero.", genre: 'fantasy' },
  { text: "You're a ghost trying to solve your own murder.", genre: 'mystery' },
  { text: "You're a chef in a post-apocalyptic wasteland, running the last fine dining restaurant.", genre: 'postapoc' },
  { text: "You're a dragon who was polymorphed into a human and forgot you were ever a dragon.", genre: 'fantasy' },
  { text: "You're a space bounty hunter whose ship AI has developed a crush on you.", genre: 'scifi' },
  { text: "You're a librarian who discovered a book that writes your future as you read it.", genre: 'horror' },
  { text: "You're a pirate captain whose crew has been replaced by the ghosts of your enemies.", genre: 'pirate' },
  { text: "You're a retired adventurer running a tavern, but trouble keeps finding you.", genre: 'fantasy' },
  { text: "You're a hacker who accidentally downloaded a rogue AI into your neural implant.", genre: 'cyberpunk' },
  { text: "You're a detective investigating a murder at a party where everyone is a suspect—including you.", genre: 'mystery' },
];

// Helper to get blend strength label
const getBlendLabel = (value: number): string => {
  if (value <= 10) return 'Light';
  if (value <= 20) return 'Moderate';
  if (value <= 35) return 'Strong';
  return 'Heavy';
};

// Max total secondary genre weight (primary always gets at least 50%)
const MAX_SECONDARY_TOTAL = 50;
const MAX_SECONDARY_GENRES = 3;

// Load Story Dropdown component - shows saved campaigns
function LoadStoryDropdown({ onLoad }: { onLoad?: (campaignId: string) => void }) {
  const [campaigns, setCampaigns] = useState<CampaignMetadata[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load campaigns from storage
  useEffect(() => {
    const loadedCampaigns = loadCampaignIndex();
    // Sort by most recently updated
    setCampaigns(loadedCampaigns.sort((a, b) => b.updatedAt - a.updatedAt));
  }, [isOpen]); // Refresh when dropdown opens

  const handleLoad = (campaignId: string) => {
    setActiveCampaignId(campaignId);
    setIsOpen(false);
    // Use setTimeout to ensure localStorage write completes before reload
    setTimeout(() => {
      if (onLoad) {
        onLoad(campaignId);
      } else {
        // Fallback: reload page to trigger campaign load
        window.location.reload();
      }
    }, 50);
  };

  const handleDelete = (e: React.MouseEvent, campaignId: string, campaignName: string) => {
    e.stopPropagation();
    if (confirm(`Delete "${campaignName}"? This cannot be undone.`)) {
      deleteCampaignData(campaignId);
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    }
  };

  const scrollUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    scrollContainerRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
  };

  const scrollDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    scrollContainerRef.current?.scrollBy({ top: 100, behavior: 'smooth' });
  };

  if (campaigns.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/30 text-sm text-muted-foreground">
        <FolderOpen className="w-4 h-4" />
        <span>No saves</span>
      </div>
    );
  }

  const showScrollControls = campaigns.length > 3;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/30 text-sm hover:bg-primary/30"
        >
          <FolderOpen className="w-4 h-4 text-primary" />
          <span className="text-primary font-medium">Load Story</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-0">
        {/* Scroll Up Button */}
        {showScrollControls && (
          <div 
            className="sticky top-0 z-10 flex justify-center p-1 bg-popover border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={scrollUp}
          >
            <ChevronDown className="w-4 h-4 rotate-180 text-muted-foreground" />
          </div>
        )}
        
        {/* Scrollable content */}
        <div 
          ref={scrollContainerRef}
          className="max-h-64 overflow-y-auto"
        >
          {campaigns.map((campaign) => (
            <DropdownMenuItem 
              key={campaign.id}
              onClick={() => handleLoad(campaign.id)}
              className="flex items-start gap-3 p-3 cursor-pointer group"
            >
              <div className="text-xl shrink-0">
                {GENRE_ICONS[campaign.primaryGenre as GameGenre] || '📖'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{campaign.name}</div>
                <div className="text-xs text-muted-foreground">
                  {campaign.characterName} · Lvl {campaign.characterLevel}
                </div>
                <div className="text-xs text-muted-foreground/70">
                  {formatPlayTime(campaign.playTime)} · {formatLastPlayed(campaign.updatedAt)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => handleDelete(e, campaign.id, campaign.name)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuItem>
          ))}
        </div>
        
        {/* Scroll Down Button */}
        {showScrollControls && (
          <div 
            className="sticky bottom-0 z-10 flex justify-center p-1 bg-popover border-t border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={scrollDown}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Import preview data type
interface ImportPreview {
  json: string;
  name: string;
  characterName: string;
  characterLevel: number;
  genre: string;
  playTime: number;
  chapterCount: number;
  createdAt: number;
  updatedAt: number;
}

// Import progress step type
type ImportStep = 'idle' | 'validating' | 'saving' | 'syncing' | 'loading' | 'complete';

const IMPORT_STEPS: { step: ImportStep; label: string; icon: React.ReactNode }[] = [
  { step: 'validating', label: 'Validating campaign data...', icon: <Search className="h-4 w-4" /> },
  { step: 'saving', label: 'Saving to local storage...', icon: <FolderOpen className="h-4 w-4" /> },
  { step: 'syncing', label: 'Syncing with cloud...', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  { step: 'loading', label: 'Loading campaign...', icon: <Sparkles className="h-4 w-4" /> },
];

// Import Save Button component - allows importing a campaign from a JSON file with preview
function ImportSaveButton({ onLoad }: { onLoad?: (campaignId: string) => void }) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const campaignContext = useCampaignOptional();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>('idle');
  
  const handleImportClick = () => {
    importInputRef.current?.click();
  };
  
  // Parse file and show preview
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      try {
        const data = JSON.parse(json);
        if (data.id && data.meta) {
          setPreview({
            json,
            name: data.meta.name || 'Unnamed Campaign',
            characterName: data.meta.characterName || 'Unknown',
            characterLevel: data.meta.characterLevel || 1,
            genre: data.meta.primaryGenre || 'unknown',
            playTime: data.meta.playTime || 0,
            chapterCount: data.meta.chapterCount || 0,
            createdAt: data.meta.createdAt || Date.now(),
            updatedAt: data.meta.updatedAt || Date.now(),
          });
        } else {
          toast.error('Invalid campaign file format');
        }
      } catch (err) {
        toast.error('Failed to parse campaign file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);
  
  // Confirm and import with step-by-step progress
  const handleConfirmImport = useCallback(async () => {
    if (!preview) return;
    setIsImporting(true);
    setImportStep('validating');
    
    try {
      // Step 1: Validate
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = JSON.parse(preview.json);
      if (!data.id || !data.meta) {
        throw new Error('Invalid campaign structure');
      }
      
      // Step 2: Save
      setImportStep('saving');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      let importedCampaign: { id: string; meta: { name: string } } | null = null;
      
      if (campaignContext?.importCampaign) {
        // Step 3: Sync with context (includes cloud sync)
        setImportStep('syncing');
        const result = await campaignContext.importCampaign(preview.json);
        if (result) {
          importedCampaign = result;
        }
      } else {
        // Fallback: parse and store directly
        localStorage.setItem(`campaign_${data.id}`, preview.json);
        const indexStr = localStorage.getItem('campaign_index') || '[]';
        const index = JSON.parse(indexStr);
        const existingIdx = index.findIndex((m: any) => m.id === data.id);
        if (existingIdx >= 0) {
          index[existingIdx] = data.meta;
        } else {
          index.push({ ...data.meta, id: data.id });
        }
        localStorage.setItem('campaign_index', JSON.stringify(index));
        importedCampaign = { id: data.id, meta: data.meta };
      }
      
      if (!importedCampaign) {
        throw new Error('Import returned no campaign');
      }
      
      // Step 4: Load
      setImportStep('loading');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setImportStep('complete');
      toast.success(`Imported "${importedCampaign.meta.name}"`);
      
      // Small delay to show completion before navigating
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setPreview(null);
      if (onLoad) {
        onLoad(importedCampaign.id);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('[Import] Failed:', err);
      toast.error('Failed to import campaign');
      setImportStep('idle');
      setIsImporting(false);
    }
  }, [preview, campaignContext, onLoad]);
  
  return (
    <>
      <input
        type="file"
        ref={importInputRef}
        onChange={handleFileSelect}
        accept=".json"
        className="hidden"
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleImportClick}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/50 text-sm hover:bg-muted/50"
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground font-medium hidden sm:inline">Import</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import a saved campaign file</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Import Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && !isImporting && setPreview(null)}>
        <DialogContent className="sm:max-w-md animate-scale-in">
          <DialogHeader className="animate-fade-in">
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Upload className="h-5 w-5" />
              {isImporting ? 'Importing Campaign...' : 'Import Campaign'}
            </DialogTitle>
            <DialogDescription>
              {isImporting ? 'Please wait while your campaign is being imported.' : 'Review the campaign details before importing.'}
            </DialogDescription>
          </DialogHeader>
          
          {preview && !isImporting && (
            <div className="space-y-4 py-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {/* Campaign Name */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-2xl">{GENRE_ICONS[preview.genre as GameGenre] || '📖'}</span>
                <div>
                  <div className="font-semibold text-foreground">{preview.name}</div>
                  <div className="text-sm text-muted-foreground capitalize">{preview.genre.replace('_', ' ')} Adventure</div>
                </div>
              </div>
              
              {/* Character Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Character</div>
                  <div className="font-medium text-foreground">{preview.characterName}</div>
                  <div className="text-sm text-primary">Level {preview.characterLevel}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Progress</div>
                  <div className="font-medium text-foreground">{preview.chapterCount} Chapters</div>
                  <div className="text-sm text-muted-foreground">{formatPlayTime(preview.playTime)}</div>
                </div>
              </div>
              
              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/30">
                <div>Created: {new Date(preview.createdAt).toLocaleDateString()}</div>
                <div>Last played: {formatLastPlayed(preview.updatedAt)}</div>
              </div>
            </div>
          )}
          
          {/* Import Progress Steps */}
          {isImporting && (
            <div className="py-6 space-y-3 animate-fade-in">
              {IMPORT_STEPS.map((stepInfo, index) => {
                const stepOrder = ['validating', 'saving', 'syncing', 'loading'];
                const currentIndex = stepOrder.indexOf(importStep);
                const stepIndex = stepOrder.indexOf(stepInfo.step);
                const isActive = importStep === stepInfo.step;
                const isComplete = stepIndex < currentIndex || importStep === 'complete';
                const isPending = stepIndex > currentIndex && importStep !== 'complete';
                
                return (
                  <div 
                    key={stepInfo.step}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary/20 border border-primary/40' 
                        : isComplete 
                          ? 'bg-green-500/10 border border-green-500/30' 
                          : 'bg-muted/30 border border-border/30 opacity-50'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'bg-primary/30 text-primary' 
                        : isComplete 
                          ? 'bg-green-500/30 text-green-500' 
                          : 'bg-muted/50 text-muted-foreground'
                    }`}>
                      {isComplete ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${
                      isActive ? 'text-primary' : isComplete ? 'text-green-500' : 'text-muted-foreground'
                    }`}>
                      {isComplete ? stepInfo.label.replace('...', '') : stepInfo.label}
                    </span>
                  </div>
                );
              })}
              
              {importStep === 'complete' && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/20 border border-green-500/40 animate-fade-in">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/30 text-green-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-green-500">Campaign imported successfully!</span>
                </div>
              )}
            </div>
          )}
          
          {!isImporting && (
            <DialogFooter className="gap-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button
                variant="outline"
                onClick={() => setPreview(null)}
                className="transition-all duration-200 hover:scale-105"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import & Play
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AdventureCreator({ onSelect, onLoadCampaign, isLoading }: AdventureCreatorProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedDiceMode, setSelectedDiceMode] = useState<DiceMode>('story');
  const [showColorSplash, setShowColorSplash] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  
  // Auth state
  const { isAuthenticated, user, signOut, signInWithOAuth, isLoading: authLoading } = useAuth();
  
  // Cloud sync state
  const { 
    overallState: syncState, 
    lastSyncedAt, 
    conflicts, 
    hasConflicts,
    isSyncing,
    forceSync 
  } = useCloudSyncStatus();
  
  // Show conflict modal automatically when conflicts are detected
  useEffect(() => {
    if (hasConflicts && isAuthenticated) {
      setShowConflictModal(true);
    }
  }, [hasConflicts, isAuthenticated]);
  
  const handleSyncClick = async () => {
    if (hasConflicts) {
      setShowConflictModal(true);
    } else {
      const result = await forceSync();
      if (result.synced > 0) {
        toast.success(`Synced ${result.synced} campaign${result.synced > 1 ? 's' : ''}`);
      } else if (result.conflicts > 0) {
        setShowConflictModal(true);
      } else {
        toast.info('Everything is up to date');
      }
    }
  };
  
  // Genre Contract state
  const [primaryGenre, setPrimaryGenre] = useState<GameGenre>('fantasy');
  const [secondaryGenres, setSecondaryGenres] = useState<SecondaryGenre[]>([]);
  const [hardLock, setHardLock] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('default');

  const allGenres = getAllGenres();
  
  // Get available classes for the current primary genre (including hybrids when secondary genres selected)
  const availableClasses = useMemo(() => {
    return getGenreClasses(primaryGenre, secondaryGenres);
  }, [primaryGenre, secondaryGenres]);
  
  // Reset class selection when genre changes
  useEffect(() => {
    setSelectedClass('default');
  }, [primaryGenre]);

  // Available genres for secondary selection (exclude primary and already selected)
  const availableSecondaryGenres = useMemo(() => {
    const selectedIds = [primaryGenre, ...secondaryGenres.map(s => s.genreId)];
    return allGenres.filter(g => !selectedIds.includes(g.id));
  }, [allGenres, primaryGenre, secondaryGenres]);


  // Secondary genres are manually selected only
  const effectiveSecondaryGenres = useMemo(() => {
    // Enforce max total of 50% across all secondaries
    let totalBlend = 0;
    const capped: SecondaryGenre[] = [];
    for (const sg of secondaryGenres.slice(0, MAX_SECONDARY_GENRES)) {
      const remaining = MAX_SECONDARY_TOTAL - totalBlend;
      if (remaining <= 0) break;
      const cappedStrength = Math.min(sg.blendStrength, remaining);
      capped.push({ ...sg, blendStrength: cappedStrength });
      totalBlend += cappedStrength;
    }
    return capped;
  }, [secondaryGenres]);

  // Build genre contract config for display (uses effective secondary genres)
  const genreContract: GenreContractConfig = useMemo(() => ({
    primaryGenre,
    secondaryGenres: effectiveSecondaryGenres,
    hardLock
  }), [primaryGenre, effectiveSecondaryGenres, hardLock]);

  // Default to modern war era since custom scenario input was removed
  const detectedWarEra = useMemo(() => 'modern' as const, []);

  // Get genre data - for war, use era-specific data
  const activeGenreData = useMemo(() => {
    if (primaryGenre === 'war') {
      return getWarGenreData(detectedWarEra);
    }
    return GENRE_DATA[primaryGenre];
  }, [primaryGenre, detectedWarEra]);

  // Calculate remaining available blend strength
  const usedBlendStrength = secondaryGenres.reduce((sum, sg) => sum + sg.blendStrength, 0);
  const remainingBlendStrength = MAX_SECONDARY_TOTAL - usedBlendStrength;

  const handleAddSecondaryGenre = () => {
    if (secondaryGenres.length >= MAX_SECONDARY_GENRES || availableSecondaryGenres.length === 0) return;
    if (remainingBlendStrength <= 0) return; // No room for more blend
    
    // Default new genre to minimum of remaining or 15%
    const defaultBlend = Math.min(15, remainingBlendStrength);
    setSecondaryGenres([...secondaryGenres, { 
      genreId: availableSecondaryGenres[0].id, 
      blendStrength: defaultBlend 
    }]);
  };

  const handleRemoveSecondaryGenre = (index: number) => {
    setSecondaryGenres(secondaryGenres.filter((_, i) => i !== index));
  };

  const handleSecondaryGenreChange = (index: number, genreId: GameGenre) => {
    const updated = [...secondaryGenres];
    updated[index] = { ...updated[index], genreId };
    setSecondaryGenres(updated);
  };

  const handleBlendStrengthChange = (index: number, value: number[]) => {
    const updated = [...secondaryGenres];
    const newValue = value[0];
    
    // Calculate how much others are using
    const othersTotal = updated.reduce((sum, sg, i) => i === index ? sum : sum + sg.blendStrength, 0);
    const maxForThis = MAX_SECONDARY_TOTAL - othersTotal;
    
    updated[index] = { ...updated[index], blendStrength: Math.min(newValue, maxForThis) };
    setSecondaryGenres(updated);
  };

  const handleRandomScenario = () => {
    const random = RANDOM_SCENARIOS[Math.floor(Math.random() * RANDOM_SCENARIOS.length)];
    saveDiceMode(selectedDiceMode);
    onSelect({ 
      scenario: random.text, 
      genre: random.genre, 
      genreTitle: getGenreTitle(random.genre), 
      diceMode: selectedDiceMode,
      genreContract: { primaryGenre: random.genre, secondaryGenres: [], hardLock: false },
      characterClass: 'default'
    });
  };

  const handlePresetStart = (preset: typeof PRESET_SCENARIOS[0]) => {
    saveDiceMode(selectedDiceMode);
    onSelect({ 
      scenario: preset.description, 
      genre: preset.genre, 
      genreTitle: preset.title, 
      diceMode: selectedDiceMode,
      genreContract: { primaryGenre: preset.genre, secondaryGenres: [], hardLock: false },
      characterClass: selectedClass
    });
  };

  const handleContinueWithGenre = () => {
    saveDiceMode(selectedDiceMode);
    const title = getGenreTitle(primaryGenre);
    onSelect({
      scenario: '',
      genre: primaryGenre,
      genreTitle: title,
      diceMode: selectedDiceMode,
      genreContract: {
        primaryGenre,
        secondaryGenres: effectiveSecondaryGenres,
        hardLock,
      },
      characterClass: selectedClass,
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Color Splash Screen */}
      <ColorSplashScreen open={showColorSplash} onClose={() => setShowColorSplash(false)} />
      
      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      
      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        open={showConflictModal}
        conflicts={conflicts}
        onResolved={() => {
          setShowConflictModal(false);
          toast.success('All conflicts resolved!');
        }}
        onClose={() => setShowConflictModal(false)}
      />
      
      {/* Atmospheric Background */}
      <AtmosphericBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        {/* Logo/Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-5xl md:text-7xl font-display font-bold text-gradient-primary tracking-wider">
              UNTOLD
            </h1>
          </div>
          <p className="text-muted-foreground uppercase tracking-[0.4em] text-sm">
            Begin Your Unique Adventure
          </p>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-3xl space-y-8">
          {/* Unified Controls Row - Game Settings, Achievements, Color, Sign In */}
          <div className="flex justify-center items-center gap-2 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            {/* Game Settings */}
            <GameSettingsMenu />
            
            {/* Lifetime Stats / Achievements */}
            <LifetimeStatsModal />
            
            {/* Color Picker Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowColorSplash(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/30 border border-[rgba(255,255,255,0.1)] hover:border-primary/50 transition-all duration-300 group"
                  >
                    <Palette className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Change theme color</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Sign In / User Button with Cloud Sync Status */}
            <div className="flex items-center gap-1.5">
              {/* Cloud Sync Status Badge - only show when authenticated */}
              {isAuthenticated && (
                <CloudStatusBadge
                  state={syncState}
                  lastSyncedAt={lastSyncedAt}
                  conflictCount={conflicts.length}
                  isSyncing={isSyncing}
                  onSyncClick={handleSyncClick}
                />
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isAuthenticated ? (
                      <button
                        onClick={() => signOut()}
                        className="flex items-center justify-center gap-2 px-3 h-10 rounded-lg bg-primary/20 border border-primary/30 hover:bg-primary/30 transition-all duration-300 group animate-electric-flicker"
                      >
                        <ThemedGoogleIcon className="w-5 h-5" />
                        <span className="text-sm text-primary font-medium max-w-[100px] truncate">
                          {user?.email?.split('@')[0]}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => signInWithOAuth('google')}
                        className="flex items-center justify-center gap-2 px-3 h-10 rounded-lg bg-black/30 border border-[rgba(255,255,255,0.1)] hover:border-primary/50 transition-all duration-300 group"
                        disabled={authLoading}
                      >
                        <ThemedGoogleIcon className="w-5 h-5" />
                        <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                          Sign In
                        </span>
                      </button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isAuthenticated ? 'Sign out' : 'Sign in with Google'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Genre Contract Setup - Glass Panel */}
          <div className="glass-panel p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-primary font-display text-xl tracking-wide">Genre Contract Setup</h2>
              <div className="flex items-center gap-2">
                <ImportSaveButton onLoad={onLoadCampaign} />
                <LoadStoryDropdown onLoad={onLoadCampaign} />
              </div>
            </div>



            {/* Primary Genre Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Primary Genre (locked)
                </label>
                <Select value={primaryGenre} onValueChange={(v) => setPrimaryGenre(v as GameGenre)}>
                  <SelectTrigger className="w-full bg-background/50 border-primary/30">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{GENRE_ICONS[primaryGenre]}</span>
                        <span>{allGenres.find(g => g.id === primaryGenre)?.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allGenres.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{g.icon}</span>
                          <span>{g.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Character Class Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sword className="w-4 h-4 text-primary" />
                  Character Class
                </label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full bg-background/50 border-primary/30">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{availableClasses.find(c => c.id === selectedClass)?.icon || '🎭'}</span>
                        <span>{availableClasses.find(c => c.id === selectedClass)?.name || 'Default'}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cls.icon}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{cls.name}</span>
                            <span className="text-xs text-muted-foreground">{cls.description}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hard Lock Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <div className="flex items-center gap-2">
                  {hardLock && <Lock className="w-4 h-4 text-amber-400" />}
                  <label htmlFor="hard-lock" className="text-sm font-medium text-foreground">
                    Hard Lock: No outside elements allowed
                  </label>
                </div>
                <Switch
                  id="hard-lock"
                  checked={hardLock}
                  onCheckedChange={(checked) => {
                    setHardLock(checked);
                    // Clear secondary genres when hard lock is enabled
                    if (checked) {
                      setSecondaryGenres([]);
                    }
                  }}
                />
              </div>

              {/* Secondary Genres Section - Only show if not hard locked */}
              {!hardLock && (
                <div className="space-y-3 pt-3 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Plus className="w-4 h-4 text-primary" />
                      Secondary Genres (up to 50% total)
                    </label>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Used: {usedBlendStrength}%</span>
                      <span className="text-primary">/ 50%</span>
                    </div>
                  </div>
                  
                  {/* List of added secondary genres */}
                  {secondaryGenres.map((sg, index) => {
                    // Calculate max slider value for this genre
                    const othersTotal = secondaryGenres.reduce((sum, s, i) => i === index ? sum : sum + s.blendStrength, 0);
                    const maxForThis = MAX_SECONDARY_TOTAL - othersTotal;
                    
                    return (
                      <div key={sg.genreId} className="flex items-center gap-2 p-2 rounded-lg bg-background/30 border border-border/30">
                        <Select 
                          value={sg.genreId} 
                          onValueChange={(v) => handleSecondaryGenreChange(index, v as GameGenre)}
                        >
                          <SelectTrigger className="w-20 bg-background/50 border-primary/30 h-8 px-2">
                            <SelectValue>
                              <div className="flex items-center gap-1">
                                <span className="text-sm">{GENRE_ICONS[sg.genreId]}</span>
                                <span className="text-xs truncate">{allGenres.find(g => g.id === sg.genreId)?.name?.slice(0, 6)}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {[...availableSecondaryGenres, allGenres.find(g => g.id === sg.genreId)!]
                              .filter(Boolean)
                              .map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{g.icon}</span>
                                    <span>{g.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        
                        <div className="flex-1 flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-6">0%</span>
                          <Slider
                            value={[sg.blendStrength]}
                            min={5}
                            max={maxForThis}
                            step={1}
                            onValueChange={(v) => handleBlendStrengthChange(index, v)}
                            className="flex-1"
                            dir="ltr"
                          />
                          <span className="text-xs text-primary w-16 text-right font-medium">
                            {sg.blendStrength}% <span className="text-muted-foreground text-[10px]">{getBlendLabel(sg.blendStrength)}</span>
                          </span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveSecondaryGenre(index)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {/* Add Secondary Genre Button */}
                  {secondaryGenres.length < MAX_SECONDARY_GENRES && remainingBlendStrength > 0 && availableSecondaryGenres.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddSecondaryGenre}
                      className="w-full mt-2 bg-background/30 border-primary/30 hover:bg-primary/10"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Secondary Genre ({remainingBlendStrength}% remaining)
                    </Button>
                  )}
                  
                  {secondaryGenres.length === MAX_SECONDARY_GENRES && (
                    <p className="text-xs text-muted-foreground text-center">Maximum {MAX_SECONDARY_GENRES} secondary genres reached</p>
                  )}
                  
                  {remainingBlendStrength <= 0 && secondaryGenres.length > 0 && (
                    <p className="text-xs text-amber-400 text-center">50% secondary blend limit reached</p>
                  )}
                </div>
              )}
            </div>

            {/* Continue button — proceed to character creation with selected genre */}
            <Button
              onClick={handleContinueWithGenre}
              disabled={isLoading}
              className="w-full mt-6"
              size="lg"
            >
              Continue with {allGenres.find(g => g.id === primaryGenre)?.name || 'Selected Genre'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <span className="text-muted-foreground text-xs uppercase tracking-wider px-4">Or choose your fate</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          {/* Random Button */}
          <Button
            variant="glass"
            className="w-full py-7 text-base group animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
            onClick={handleRandomScenario}
            disabled={isLoading}
          >
            <Sparkles className="w-5 h-5 mr-3 text-primary group-hover:animate-pulse" />
            <span>Surprise Me! Generate a Random Story</span>
            <Shuffle className="w-4 h-4 ml-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Button>

          {/* Preset Scenarios */}
          <div className="space-y-4">
            <h2 className="text-primary font-display text-xl tracking-wide animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Choose a Preset Scenario
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {PRESET_SCENARIOS.map((scenario, index) => (
                <CardInteractive
                  key={scenario.id}
                  onClick={() => handlePresetStart(scenario)}
                  onMouseEnter={() => setHoveredCard(scenario.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`p-5 ${scenario.gradient} animate-fade-in-up cursor-pointer ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                  style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-primary/20 border border-primary/30 transition-all duration-300 ${
                      hoveredCard === scenario.id ? 'shadow-glow scale-110' : ''
                    }`}>
                      <scenario.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-lg text-foreground tracking-wide">
                          {scenario.title}
                        </h3>
                      </div>
                      <span className="inline-block text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider mb-2">
                        {scenario.genre}
                      </span>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {scenario.description}
                      </p>
                    </div>
                  </div>
                </CardInteractive>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50">
            <div className="text-center space-y-6 glass-panel p-10 rounded-2xl">
              <div className="relative inline-block">
                <div className="absolute inset-0 animate-glow-pulse rounded-full" />
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <p className="text-foreground font-display text-2xl tracking-wide">Preparing your adventure...</p>
              <div className="w-48 h-1 bg-black/50 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
