// System Reference Highlighter
// Detects and highlights when game systems are referenced in AI narrative

export type SystemType = 
  | 'armor' 
  | 'weather' 
  | 'wound' 
  | 'mood' 
  | 'time' 
  | 'temperature' 
  | 'fatigue' 
  | 'hunger'
  | 'combat'
  | 'stealth'
  | 'social';

export interface SystemReference {
  system: SystemType;
  keyword: string;
  startIndex: number;
  endIndex: number;
}

// System-specific keyword patterns (case-insensitive matching)
const SYSTEM_PATTERNS: Record<SystemType, RegExp[]> = {
  armor: [
    /\b(heavy armor|plate armor|chainmail|leather armor|armored|armor(?:ed)?|plate|mail|brigandine|cuirass|gauntlets?|helm(?:et)?|pauldrons?|greaves?|vambraces?|protective gear|kevlar|ballistic vest|body armor|flak jacket)\b/gi,
    /\b(weighs? (?:you )?down|encumber(?:ed|ing)?|clank(?:ing|s)?|rattl(?:e|ing)|metal(?:lic)? (?:sound|clatter)|heavy (?:steps?|footsteps?|tread)|lumbering)\b/gi,
  ],
  weather: [
    /\b(rain(?:ing|drops?|fall)?|storm(?:y|ing)?|thunder(?:ing)?|lightning|downpour|drizzl(?:e|ing)|pour(?:ing)?|shower(?:s)?|wet|damp|humid(?:ity)?|muggy)\b/gi,
    /\b(snow(?:ing|fall|flakes?)?|blizzard|frost(?:y|ed)?|freez(?:e|ing)|ice|icy|sleet|hail(?:ing)?|cold snap|winter)\b/gi,
    /\b(wind(?:y)?|gust(?:s|y)?|breez(?:e|y)|gale|howl(?:ing)?|whistl(?:e|ing))\b/gi,
    /\b(fog(?:gy)?|mist(?:y)?|haz(?:e|y)|overcast|cloud(?:y|s)?|grey skies?|sun(?:ny|light|shine)?|clear (?:sky|skies|weather))\b/gi,
  ],
  wound: [
    /\b(wound(?:ed|s)?|injur(?:y|ed|ies)|bleed(?:ing|s)?|blood(?:y|ied)?|cut(?:s)?|gash(?:es)?|lacerat(?:ion|ed)|bruis(?:e|ed|es)|broken|fractur(?:e|ed)|sprain(?:ed)?)\b/gi,
    /\b(pain(?:ful)?|ach(?:e|ing|es)|throb(?:bing|s)?|sting(?:s|ing)?|burn(?:s|ing)?|sore(?:ness)?|tender|wince|grimace|limp(?:ing)?|hobbl(?:e|ing))\b/gi,
    /\b(patch(?:ed)? up|bandage(?:d|s)?|dress(?:ed|ing) (?:the )?wound|stitch(?:es|ed)?|heal(?:ing|ed)?|recover(?:ing|y)?)\b/gi,
  ],
  mood: [
    /\b(happi(?:ness|ly|er)?|joy(?:ful|ous)?|elat(?:ed|ion)|excit(?:ed|ement)|thrill(?:ed)?|delight(?:ed)?|euphor(?:ic|ia))\b/gi,
    /\b(sad(?:ness|ly)?|sorrow(?:ful)?|melanchol(?:y|ic)|depress(?:ed|ion)|gloom(?:y)?|despair(?:ing)?|grief|mourn(?:ing|ful)?)\b/gi,
    /\b(ang(?:ry|er|rily)|furi(?:ous|y)|rage|irat(?:e)|outrag(?:ed|e)|incens(?:ed)|livid|seeth(?:e|ing))\b/gi,
    /\b(fear(?:ful)?|scar(?:ed|y)|terrif(?:ied|ying)|frighten(?:ed|ing)|dread(?:ful)?|anxi(?:ous|ety)|nerv(?:ous|e)|panic(?:ked)?)\b/gi,
    /\b(calm(?:ly)?|serene|peaceful|tranquil|relax(?:ed)?|at ease|composed|collected)\b/gi,
  ],
  time: [
    /\b(dawn|sunrise|daybreak|first light|early morning|morning light)\b/gi,
    /\b(midday|noon|high sun|afternoon|mid-afternoon)\b/gi,
    /\b(dusk|sunset|twilight|evening|nightfall|late evening)\b/gi,
    /\b(night(?:time)?|midnight|dead of night|small hours|witching hour|moonlight|starlight)\b/gi,
    /\b(hours? pass(?:ed)?|time (?:passes?|slips?)|as (?:the )?(?:day|night) (?:wears?|goes?) on)\b/gi,
  ],
  temperature: [
    /\b(hot|heat(?:ed)?|warm(?:th)?|swelter(?:ing)?|scorch(?:ing)?|bak(?:e|ing)|sweat(?:ing|y)?|humid)\b/gi,
    /\b(cold|chill(?:y|ed|ing)?|freez(?:e|ing)|frost(?:y)?|icy|shiver(?:ing|s)?|numb(?:ing)?|bitter (?:cold)?)\b/gi,
    /\b(mild|temperate|comfortable|pleasant|cool(?:ing)?|refresh(?:ing)?)\b/gi,
  ],
  fatigue: [
    /\b(tir(?:ed|edness)|exhaust(?:ed|ion)|fatigu(?:e|ed)|weary|worn(?:-out| out)?|drain(?:ed)?|spent)\b/gi,
    /\b(yawn(?:ing|s)?|drowsy|sleepy|groggy|sluggish|letharg(?:y|ic)|heavy (?:eyelids?|limbs?))\b/gi,
    /\b(rest(?:ed|ing)?|recuperat(?:e|ing)|recover(?:ing)?|refresh(?:ed)?|revitaliz(?:ed)?|energiz(?:ed)?|second wind)\b/gi,
  ],
  hunger: [
    /\b(hungr(?:y|ier)|hunger|famish(?:ed)?|starv(?:e|ing|ed)?|ravenous|appetite|craving)\b/gi,
    /\b(stomach (?:growls?|rumbles?|aches?)|belly (?:aches?|rumbles?)|pang(?:s)? of hunger)\b/gi,
    /\b(eat(?:ing|en)?|fed|full|satiat(?:ed)?|satisf(?:ied|ying)|nourish(?:ed|ing)?|meal|food)\b/gi,
    /\b(thirst(?:y)?|parched|dehydrat(?:ed|ion)|dry (?:throat|mouth)|drink(?:ing)?|water)\b/gi,
  ],
  combat: [
    /\b(fight(?:ing|s)?|combat|battle|brawl|clash|skirmish|duel|melee)\b/gi,
    /\b(attack(?:s|ed|ing)?|strike(?:s)?|slash(?:es|ed)?|stab(?:s|bed)?|thrust(?:s)?|swing(?:s)?|parr(?:y|ied)|block(?:ed|ing)?|dodge(?:d|s)?)\b/gi,
    /\b(weapon(?:s)?|sword|blade|dagger|axe|mace|spear|bow|arrow|gun|pistol|rifle|firearm)\b/gi,
    /\b(defend(?:ing|s)?|defensive|guard|shield|protect(?:ion|ing)?)\b/gi,
  ],
  stealth: [
    /\b(sneak(?:ing|s)?|stealth(?:y|ily)?|creep(?:ing|s)?|prowl(?:ing|s)?|skulk(?:ing)?|slither(?:ing)?)\b/gi,
    /\b(hide|hidden|hiding|conceal(?:ed|ing)?|shadow(?:s|y)?|dark(?:ness|ened)?|cover)\b/gi,
    /\b(quiet(?:ly)?|silent(?:ly)?|noiseless(?:ly)?|undetect(?:ed)|unseen|unnoticed|invisible)\b/gi,
    /\b(spot(?:ted)?|detect(?:ed)?|notice(?:d)?|see(?:n)?|hear(?:d)?|alert(?:ed)?|aware)\b/gi,
  ],
  social: [
    /\b(persuad(?:e|ed|ing)|convinc(?:e|ed|ing)|charm(?:ed|ing)?|flatter(?:y|ed)?|seduc(?:e|ed|tion)?)\b/gi,
    /\b(intimidat(?:e|ed|ing|ion)|threaten(?:ed|ing)?|bully|coerce|pressure)\b/gi,
    /\b(deceiv(?:e|ed|ing)|li(?:e|ed|es)|bluff(?:ed|ing)?|trick(?:ed)?|manipulat(?:e|ed|ion))\b/gi,
    /\b(trust(?:ed|ing)?|respect(?:ed)?|admire|like(?:d)?|friend(?:ly|ship)?|ally|allies|bond(?:ed)?)\b/gi,
    /\b(distrust|suspic(?:ion|ious)|hostil(?:e|ity)|enem(?:y|ies)|rival(?:ry)?|hatred|dislike)\b/gi,
  ],
};

