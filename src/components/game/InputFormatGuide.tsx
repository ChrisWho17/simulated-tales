/**
 * Input Format Guide - Teaches players how their text will be interpreted
 * Shows examples of dialogue, actions, and tactical directives
 */

import { useState } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  HelpCircle,
  MessageSquare,
  Swords,
  Target,
  Compass,
  Eye,
  Lightbulb,
  Quote,
  ArrowRight,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputExample {
  input: string;
  interpretation: string;
  category: 'dialogue' | 'action' | 'tactical' | 'observation' | 'vague';
}

const INPUT_CATEGORIES = {
  dialogue: {
    icon: Quote,
    label: 'Dialogue',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    description: 'Words your character speaks aloud to others',
    trigger: 'Use quotes or say/ask keywords',
    examples: [
      { input: '"Hello there"', interpretation: 'Your character speaks these words to whoever is present' },
      { input: 'say "I need your help"', interpretation: 'You address someone directly with this request' },
      { input: 'ask about the rumors', interpretation: 'You engage an NPC in conversation about this topic' },
      { input: '"Who goes there?"', interpretation: 'Your character calls out, voice sharp with challenge' },
    ],
  },
  action: {
    icon: Swords,
    label: 'Direct Action',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    description: 'Physical things your character does',
    trigger: 'Use action verbs: take, attack, open, climb, run...',
    examples: [
      { input: 'attack the guard', interpretation: 'You launch into combat, weapon ready' },
      { input: 'take the key', interpretation: 'You reach out and grab the item' },
      { input: 'climb the wall', interpretation: 'You begin scaling the surface' },
      { input: 'open the door slowly', interpretation: 'You ease the door open, checking for dangers' },
    ],
  },
  tactical: {
    icon: Target,
    label: 'Tactical Directive',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    description: 'Strategy declarations - HOW you want to approach something',
    trigger: 'Describe your approach, method, or strategy',
    examples: [
      { input: 'direct approach, neutralizing threats', interpretation: 'You abandon subtlety and move aggressively toward your objective' },
      { input: 'stealth mode, avoid detection', interpretation: 'You move silently through shadows, timing each step carefully' },
      { input: 'diplomatic solution', interpretation: 'You approach with words and empathy, seeking peaceful resolution' },
      { input: 'observe first, then act', interpretation: 'You hold position, cataloging every detail before making your move' },
      { input: 'aggressive negotiation', interpretation: 'You lean on intimidation and implied threats to get what you want' },
    ],
  },
  observation: {
    icon: Eye,
    label: 'Observation',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'Looking, examining, or gathering information',
    trigger: 'Use look, examine, search, check, investigate...',
    examples: [
      { input: 'look around', interpretation: 'Your gaze sweeps the area, noting details and dangers' },
      { input: 'examine the artifact', interpretation: 'You study the object closely, looking for clues' },
      { input: 'search the body', interpretation: 'You check for items, documents, or identifying marks' },
      { input: 'check for traps', interpretation: 'You carefully inspect for hidden dangers before proceeding' },
    ],
  },
  vague: {
    icon: Brain,
    label: 'Vague/Abstract',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    description: 'Abstract intentions - the AI will interpret your goal',
    trigger: 'Single words, emotions, or unclear goals',
    examples: [
      { input: 'wait', interpretation: 'Time passes as you hold your position, alert and watchful' },
      { input: 'think', interpretation: 'You pause to consider your options, weighing risks and rewards' },
      { input: 'careful', interpretation: 'You proceed with heightened caution, testing each step' },
      { input: 'quickly', interpretation: 'You pick up the pace, sacrificing stealth for speed' },
      { input: 'distraction', interpretation: 'You create some commotion to draw attention away' },
      { input: 'help', interpretation: 'You reach out to assist, offering whatever aid you can' },
    ],
  },
};

const COMMON_MISTAKES = [
  {
    wrong: 'direct approach, neutralizing threats',
    wrongResult: '❌ "You speak aloud: Direct approach..."',
    right: 'direct approach, neutralizing threats',
    rightResult: '✓ You stride forward aggressively, ready for violence',
    note: 'Tactical statements are now actions, not speech!',
  },
  {
    wrong: 'I say I want to fight',
    wrongResult: '❌ Confusing - are you speaking or fighting?',
    right: '"I challenge you to a duel"',
    rightResult: '✓ Your character issues a clear verbal challenge',
    note: 'Use quotes for speech, verbs for actions',
  },
];

