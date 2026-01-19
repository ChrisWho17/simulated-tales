import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Sparkles, Palette, Wand2, 
  Gamepad2, AlertTriangle, Check, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { COLOR_PRESETS, ColorPreset, applyColorTheme, loadColorPreference } from '@/lib/colorTheme';
import { SETTINGS_PRESETS, PresetId } from './SettingsPresetSelector';

const WIZARD_COMPLETED_KEY = 'untold-first-time-wizard-completed';

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Untold',
    subtitle: 'Your AI-powered narrative adventure begins here',
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    id: 'theme',
    title: 'Choose Your Theme',
    subtitle: 'Select a color theme that sets the mood',
    icon: <Palette className="w-8 h-8" />,
  },
  {
    id: 'preset',
    title: 'Gameplay Style',
    subtitle: 'How challenging should your adventure be?',
    icon: <Gamepad2 className="w-8 h-8" />,
  },
  {
    id: 'content',
    title: 'Content Settings',
    subtitle: 'Customize your content preferences',
    icon: <AlertTriangle className="w-8 h-8" />,
  },
  {
    id: 'ready',
    title: "You're All Set!",
    subtitle: 'Begin your adventure',
    icon: <Play className="w-8 h-8" />,
  },
];

interface FirstTimeWizardProps {
  onComplete: (selections: {
    colorTheme: string;
    preset: PresetId;
    adultContent: boolean;
  }) => void;
  forceShow?: boolean;
}