// System display configuration
export const SYSTEM_CONFIG: Record<SystemType, { 
  label: string; 
  icon: string; 
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  armor: { 
    label: 'Armor', 
    icon: '🛡️',
    color: 'hsl(45 80% 60%)',
    bgColor: 'hsl(45 80% 60% / 0.15)',
    borderColor: 'hsl(45 80% 60% / 0.4)',
  },
  weather: { 
    label: 'Weather', 
    icon: '🌧️',
    color: 'hsl(200 80% 60%)',
    bgColor: 'hsl(200 80% 60% / 0.15)',
    borderColor: 'hsl(200 80% 60% / 0.4)',
  },
  wound: { 
    label: 'Wounds', 
    icon: '🩸',
    color: 'hsl(0 70% 55%)',
    bgColor: 'hsl(0 70% 55% / 0.15)',
    borderColor: 'hsl(0 70% 55% / 0.4)',
  },
  mood: { 
    label: 'Mood', 
    icon: '💭',
    color: 'hsl(280 70% 65%)',
    bgColor: 'hsl(280 70% 65% / 0.15)',
    borderColor: 'hsl(280 70% 65% / 0.4)',
  },
  time: { 
    label: 'Time', 
    icon: '🕐',
    color: 'hsl(35 80% 55%)',
    bgColor: 'hsl(35 80% 55% / 0.15)',
    borderColor: 'hsl(35 80% 55% / 0.4)',
  },
  temperature: { 
    label: 'Temperature', 
    icon: '🌡️',
    color: 'hsl(15 80% 55%)',
    bgColor: 'hsl(15 80% 55% / 0.15)',
    borderColor: 'hsl(15 80% 55% / 0.4)',
  },
  fatigue: { 
    label: 'Fatigue', 
    icon: '😴',
    color: 'hsl(220 60% 60%)',
    bgColor: 'hsl(220 60% 60% / 0.15)',
    borderColor: 'hsl(220 60% 60% / 0.4)',
  },
  hunger: { 
    label: 'Hunger', 
    icon: '🍖',
    color: 'hsl(25 70% 50%)',
    bgColor: 'hsl(25 70% 50% / 0.15)',
    borderColor: 'hsl(25 70% 50% / 0.4)',
  },
  combat: { 
    label: 'Combat', 
    icon: '⚔️',
    color: 'hsl(350 80% 55%)',
    bgColor: 'hsl(350 80% 55% / 0.15)',
    borderColor: 'hsl(350 80% 55% / 0.4)',
  },
  stealth: { 
    label: 'Stealth', 
    icon: '👁️',
    color: 'hsl(260 50% 50%)',
    bgColor: 'hsl(260 50% 50% / 0.15)',
    borderColor: 'hsl(260 50% 50% / 0.4)',
  },
  social: { 
    label: 'Social', 
    icon: '💬',
    color: 'hsl(160 60% 45%)',
    bgColor: 'hsl(160 60% 45% / 0.15)',
    borderColor: 'hsl(160 60% 45% / 0.4)',
  },
};

