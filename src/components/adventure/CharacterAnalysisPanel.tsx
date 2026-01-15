import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Brain, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Target, Heart, Shield } from 'lucide-react';
import { analyzeCharacter, CharacterAnalysis, CharacterAnalysisRequest } from '@/game/characterAISystem';
import { Backstory, PersonalityTrait, CharacterFlaw } from '@/game/characterDevelopmentSystem';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CharacterAnalysisPanelProps {
  characterName: string;
  backstory?: Backstory;
  traits: PersonalityTrait[];
  flaws: CharacterFlaw[];
  significantChoices?: string[];
  relationships?: Array<{ name: string; type: string; quality: string }>;
  majorEvents?: string[];
  className?: string;
}

export function CharacterAnalysisPanel({
  characterName,
  backstory,
  traits,
  flaws,
  significantChoices,
  relationships,
  majorEvents,
  className,
}: CharacterAnalysisPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CharacterAnalysis | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personality']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    try {
      const request: CharacterAnalysisRequest = {
        characterName,
        backstory,
        traits,
        flaws,
        significantChoices,
        relationships,
        majorEvents,
      };
      
      const result = await analyzeCharacter(request);
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to analyze character:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!analysis) {
    return (
      <div className={cn("p-6 rounded-lg border border-dashed border-border/50 bg-muted/20", className)}>
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <div>
            <h3 className="font-semibold mb-1">Character Psychology</h3>
            <p className="text-sm text-muted-foreground">
              Generate a deep psychological analysis of {characterName || 'your character'}
            </p>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || traits.length === 0}
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Psychology...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Analyze Character
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const { personalityProfile, psychologicalInsights, arcPotential, narrativeHooks } = analysis;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Psychological Profile</h3>
        </div>
        <Button onClick={handleAnalyze} variant="ghost" size="sm" disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {/* Core Identity */}
          <Collapsible open={expandedSections.has('personality')} onOpenChange={() => toggleSection('personality')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium">Core Identity</span>
              </div>
              {expandedSections.has('personality') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 px-3 space-y-2">
              <p className="text-sm">{personalityProfile.coreIdentity}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Motivators</p>
                  {personalityProfile.primaryMotivators.map((m, i) => (
                    <span key={i} className="block text-emerald-400">• {m}</span>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Deep Fears</p>
                  {personalityProfile.deepFears.map((f, i) => (
                    <span key={i} className="block text-destructive/80">• {f}</span>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Psychological Insights */}
          <Collapsible open={expandedSections.has('psychology')} onOpenChange={() => toggleSection('psychology')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="font-medium">Psychological Patterns</span>
              </div>
              {expandedSections.has('psychology') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 px-3 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Attachment Style:</span> {psychologicalInsights.attachmentStyle}</p>
              <p><span className="text-muted-foreground">Conflict Approach:</span> {psychologicalInsights.conflictApproach}</p>
              <p><span className="text-muted-foreground">Stress Response:</span> {psychologicalInsights.stressResponse}</p>
              <p><span className="text-muted-foreground">Moral Framework:</span> {psychologicalInsights.moralFramework}</p>
            </CollapsibleContent>
          </Collapsible>

          {/* Arc Potential */}
          <Collapsible open={expandedSections.has('arcs')} onOpenChange={() => toggleSection('arcs')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-medium">Story Arc Potential</span>
              </div>
              {expandedSections.has('arcs') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 px-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Growth Areas</p>
                  {arcPotential.likelyGrowthAreas.map((g, i) => (
                    <span key={i} className="block text-emerald-400">• {g}</span>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Vulnerabilities</p>
                  {arcPotential.vulnerabilities.map((v, i) => (
                    <span key={i} className="block text-amber-400">• {v}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Potential Character Arcs</p>
                {arcPotential.potentialArcs.map((arc, i) => (
                  <div key={i} className="p-2 rounded bg-background/50 border border-border/30">
                    <p className="font-medium text-sm">{arc.name}</p>
                    <p className="text-xs text-muted-foreground">{arc.description}</p>
                    <p className="text-xs text-primary/70 mt-1">Trigger: {arc.trigger}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Narrative Hooks */}
          <Collapsible open={expandedSections.has('hooks')} onOpenChange={() => toggleSection('hooks')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                <span className="font-medium">Story Hooks</span>
              </div>
              {expandedSections.has('hooks') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 px-3">
              <ul className="space-y-1 text-sm">
                {narrativeHooks.map((hook, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{hook}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}