export function FirstTimeWizard({ onComplete, forceShow = false }: FirstTimeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(() => {
    if (forceShow) return true;
    return !localStorage.getItem(WIZARD_COMPLETED_KEY);
  });
  
  // User selections
  const [selectedTheme, setSelectedTheme] = useState<string>('violet');
  const [selectedPreset, setSelectedPreset] = useState<PresetId>('story');
  const [adultContent, setAdultContent] = useState(false);

  const handleThemeSelect = useCallback((themeId: string) => {
    setSelectedTheme(themeId);
    // Live preview the theme
    const preset = COLOR_PRESETS.find(p => p.id === themeId);
    if (preset) {
      applyColorTheme(preset);
    }
  }, []);

  const handleComplete = useCallback(() => {
    // Save completion state
    localStorage.setItem(WIZARD_COMPLETED_KEY, 'true');
    
    // Save theme preference - applyColorTheme with isPreview=false saves it
    const themePreset = COLOR_PRESETS.find(p => p.id === selectedTheme);
    if (themePreset) {
      applyColorTheme(themePreset, false);
    }
    
    setIsVisible(false);
    onComplete({
      colorTheme: selectedTheme,
      preset: selectedPreset,
      adultContent,
    });
  }, [selectedTheme, selectedPreset, adultContent, onComplete]);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = WIZARD_STEPS[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-lg"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-primary)]/20 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{
              x: [0, -30, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[var(--accent-secondary)]/20 rounded-full blur-[80px]"
          />
        </div>

        {/* Skip button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          Skip Setup
        </Button>

        {/* Progress bar */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-1 bg-muted/30 rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full"
            style={{ background: 'var(--accent-gradient)' }}
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Main content */}
        <div className="relative z-10 w-full max-w-2xl mx-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                  className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  <div className="text-white">{step.icon}</div>
                </motion.div>
                <h1 className="text-3xl font-display text-foreground">{step.title}</h1>
                <p className="text-muted-foreground">{step.subtitle}</p>
              </div>

              {/* Step content */}
              <div className="glass-panel p-6">
                {/* Welcome Step */}
                {currentStep === 0 && (
                  <div className="text-center space-y-6 py-4">
                    <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                      Untold is a living narrative experience where <strong className="text-foreground">your choices shape the story</strong>. 
                      Powered by AI, every adventure is unique.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-2">
                        <div className="text-2xl">🎭</div>
                        <p className="text-xs text-muted-foreground">Create any character</p>
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl">🌍</div>
                        <p className="text-xs text-muted-foreground">Explore any genre</p>
                      </div>
                      <div className="space-y-2">
                        <div className="text-2xl">✨</div>
                        <p className="text-xs text-muted-foreground">Shape your destiny</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Theme Step */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                      {COLOR_PRESETS.slice(0, 8).map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleThemeSelect(preset.id)}
                          className={cn(
                            "group relative p-4 rounded-xl border-2 transition-all duration-200",
                            selectedTheme === preset.id
                              ? "border-[var(--accent-primary)] scale-105"
                              : "border-border/50 hover:border-border"
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full mx-auto mb-2 ring-2 ring-offset-2 ring-offset-background transition-all",
                              selectedTheme === preset.id ? "ring-current" : "ring-transparent"
                            )}
                            style={{ 
                              background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                              color: preset.primary,
                            }}
                          />
                          <p className="text-xs text-center text-muted-foreground group-hover:text-foreground">
                            {preset.name.split(' ')[0]}
                          </p>
                          {selectedTheme === preset.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: preset.primary }}
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preset Step */}
                {currentStep === 2 && (
                  <div className="grid grid-cols-2 gap-4">
                    {SETTINGS_PRESETS.map((preset) => (
                      <Card
                        key={preset.id}
                        className={cn(
                          "cursor-pointer transition-all duration-200 border-2",
                          selectedPreset === preset.id
                            ? "border-[var(--accent-primary)] bg-[var(--accent-bg)]"
                            : "border-border hover:border-[var(--accent-primary)]/50"
                        )}
                        onClick={() => setSelectedPreset(preset.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{preset.icon}</span>
                            <div>
                              <p className="font-medium">{preset.name}</p>
                            </div>
                            {selectedPreset === preset.id && (
                              <Check className="w-4 h-4 text-[var(--accent-primary)] ml-auto" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {preset.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Content Settings Step */}
                {currentStep === 3 && (
                  <div className="space-y-6 py-2">
                    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border/50">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div>
                          <p className="font-medium">18+ Content</p>
                          <p className="text-sm text-muted-foreground">
                            Enable mature themes, romance options, and adult content in your adventures.
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={adultContent}
                        onCheckedChange={setAdultContent}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      You can change this anytime in Settings → Gameplay
                    </p>
                  </div>
                )}

                {/* Ready Step */}
                {currentStep === 4 && (
                  <div className="text-center space-y-6 py-4">
                    <div className="space-y-2">
                      <p className="text-muted-foreground">Your selections:</p>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ 
                              background: COLOR_PRESETS.find(p => p.id === selectedTheme)?.primary 
                            }}
                          />
                          <span className="text-sm">{COLOR_PRESETS.find(p => p.id === selectedTheme)?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30">
                          <span>{SETTINGS_PRESETS.find(p => p.id === selectedPreset)?.icon}</span>
                          <span className="text-sm">{SETTINGS_PRESETS.find(p => p.id === selectedPreset)?.name}</span>
                        </div>
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center justify-center gap-2 text-[var(--accent-primary)]"
                    >
                      <Wand2 className="w-5 h-5" />
                      <span className="font-medium">Ready to begin your journey!</span>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div>
                  {currentStep > 0 && (
                    <Button variant="ghost" onClick={handlePrev} className="gap-1">
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {WIZARD_STEPS.length}
                </div>
                <Button
                  onClick={handleNext}
                  className="gap-1 min-w-[140px]"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {currentStep === WIZARD_STEPS.length - 1 ? (
                    <>
                      Start Adventure
                      <Sparkles className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook to check if first-time wizard should show
export function useFirstTimeWizard() {
  const shouldShow = !localStorage.getItem(WIZARD_COMPLETED_KEY);
  
  const reset = () => {
    localStorage.removeItem(WIZARD_COMPLETED_KEY);
  };
  
  return { shouldShow, reset };
}