/**
 * Find all system references in a text
 */
export function findSystemReferences(text: string): SystemReference[] {
  const references: SystemReference[] = [];
  const foundRanges = new Set<string>(); // Avoid duplicate overlapping matches
  
  for (const [system, patterns] of Object.entries(SYSTEM_PATTERNS) as [SystemType, RegExp[]][]) {
    for (const pattern of patterns) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const rangeKey = `${match.index}-${match.index + match[0].length}`;
        
        // Skip if this range overlaps with an existing match
        if (!foundRanges.has(rangeKey)) {
          foundRanges.add(rangeKey);
          references.push({
            system,
            keyword: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          });
        }
      }
    }
  }
  
  // Sort by start index
  return references.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Get unique systems referenced in text
 */
export function getReferencedSystems(text: string): SystemType[] {
  const refs = findSystemReferences(text);
  return [...new Set(refs.map(r => r.system))];
}

/**
 * Count references per system
 */
export function countSystemReferences(text: string): Record<SystemType, number> {
  const refs = findSystemReferences(text);
  const counts = {} as Record<SystemType, number>;
  
  for (const system of Object.keys(SYSTEM_PATTERNS) as SystemType[]) {
    counts[system] = refs.filter(r => r.system === system).length;
  }
  
  return counts;
}

/**
 * Check if text references a specific system
 */
export function hasSystemReference(text: string, system: SystemType): boolean {
  const patterns = SYSTEM_PATTERNS[system];
  return patterns.some(pattern => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}