export function InputFormatGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary gap-1"
        >
          <Lightbulb className="h-3 w-3" />
          <span className="hidden sm:inline">Input Guide</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[360px] sm:w-[420px] p-0 max-h-[70vh]" 
        side="top" 
        align="start"
      >
        <div className="p-3 border-b border-border/50 bg-muted/30">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            How Your Input Is Interpreted
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            The AI reads your intent, not just your words. Here's how different formats are understood.
          </p>
        </div>
        
        <ScrollArea className="max-h-[50vh]">
          <div className="p-3 space-y-4">
            {/* Category explanations */}
            {Object.entries(INPUT_CATEGORIES).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <div key={key} className={cn("rounded-lg border p-3", category.bgColor)}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn("h-4 w-4", category.color)} />
                    <span className={cn("font-medium text-sm", category.color)}>
                      {category.label}
                    </span>
                    <Badge variant="outline" className="text-[9px] ml-auto">
                      {category.trigger}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {category.description}
                  </p>
                  <div className="space-y-1.5">
                    {category.examples.slice(0, 2).map((ex, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <code className="bg-background/50 px-1.5 py-0.5 rounded text-foreground shrink-0">
                          {ex.input}
                        </code>
                        <ArrowRight className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground italic">
                          {ex.interpretation.slice(0, 60)}...
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            <Separator />
            
            {/* Deep Dive: Vague Inputs */}
            <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
              <h5 className="font-medium text-sm text-purple-400 mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Deep Dive: Vague & Abstract Inputs
              </h5>
              <p className="text-xs text-muted-foreground mb-3">
                Even single words or abstract concepts are interpreted intelligently:
              </p>
              <div className="space-y-2">
                {[
                  { input: 'no', meaning: 'Refusal or rejection in the current context' },
                  { input: 'yes', meaning: 'Agreement or acceptance to what was offered' },
                  { input: 'maybe', meaning: 'Hesitation, buying time, or weighing options' },
                  { input: 'run', meaning: 'Flee the current situation immediately' },
                  { input: 'fight', meaning: 'Engage in combat with available targets' },
                  { input: 'hide', meaning: 'Conceal yourself from detection' },
                  { input: 'trust', meaning: 'Act on faith in someone or something' },
                  { input: 'doubt', meaning: 'Question or investigate something suspicious' },
                  { input: 'patience', meaning: 'Wait and observe, letting events unfold' },
                  { input: 'anger', meaning: 'Let frustration drive your next action' },
                  { input: 'mercy', meaning: 'Show compassion, spare someone' },
                  { input: 'justice', meaning: 'Act according to moral principle' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <code className="bg-purple-500/20 px-1.5 py-0.5 rounded text-purple-300 w-16 text-center">
                      {item.input}
                    </code>
                    <span className="text-muted-foreground">{item.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* Pro Tips */}
            <div className="rounded-lg bg-muted/30 p-3">
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                Pro Tips
              </h5>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Quotes = Speech:</strong> "Hello" makes your character speak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Verbs = Action:</strong> "attack" makes your character fight</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Tactics = Approach:</strong> "stealth approach" sets your method</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Be Creative:</strong> The AI understands context and adapts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span><strong>Single Words Work:</strong> "careful" or "quickly" modify actions</span>
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-2 border-t border-border/50 bg-muted/30">
          <p className="text-[10px] text-center text-muted-foreground">
            The AI interprets intent, not literal text. Be expressive!
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact inline hint for the input field
export function InputHint({ inputText }: { inputText: string }) {
  if (!inputText.trim()) return null;
  
  const trimmed = inputText.trim().toLowerCase();
  
  // Detect input type
  let hint = '';
  let color = 'text-muted-foreground';
  
  if (inputText.includes('"') || inputText.includes("'")) {
    hint = '💬 Dialogue';
    color = 'text-blue-400';
  } else if (/^(attack|fight|strike|hit|punch|kick|shoot)/i.test(trimmed)) {
    hint = '⚔️ Combat';
    color = 'text-red-400';
  } else if (/^(take|grab|pick|steal|loot)/i.test(trimmed)) {
    hint = '🤲 Take';
    color = 'text-amber-400';
  } else if (/^(look|examine|search|check|investigate|observe)/i.test(trimmed)) {
    hint = '👁️ Observe';
    color = 'text-emerald-400';
  } else if (/^(go|walk|run|move|head|travel|enter|exit|leave)/i.test(trimmed)) {
    hint = '🚶 Move';
    color = 'text-cyan-400';
  } else if (/^(say|ask|tell|speak|shout|whisper)/i.test(trimmed)) {
    hint = '💬 Speech';
    color = 'text-blue-400';
  } else if (/approach|mode|strategy|tactic|method|style/i.test(trimmed) || 
             /^(stealth|direct|careful|aggressive|defensive|diplomatic)/i.test(trimmed)) {
    hint = '🎯 Tactic';
    color = 'text-amber-400';
  } else if (trimmed.length <= 15 && !/\s/.test(trimmed)) {
    hint = '🧠 Intent';
    color = 'text-purple-400';
  }
  
  if (!hint) return null;
  
  return (
    <span className={cn("text-[10px]", color)}>
      {hint}
    </span>
  );
}

export default InputFormatGuide;
