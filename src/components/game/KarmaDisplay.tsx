import { MoralityState, MoralAlignment, MoralPath } from '@/types/moralitySystem';
import { Sparkles, Skull, Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KarmaDisplayProps {
  morality: MoralityState;
  compact?: boolean;
}

const alignmentConfig: Record<MoralAlignment, { label: string; icon: typeof Sparkles; color: string; bgColor: string; glowColor: string }> = {
  virtuous: {
    label: 'Virtuous',
    icon: Sparkles,
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/20',
    glowColor: 'shadow-amber-500/50',
  },
  neutral: {
    label: 'Neutral',
    icon: Scale,
    color: 'text-slate-300',
    bgColor: 'bg-slate-500/20',
    glowColor: 'shadow-slate-500/30',
  },
  corrupt: {
    label: 'Corrupt',
    icon: Skull,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    glowColor: 'shadow-red-500/50',
  },
};

const pathConfig: Record<MoralPath, { label: string; icon: typeof TrendingUp; description: string }> = {
  redemption: {
    label: 'Path of Redemption',
    icon: TrendingUp,
    description: 'Walking toward the light',
  },
  balance: {
    label: 'Path of Balance',
    icon: Minus,
    description: 'Walking the middle way',
  },
  corruption: {
    label: 'Path of Corruption',
    icon: TrendingDown,
    description: 'Descending into darkness',
  },
};

export function KarmaDisplay({ morality, compact = false }: KarmaDisplayProps) {
  const alignment = alignmentConfig[morality.alignment];
  const path = pathConfig[morality.path];
  const AlignmentIcon = alignment.icon;
  const PathIcon = path.icon;
  
  // Calculate position on the karma bar (0-100 scale, where 50 is neutral)
  const karmaPosition = ((morality.karmaPoints + 100) / 200) * 100;
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${alignment.bgColor} border border-border/30 cursor-help transition-all hover:scale-105`}>
              <AlignmentIcon className={`w-4 h-4 ${alignment.color}`} />
              <span className={`text-xs font-medium ${alignment.color}`}>
                {morality.karmaPoints > 0 ? '+' : ''}{morality.karmaPoints}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className={`font-semibold ${alignment.color}`}>{alignment.label}</p>
              <p className="text-xs text-muted-foreground">{path.description}</p>
              <div className="h-2 bg-gradient-to-r from-red-500 via-slate-500 to-amber-500 rounded-full overflow-hidden">
                <div 
                  className="h-full w-1 bg-white shadow-lg transition-all duration-500"
                  style={{ marginLeft: `calc(${karmaPosition}% - 2px)` }}
                />
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={`p-4 rounded-xl ${alignment.bgColor} border border-border/30 shadow-lg ${alignment.glowColor} backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${alignment.bgColor} border border-border/30`}>
            <AlignmentIcon className={`w-5 h-5 ${alignment.color}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${alignment.color}`}>{alignment.label}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <PathIcon className="w-3 h-3" />
              <span>{path.label}</span>
            </div>
          </div>
        </div>
        <div className={`text-2xl font-bold ${alignment.color}`}>
          {morality.karmaPoints > 0 ? '+' : ''}{morality.karmaPoints}
        </div>
      </div>

      {/* Karma Bar */}
      <div className="relative">
        <div className="h-3 bg-gradient-to-r from-red-600 via-slate-600 to-amber-500 rounded-full overflow-hidden">
          {/* Marker */}
          <div 
            className="absolute top-0 h-3 w-1 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-700 ease-out"
            style={{ left: `calc(${karmaPosition}% - 2px)` }}
          />
        </div>
        {/* Labels */}
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          <span className="text-red-400">Corrupt</span>
          <span className="text-slate-400">Neutral</span>
          <span className="text-amber-300">Virtuous</span>
        </div>
      </div>

      {/* Recent Choices */}
      {morality.pivotalChoices.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/20">
          <p className="text-xs text-muted-foreground mb-2">Recent Pivotal Choices:</p>
          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {morality.pivotalChoices.slice(-3).reverse().map((choice) => (
              <div 
                key={choice.id}
                className={`text-xs px-2 py-1 rounded flex items-center justify-between ${
                  choice.consequence === 'good' 
                    ? 'bg-amber-500/10 text-amber-300' 
                    : choice.consequence === 'evil'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-slate-500/10 text-slate-300'
                }`}
              >
                <span className="truncate flex-1">{choice.description}</span>
                <span className="ml-2 font-medium">
                  {choice.karmaChange > 0 ? '+' : ''}{choice.karmaChange}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function KarmaMiniIndicator({ morality }: { morality: MoralityState }) {
  const alignment = alignmentConfig[morality.alignment];
  const AlignmentIcon = alignment.icon;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${alignment.bgColor} border border-border/20`}>
      <AlignmentIcon className={`w-3 h-3 ${alignment.color}`} />
      <span className={`text-xs font-medium ${alignment.color}`}>
        {morality.karmaPoints > 0 ? '+' : ''}{morality.karmaPoints}
      </span>
    </div>
  );
}
