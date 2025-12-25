// ============================================================================
// UNIFIED MOOD SYSTEM - Genre-adaptive character emotions
// Based on PDF design: Color-coded moods with immersive genre wording
// ============================================================================

import { GameGenre } from '@/types/genreData';

// ===== CORE MOOD TYPES =====
// Primary moods from PDF design with extended emotional range

export type CoreMoodType = 
  | 'lusty'      // Pink - Romantic, desiring, impulsive
  | 'mad'        // Red - Angry, aggressive, enraged
  | 'annoyed'    // Orange - Irritated, impatient, frustrated
  | 'neutral'    // Grey - Calm, baseline, no strong emotion
  | 'happy'      // Green - Pleasant, optimistic, friendly
  | 'sad'        // Blue - Unhappy, gloomy, remorseful
  | 'depressed'  // Purple - Very low, hopeless, dejected
  | 'fearful'    // Yellow - Afraid, anxious, scared
  | 'determined' // White - Resolute, focused, driven
  | 'suspicious' // Cyan - Wary, distrustful, guarded;

// ===== MOOD COLOR MAPPING =====
// Subtle frosted glows at 25-35% opacity per strict design spec
// Colors desaturated to match dark fantasy palette

export interface MoodColorConfig {
  primary: string;      // Hex color (desaturated for elegance)
  bg: string;           // Tailwind bg class
  glow: string;         // RGBA for text-shadow (25-35% opacity for subtle frost)
  glowStrong: string;   // RGBA for name frost (slightly more visible)
  border: string;       // Border color
  opacity: number;      // Base opacity (0.25-0.35)
  glowRadius: number;   // Blur radius in px (subtle, not bold)
}

export const MOOD_COLORS: Record<CoreMoodType, MoodColorConfig> = {
  lusty: {
    primary: '#E68AB5',      // Soft pink
    bg: 'bg-pink-400/10',
    glow: 'rgba(230, 138, 181, 0.28)',
    glowStrong: 'rgba(230, 138, 181, 0.4)',
    border: '#E68AB5',
    opacity: 0.3,
    glowRadius: 5
  },
  mad: {
    primary: '#BB3333',      // Deep crimson
    bg: 'bg-red-800/10',
    glow: 'rgba(187, 51, 51, 0.32)',
    glowStrong: 'rgba(187, 51, 51, 0.45)',
    border: '#BB3333',
    opacity: 0.35,
    glowRadius: 6
  },
  annoyed: {
    primary: '#D97706',      // Muted amber
    bg: 'bg-amber-600/10',
    glow: 'rgba(217, 119, 6, 0.28)',
    glowStrong: 'rgba(217, 119, 6, 0.4)',
    border: '#D97706',
    opacity: 0.3,
    glowRadius: 4
  },
  neutral: {
    primary: '#9ca3af',
    bg: 'bg-gray-400/5',
    glow: 'rgba(156, 163, 175, 0.15)',
    glowStrong: 'rgba(156, 163, 175, 0.25)',
    border: '#9ca3af',
    opacity: 0.2,
    glowRadius: 3
  },
  happy: {
    primary: '#F4D35E',      // Warm gold
    bg: 'bg-amber-300/10',
    glow: 'rgba(244, 211, 94, 0.3)',
    glowStrong: 'rgba(244, 211, 94, 0.42)',
    border: '#F4D35E',
    opacity: 0.32,
    glowRadius: 5
  },
  sad: {
    primary: '#8899CC',      // Grey-blue
    bg: 'bg-slate-400/10',
    glow: 'rgba(136, 153, 204, 0.28)',
    glowStrong: 'rgba(136, 153, 204, 0.4)',
    border: '#8899CC',
    opacity: 0.3,
    glowRadius: 4
  },
  depressed: {
    primary: '#6B5B95',      // Muted purple-grey
    bg: 'bg-purple-800/10',
    glow: 'rgba(107, 91, 149, 0.28)',
    glowStrong: 'rgba(107, 91, 149, 0.4)',
    border: '#6B5B95',
    opacity: 0.3,
    glowRadius: 4
  },
  fearful: {
    primary: '#7DAFFF',      // Pale icy blue
    bg: 'bg-blue-300/10',
    glow: 'rgba(125, 175, 255, 0.3)',
    glowStrong: 'rgba(125, 175, 255, 0.42)',
    border: '#7DAFFF',
    opacity: 0.32,
    glowRadius: 5
  },
  determined: {
    primary: '#E8E8E8',      // White-grey
    bg: 'bg-slate-100/10',
    glow: 'rgba(232, 232, 232, 0.3)',
    glowStrong: 'rgba(232, 232, 232, 0.42)',
    border: '#E8E8E8',
    opacity: 0.32,
    glowRadius: 5
  },
  suspicious: {
    primary: '#5EADB0',      // Soft teal
    bg: 'bg-teal-500/10',
    glow: 'rgba(94, 173, 176, 0.28)',
    glowStrong: 'rgba(94, 173, 176, 0.4)',
    border: '#5EADB0',
    opacity: 0.3,
    glowRadius: 4
  }
};

// ===== GENRE-SPECIFIC MOOD WORDING =====
// Each genre has unique flavor text for moods to increase immersion

interface GenreMoodDescriptor {
  label: string;           // Display name
  emoji: string;           // Icon/emoji
  internalState: string[]; // How character feels inside
  physicalSigns: string[]; // Visible body language
  dialogueTone: string;    // How they speak
  actionFlavor: string;    // How they act
  npcReaction: string;     // How NPCs perceive them
}

export const GENRE_MOOD_DESCRIPTORS: Record<GameGenre, Record<CoreMoodType, GenreMoodDescriptor>> = {
  fantasy: {
    lusty: {
      label: 'Enamored',
      emoji: '💗',
      internalState: ['desire stirs within like a warming flame', 'your heart races with longing', 'romantic fantasies cloud your thoughts'],
      physicalSigns: ['flushed cheeks', 'lingering gazes', 'leaning closer'],
      dialogueTone: 'flirtatious and warm',
      actionFlavor: 'with passionate intent',
      npcReaction: 'NPCs notice your amorous disposition and may respond with interest or awkwardness'
    },
    mad: {
      label: 'Wrathful',
      emoji: '⚔️',
      internalState: ['righteous fury burns in your veins', 'rage worthy of a berserker rises', 'your blood boils with indignation'],
      physicalSigns: ['clenched jaw', 'flashing eyes', 'white-knuckled fists'],
      dialogueTone: 'thunderous and commanding',
      actionFlavor: 'with wrathful purpose',
      npcReaction: 'NPCs tread carefully around your fury, some cowering while others meet it with steel'
    },
    annoyed: {
      label: 'Vexed',
      emoji: '😤',
      internalState: ['patience wears thin like old parchment', 'frustration gnaws at your composure', 'irritation prickles beneath your skin'],
      physicalSigns: ['tight expression', 'sharp sighs', 'crossed arms'],
      dialogueTone: 'curt and impatient',
      actionFlavor: 'with barely contained frustration',
      npcReaction: 'NPCs sense your shortened temper and offer more direct answers'
    },
    neutral: {
      label: 'Composed',
      emoji: '⚖️',
      internalState: ['inner peace holds like still water', 'thoughts flow clear and untroubled', 'you are centered and balanced'],
      physicalSigns: ['steady gaze', 'relaxed posture', 'measured breathing'],
      dialogueTone: 'calm and measured',
      actionFlavor: 'with careful deliberation',
      npcReaction: 'NPCs engage with you as an equal, their guard neither up nor down'
    },
    happy: {
      label: 'Mirthful',
      emoji: '✨',
      internalState: ['joy bubbles up like spring water', 'spirits soar on blessed winds', 'warmth fills your heart like summer sun'],
      physicalSigns: ['bright smile', 'light step', 'eyes twinkling'],
      dialogueTone: 'cheerful and warm',
      actionFlavor: 'with buoyant enthusiasm',
      npcReaction: 'NPCs respond to your good cheer with friendliness and openness'
    },
    sad: {
      label: 'Melancholic',
      emoji: '🌧️',
      internalState: ['sorrow weighs heavy as chain mail', 'grief clings like morning mist', 'your heart aches with loss'],
      physicalSigns: ['downcast eyes', 'heavy steps', 'slumped shoulders'],
      dialogueTone: 'somber and quiet',
      actionFlavor: 'with weary resignation',
      npcReaction: 'Compassionate NPCs offer comfort; others grow uneasy around your melancholy'
    },
    depressed: {
      label: 'Desolate',
      emoji: '🌑',
      internalState: ['darkness consumes all hope like shadow', 'despair coils around your soul', 'nothing seems worth the effort anymore'],
      physicalSigns: ['hollow gaze', 'listless movements', 'pale complexion'],
      dialogueTone: 'hollow and distant',
      actionFlavor: 'with numb detachment',
      npcReaction: 'NPCs express concern for your wellbeing or avoid you entirely'
    },
    fearful: {
      label: 'Dread-Touched',
      emoji: '👁️',
      internalState: ['primal fear grips your heart', 'shadows seem to reach for you', 'every sound makes you flinch'],
      physicalSigns: ['wide eyes', 'trembling hands', 'darting glances'],
      dialogueTone: 'nervous and hesitant',
      actionFlavor: 'with wary caution',
      npcReaction: 'NPCs may offer protection or exploit your vulnerability'
    },
    determined: {
      label: 'Resolute',
      emoji: '🛡️',
      internalState: ['iron will hardens within you', 'nothing shall break your resolve', 'purpose burns bright as dragon fire'],
      physicalSigns: ['set jaw', 'focused gaze', 'squared shoulders'],
      dialogueTone: 'firm and unwavering',
      actionFlavor: 'with steely resolve',
      npcReaction: 'NPCs respect your determination and take you more seriously'
    },
    suspicious: {
      label: 'Wary',
      emoji: '🔮',
      internalState: ['distrust colors every word you hear', 'instincts whisper of treachery', 'you sense deception in the air'],
      physicalSigns: ['narrowed eyes', 'guarded stance', 'hand near weapon'],
      dialogueTone: 'probing and careful',
      actionFlavor: 'with guarded caution',
      npcReaction: 'NPCs feel your scrutiny and may become defensive or more careful with their words'
    }
  },
  scifi: {
    lusty: {
      label: 'Infatuated',
      emoji: '💠',
      internalState: ['neural pathways flood with attraction signals', 'biochemical cascade triggers desire protocols', 'attraction subroutines override logical thinking'],
      physicalSigns: ['dilated pupils', 'elevated heart rate', 'gravitating closer'],
      dialogueTone: 'warm with underlying tension',
      actionFlavor: 'with magnetic pull',
      npcReaction: 'Others detect your elevated biometrics and respond with interest or clinical detachment'
    },
    mad: {
      label: 'Hostile',
      emoji: '⚡',
      internalState: ['aggression protocols engage fully', 'rage burns hotter than a plasma core', 'threat assessment maxes out'],
      physicalSigns: ['tensed muscles', 'hardened expression', 'clenched fists'],
      dialogueTone: 'sharp and dangerous',
      actionFlavor: 'with violent efficiency',
      npcReaction: 'Security protocols activate around you; some back away while others ready weapons'
    },
    annoyed: {
      label: 'Irritated',
      emoji: '📡',
      internalState: ['patience buffers overflow', 'inefficiency grates on your nerves', 'frustration builds like static charge'],
      physicalSigns: ['tight jaw', 'clipped movements', 'sharp breaths'],
      dialogueTone: 'terse and impatient',
      actionFlavor: 'with frustrated efficiency',
      npcReaction: 'Others expedite their responses to minimize your irritation'
    },
    neutral: {
      label: 'Baseline',
      emoji: '◯',
      internalState: ['all systems nominal', 'emotional regulators stable', 'operating at standard parameters'],
      physicalSigns: ['steady posture', 'neutral expression', 'controlled breathing'],
      dialogueTone: 'professional and even',
      actionFlavor: 'with calculated precision',
      npcReaction: 'Standard interaction protocols; no special treatment'
    },
    happy: {
      label: 'Optimal',
      emoji: '🌟',
      internalState: ['endorphin levels elevated', 'satisfaction metrics peak', 'positive feedback loops active'],
      physicalSigns: ['relaxed posture', 'genuine smile', 'animated gestures'],
      dialogueTone: 'upbeat and engaging',
      actionFlavor: 'with enthusiasm',
      npcReaction: 'Others respond positively to your elevated mood state'
    },
    sad: {
      label: 'Low-State',
      emoji: '📉',
      internalState: ['serotonin levels critical', 'motivation subroutines failing', 'emotional dampeners struggling'],
      physicalSigns: ['lowered head', 'sluggish movements', 'flat voice'],
      dialogueTone: 'quiet and withdrawn',
      actionFlavor: 'with minimal engagement',
      npcReaction: 'Medical scans recommend intervention; allies express concern'
    },
    depressed: {
      label: 'System Failure',
      emoji: '⚠️',
      internalState: ['emotional core offline', 'hope protocols terminated', 'purpose subroutines crashed'],
      physicalSigns: ['vacant stare', 'mechanical movements', 'unresponsive demeanor'],
      dialogueTone: 'flat and empty',
      actionFlavor: 'with automated detachment',
      npcReaction: 'Emergency wellness protocols suggested; others avoid direct engagement'
    },
    fearful: {
      label: 'Threat-Detected',
      emoji: '🔴',
      internalState: ['fight-or-flight activated', 'danger assessment critical', 'survival instincts override logic'],
      physicalSigns: ['rapid breathing', 'sweating', 'constant scanning'],
      dialogueTone: 'urgent and panicked',
      actionFlavor: 'with survival priority',
      npcReaction: 'Others assess your threat warnings seriously or dismiss them as malfunction'
    },
    determined: {
      label: 'Mission-Locked',
      emoji: '🎯',
      internalState: ['objective prioritization maximum', 'failure is not computed', 'all resources allocated to goal'],
      physicalSigns: ['intense focus', 'purposeful stride', 'unwavering attention'],
      dialogueTone: 'direct and uncompromising',
      actionFlavor: 'with singular focus',
      npcReaction: 'Others recognize your commitment and either assist or clear the path'
    },
    suspicious: {
      label: 'Scanning',
      emoji: '🔍',
      internalState: ['deception analysis active', 'trust metrics low', 'verifying all incoming data'],
      physicalSigns: ['analyzing gaze', 'defensive posture', 'minimal disclosure'],
      dialogueTone: 'probing and analytical',
      actionFlavor: 'with careful verification',
      npcReaction: 'Others feel scrutinized and may adjust their behavior accordingly'
    }
  },
  horror: {
    lusty: {
      label: 'Tempted',
      emoji: '🖤',
      internalState: ['forbidden desires surface unbidden', 'dark attraction pulls at your soul', 'something primal awakens within'],
      physicalSigns: ['hungry eyes', 'restless movements', 'shallow breathing'],
      dialogueTone: 'low and inviting',
      actionFlavor: 'with dangerous allure',
      npcReaction: 'Others sense something unsettling about your desire'
    },
    mad: {
      label: 'Maddened',
      emoji: '🩸',
      internalState: ['rage breaks through sanity\'s walls', 'violence screams for release', 'red mist descends over reason'],
      physicalSigns: ['bared teeth', 'shaking with fury', 'bloodshot eyes'],
      dialogueTone: 'savage and unhinged',
      actionFlavor: 'with primal violence',
      npcReaction: 'Others flee from your maddened state or prepare to defend themselves'
    },
    annoyed: {
      label: 'Unnerved',
      emoji: '😰',
      internalState: ['nerves fray like rotting rope', 'every little thing grates', 'the tension becomes unbearable'],
      physicalSigns: ['twitching', 'snapping at sounds', 'grinding teeth'],
      dialogueTone: 'strained and snappish',
      actionFlavor: 'with fraying patience',
      npcReaction: 'Others sense your fragile state and tread carefully'
    },
    neutral: {
      label: 'Surviving',
      emoji: '💀',
      internalState: ['numbness serves as armor', 'emotions suppressed for survival', 'existing moment to moment'],
      physicalSigns: ['watchful stillness', 'controlled breathing', 'minimal expression'],
      dialogueTone: 'flat and guarded',
      actionFlavor: 'with survival instinct',
      npcReaction: 'Standard wariness maintained by all parties'
    },
    happy: {
      label: 'Relief',
      emoji: '🕯️',
      internalState: ['a brief respite from the darkness', 'hope flickers like dying candlelight', 'momentary peace in the nightmare'],
      physicalSigns: ['shoulders dropping', 'exhale of relief', 'ghost of a smile'],
      dialogueTone: 'cautiously hopeful',
      actionFlavor: 'with guarded optimism',
      npcReaction: 'Others share your relief but remain vigilant'
    },
    sad: {
      label: 'Grieving',
      emoji: '⚰️',
      internalState: ['loss carves hollow spaces in your soul', 'grief haunts every thought', 'the weight of death presses down'],
      physicalSigns: ['tear-streaked face', 'trembling', 'clutching yourself'],
      dialogueTone: 'broken and raw',
      actionFlavor: 'through a veil of tears',
      npcReaction: 'Others may share your grief or exploit your vulnerability'
    },
    depressed: {
      label: 'Broken',
      emoji: '🌑',
      internalState: ['the horrors have shattered something inside', 'hope died screaming', 'what point is there anymore'],
      physicalSigns: ['thousand-yard stare', 'limp posture', 'unresponsive'],
      dialogueTone: 'empty and nihilistic',
      actionFlavor: 'with hollow indifference',
      npcReaction: 'Others fear for your sanity and survival'
    },
    fearful: {
      label: 'Terrified',
      emoji: '😱',
      internalState: ['terror claws at your mind', 'they\'re coming they\'re coming', 'every shadow holds death'],
      physicalSigns: ['hyperventilating', 'shaking uncontrollably', 'backing away'],
      dialogueTone: 'panicked and desperate',
      actionFlavor: 'in blind terror',
      npcReaction: 'Your fear is contagious; others either panic or try to silence you'
    },
    determined: {
      label: 'Survivor',
      emoji: '🔥',
      internalState: ['you will not die here', 'rage against the dying light', 'whatever it takes to live'],
      physicalSigns: ['grim set of jaw', 'eyes burning', 'white-knuckle grip on weapon'],
      dialogueTone: 'fierce and desperate',
      actionFlavor: 'with survival fury',
      npcReaction: 'Others rally to your determination or fear your recklessness'
    },
    suspicious: {
      label: 'Paranoid',
      emoji: '👁️',
      internalState: ['trust no one trust nothing', 'everyone could be one of them', 'constantly watching for signs'],
      physicalSigns: ['darting eyes', 'flinching at contact', 'backing toward walls'],
      dialogueTone: 'accusatory and panicked',
      actionFlavor: 'with paranoid caution',
      npcReaction: 'Others either prove their humanity or become targets of suspicion'
    }
  },
  mystery: {
    lusty: {
      label: 'Drawn',
      emoji: '💋',
      internalState: ['attraction complicates the case', 'dangerous chemistry clouds judgment', 'some cases get too personal'],
      physicalSigns: ['lingering looks', 'leaning in', 'unconscious mirroring'],
      dialogueTone: 'smooth with undercurrent',
      actionFlavor: 'with charming intent',
      npcReaction: 'Suspects and witnesses respond to your charm, for better or worse'
    },
    mad: {
      label: 'Furious',
      emoji: '🔥',
      internalState: ['justice demands retribution', 'the case has become personal', 'someone will pay for this'],
      physicalSigns: ['cold fury in eyes', 'controlled tension', 'clipped movements'],
      dialogueTone: 'dangerous and cold',
      actionFlavor: 'with righteous fury',
      npcReaction: 'Suspects grow nervous; allies worry about your objectivity'
    },
    annoyed: {
      label: 'Frustrated',
      emoji: '📋',
      internalState: ['dead ends pile up', 'the case refuses to break', 'incompetence surrounds you'],
      physicalSigns: ['pinched expression', 'tapping fingers', 'sharp sighs'],
      dialogueTone: 'impatient and critical',
      actionFlavor: 'with brusque efficiency',
      npcReaction: 'Others rush to provide answers before your patience expires'
    },
    neutral: {
      label: 'Analytical',
      emoji: '🔎',
      internalState: ['detached observation mode', 'emotions set aside for facts', 'the case is all that matters'],
      physicalSigns: ['observant stillness', 'thoughtful expression', 'noting everything'],
      dialogueTone: 'professional and probing',
      actionFlavor: 'with clinical precision',
      npcReaction: 'Standard interview dynamics; subjects neither comfortable nor threatened'
    },
    happy: {
      label: 'Breakthrough',
      emoji: '💡',
      internalState: ['pieces finally connecting', 'the thrill of discovery', 'satisfaction of progress'],
      physicalSigns: ['energized posture', 'quick movements', 'eager expression'],
      dialogueTone: 'animated and eager',
      actionFlavor: 'with renewed vigor',
      npcReaction: 'Others sense your breakthrough and grow either hopeful or nervous'
    },
    sad: {
      label: 'Weary',
      emoji: '🌙',
      internalState: ['the case has taken its toll', 'too many victims, too little justice', 'the darkness seeps in'],
      physicalSigns: ['heavy eyelids', 'slumped in chair', 'staring at nothing'],
      dialogueTone: 'subdued and tired',
      actionFlavor: 'with weary persistence',
      npcReaction: 'Others see your exhaustion and may offer sympathy or take advantage'
    },
    depressed: {
      label: 'Defeated',
      emoji: '📁',
      internalState: ['another cold case', 'what\'s the point anymore', 'justice is an illusion'],
      physicalSigns: ['staring at closed files', 'empty bottle nearby', 'defeated posture'],
      dialogueTone: 'cynical and hollow',
      actionFlavor: 'through futility',
      npcReaction: 'Others question if you can still work the case'
    },
    fearful: {
      label: 'Threatened',
      emoji: '⚠️',
      internalState: ['they know you\'re getting close', 'looking over your shoulder', 'the hunter becomes hunted'],
      physicalSigns: ['checking exits', 'hand near weapon', 'jumping at sounds'],
      dialogueTone: 'guarded and quick',
      actionFlavor: 'with paranoid awareness',
      npcReaction: 'Others sense your fear and question what you\'ve uncovered'
    },
    determined: {
      label: 'Relentless',
      emoji: '🎯',
      internalState: ['this case will be solved', 'no stone unturned', 'the truth will out'],
      physicalSigns: ['intense focus', 'leaning forward', 'eyes sharp'],
      dialogueTone: 'persistent and probing',
      actionFlavor: 'with dogged determination',
      npcReaction: 'Suspects squirm under your relentless pursuit of truth'
    },
    suspicious: {
      label: 'Distrustful',
      emoji: '🕵️',
      internalState: ['everyone has something to hide', 'alibis need verification', 'the truth hides between words'],
      physicalSigns: ['skeptical expression', 'arms crossed', 'watching for tells'],
      dialogueTone: 'questioning and doubtful',
      actionFlavor: 'with investigative scrutiny',
      npcReaction: 'Others feel interrogated and may become defensive'
    }
  },
  pirate: {
    lusty: {
      label: 'Smitten',
      emoji: '🏴‍☠️',
      internalState: ['the sea isn\'t the only thing calling to ye', 'a different kind of treasure catches your eye', 'romance on the high seas'],
      physicalSigns: ['roguish grin', 'bold advances', 'playful winks'],
      dialogueTone: 'flirtatious and bold',
      actionFlavor: 'with swashbuckling charm',
      npcReaction: 'Others are charmed or scandalized by your brazen advances'
    },
    mad: {
      label: 'Mutinous',
      emoji: '⚓',
      internalState: ['fury rises like a storm surge', 'someone\'s walking the plank today', 'blood demands blood'],
      physicalSigns: ['hand on cutlass', 'snarling expression', 'aggressive stance'],
      dialogueTone: 'threatening and dangerous',
      actionFlavor: 'with violent intent',
      npcReaction: 'Crew members step back; enemies prepare for battle'
    },
    annoyed: {
      label: 'Irritable',
      emoji: '💢',
      internalState: ['patience runs shorter than grog supplies', 'landlubber nonsense grates on ye', 'the ship won\'t sail itself'],
      physicalSigns: ['growling', 'short movements', 'rolling eyes'],
      dialogueTone: 'gruff and impatient',
      actionFlavor: 'with salty irritation',
      npcReaction: 'Crew hurries to comply before your temper breaks'
    },
    neutral: {
      label: 'Steady',
      emoji: '🧭',
      internalState: ['all hands ready', 'course set, wind fair', 'a captain must be calm'],
      physicalSigns: ['balanced stance', 'steady gaze seaward', 'hands clasped behind'],
      dialogueTone: 'commanding and even',
      actionFlavor: 'with seasoned calm',
      npcReaction: 'Crew takes orders without question'
    },
    happy: {
      label: 'Merry',
      emoji: '🍺',
      internalState: ['spirits high as the mainsail', 'the sea provides', 'life of freedom tastes sweet'],
      physicalSigns: ['hearty laugh', 'slapping backs', 'drinking deeply'],
      dialogueTone: 'boisterous and jolly',
      actionFlavor: 'with rollicking joy',
      npcReaction: 'Crew joins in the merriment; strangers find you infectious'
    },
    sad: {
      label: 'Lonesome',
      emoji: '🌊',
      internalState: ['the sea is vast and lonely', 'memories of ports past haunt ye', 'every sailor knows this ache'],
      physicalSigns: ['gazing at horizon', 'quiet humming', 'distant eyes'],
      dialogueTone: 'wistful and quiet',
      actionFlavor: 'with nostalgic weight',
      npcReaction: 'Old salts understand; young crew grows uncomfortable'
    },
    depressed: {
      label: 'Becalmed',
      emoji: '☠️',
      internalState: ['no wind, no hope, no point', 'the sea will claim us all eventually', 'what treasure worth this cost'],
      physicalSigns: ['staring at nothing', 'neglecting duties', 'barely responding'],
      dialogueTone: 'hollow and defeated',
      actionFlavor: 'with dead weight',
      npcReaction: 'Crew fears your state may doom them all'
    },
    fearful: {
      label: 'Spooked',
      emoji: '👻',
      internalState: ['bad omens everywhere ye look', 'Davy Jones draws near', 'the deep calls with hungry voice'],
      physicalSigns: ['clutching talismans', 'jumping at creaks', 'watching the water'],
      dialogueTone: 'hushed and superstitious',
      actionFlavor: 'with warding gestures',
      npcReaction: 'Superstitious crew shares your fear; others mock your worry'
    },
    determined: {
      label: 'Ruthless',
      emoji: '💰',
      internalState: ['that treasure will be mine', 'no navy, no rival, no storm will stop me', 'fortune favors the bold'],
      physicalSigns: ['fierce determination', 'driving the crew harder', 'eyes on the prize'],
      dialogueTone: 'commanding and driven',
      actionFlavor: 'with relentless pursuit',
      npcReaction: 'Crew inspired or terrified by your single-minded focus'
    },
    suspicious: {
      label: 'Wary',
      emoji: '🦜',
      internalState: ['trust is for fools at sea', 'mutiny lurks in every shadow', 'keep one eye on the crew'],
      physicalSigns: ['watching for whispers', 'checking weapons', 'sleeping light'],
      dialogueTone: 'guarded and testing',
      actionFlavor: 'with captain\'s paranoia',
      npcReaction: 'Crew feels watched; the loyal prove themselves, the guilty sweat'
    }
  },
  western: {
    lusty: {
      label: 'Sweet On',
      emoji: '🤠',
      internalState: ['heart beats like horse hooves', 'something about them gets under your skin', 'lonely nights make a person want'],
      physicalSigns: ['tipping hat', 'shy smiles', 'finding excuses to be near'],
      dialogueTone: 'warm and attentive',
      actionFlavor: 'with cowboy courtesy',
      npcReaction: 'Town gossips; the object of affection responds in kind or plays coy'
    },
    mad: {
      label: 'Riled Up',
      emoji: '🔫',
      internalState: ['anger hotter than desert sun', 'someone\'s bought themselves trouble', 'time for a reckoning'],
      physicalSigns: ['hand hovering near holster', 'deadly stare', 'jaw tight as rawhide'],
      dialogueTone: 'low and dangerous',
      actionFlavor: 'with gunslinger menace',
      npcReaction: 'Folks clear the street; enemies reach for their irons'
    },
    annoyed: {
      label: 'Ornery',
      emoji: '🐴',
      internalState: ['patience wearing thinner than old leather', 'too much jawing not enough doing', 'this town tests a body'],
      physicalSigns: ['spitting', 'growling responses', 'agitated pacing'],
      dialogueTone: 'short and gruff',
      actionFlavor: 'with frontier impatience',
      npcReaction: 'Folks keep their distance and their answers short'
    },
    neutral: {
      label: 'Steady',
      emoji: '🏜️',
      internalState: ['calm as still prairie air', 'taking things as they come', 'nothing worth getting worked up over'],
      physicalSigns: ['relaxed lean', 'steady hands', 'even breathing'],
      dialogueTone: 'measured and plain',
      actionFlavor: 'with frontier patience',
      npcReaction: 'Folks treat you fair and expect the same'
    },
    happy: {
      label: 'Pleased',
      emoji: '⭐',
      internalState: ['good day on the range', 'life out here ain\'t all bad', 'simple pleasures warm the soul'],
      physicalSigns: ['easy smile', 'tipping hat to strangers', 'whistling'],
      dialogueTone: 'friendly and open',
      actionFlavor: 'with genuine warmth',
      npcReaction: 'Folks respond kindly; doors open easier'
    },
    sad: {
      label: 'Blue',
      emoji: '🌵',
      internalState: ['lonesome as a coyote\'s howl', 'the frontier takes more than it gives', 'memories of better times'],
      physicalSigns: ['staring into whiskey', 'slow movements', 'thousand-yard stare'],
      dialogueTone: 'quiet and melancholy',
      actionFlavor: 'with heavy heart',
      npcReaction: 'Bartenders pour doubles; kind souls offer company'
    },
    depressed: {
      label: 'Broken',
      emoji: '🪦',
      internalState: ['the frontier has beaten ye down', 'what\'s left worth fighting for', 'just waiting for the end'],
      physicalSigns: ['slumped in saddle', 'neglected appearance', 'dead eyes'],
      dialogueTone: 'hollow and sparse',
      actionFlavor: 'with defeated motions',
      npcReaction: 'Town pities you or sees easy prey'
    },
    fearful: {
      label: 'Spooked',
      emoji: '🌙',
      internalState: ['danger rides close behind', 'every shadow hides a threat', 'the wilderness wants you dead'],
      physicalSigns: ['hand never far from gun', 'watching horizons', 'sleeping with one eye open'],
      dialogueTone: 'tense and wary',
      actionFlavor: 'with hunted caution',
      npcReaction: 'Folks wonder what\'s chasing you; lawmen take interest'
    },
    determined: {
      label: 'Dead Set',
      emoji: '🎯',
      internalState: ['nothing gonna stop this ride', 'justice will be done', 'got a job to finish'],
      physicalSigns: ['steely gaze', 'purposeful stride', 'checking gear'],
      dialogueTone: 'direct and resolute',
      actionFlavor: 'with frontier grit',
      npcReaction: 'Smart folks stay out of your way'
    },
    suspicious: {
      label: 'Leery',
      emoji: '👁️',
      internalState: ['trust is earned out here', 'everyone\'s got an angle', 'watching for the double-cross'],
      physicalSigns: ['eyes tracking movements', 'back to the wall', 'testing every word'],
      dialogueTone: 'skeptical and probing',
      actionFlavor: 'with careful distrust',
      npcReaction: 'Honest folk prove themselves; snakes slither away'
    }
  },
  cyberpunk: {
    lusty: {
      label: 'Hooked',
      emoji: '💜',
      internalState: ['wetware flooding with attraction protocols', 'they hack your heartrate', 'chrome and flesh equally enticing'],
      physicalSigns: ['augmented pupils dilating', 'unconscious lean', 'heightened biometrics'],
      dialogueTone: 'charged and direct',
      actionFlavor: 'with digital desire',
      npcReaction: 'Others read your elevated stats; some exploit, some reciprocate'
    },
    mad: {
      label: 'Flatlined',
      emoji: '⚡',
      internalState: ['rage subroutines overclocking', 'someone\'s getting zeroed', 'violence protocols unrestricted'],
      physicalSigns: ['cyberware humming hot', 'predator stance', 'weapons primed'],
      dialogueTone: 'cold and lethal',
      actionFlavor: 'with chrome fury',
      npcReaction: 'Gangers back off; corps call security'
    },
    annoyed: {
      label: 'Glitched',
      emoji: '💢',
      internalState: ['system resources depleted by BS', 'this meat circus tests patience', 'too many notifications'],
      physicalSigns: ['twitching augments', 'dismissive gestures', 'eye-roll protocols'],
      dialogueTone: 'sarcastic and clipped',
      actionFlavor: 'with digital irritation',
      npcReaction: 'Others speed up their pitch before you flatline the conversation'
    },
    neutral: {
      label: 'Flatline',
      emoji: '➖',
      internalState: ['emotional dampeners engaged', 'baseline operation mode', 'just another day in the sprawl'],
      physicalSigns: ['minimal expression', 'efficient movements', 'steady vitals'],
      dialogueTone: 'professional and brief',
      actionFlavor: 'with cold efficiency',
      npcReaction: 'Standard transaction protocols; no special treatment'
    },
    happy: {
      label: 'Buzzed',
      emoji: '✨',
      internalState: ['endorphin injectors spiking', 'good score, good vibes', 'riding the high'],
      physicalSigns: ['relaxed posture', 'easy smile', 'generous tips'],
      dialogueTone: 'upbeat and generous',
      actionFlavor: 'with digital euphoria',
      npcReaction: 'Others see opportunity in your good mood'
    },
    sad: {
      label: 'Low Power',
      emoji: '🔋',
      internalState: ['emotional reserves critical', 'the neon lost its glow', 'what\'s the point of all this chrome'],
      physicalSigns: ['dimmed optics', 'sluggish response time', 'minimal engagement'],
      dialogueTone: 'flat and withdrawn',
      actionFlavor: 'with depleted spirit',
      npcReaction: 'Fixers see weakness; friends ping your status'
    },
    depressed: {
      label: 'Crashed',
      emoji: '💀',
      internalState: ['emotional systems non-responsive', 'meat prison feels permanent', 'unplug and never jack back in'],
      physicalSigns: ['thousand-line stare', 'neglected chrome', 'barely functional'],
      dialogueTone: 'empty and nihilistic',
      actionFlavor: 'with system failure',
      npcReaction: 'Others fear you\'ll flatline for real; some offer tabs to cope'
    },
    fearful: {
      label: 'Pinged',
      emoji: '🎯',
      internalState: ['threat detection screaming', 'they\'re in your systems', 'nowhere is safe'],
      physicalSigns: ['checking corners', 'firewall paranoia', 'jump-starting at alerts'],
      dialogueTone: 'paranoid and rushed',
      actionFlavor: 'with hunted urgency',
      npcReaction: 'Others check if you\'re tagged; smart ones distance themselves'
    },
    determined: {
      label: 'Locked In',
      emoji: '🔒',
      internalState: ['mission parameters absolute', 'failure not in the code', 'all systems dedicated to objective'],
      physicalSigns: ['focused optics', 'optimized stance', 'zero wasted cycles'],
      dialogueTone: 'direct and unwavering',
      actionFlavor: 'with surgical precision',
      npcReaction: 'Others recognize your commitment and clear the data-path'
    },
    suspicious: {
      label: 'Scanning',
      emoji: '📡',
      internalState: ['everyone\'s running an angle', 'data doesn\'t lie but people do', 'verify everything twice'],
      physicalSigns: ['analyzing everyone', 'checking for bugs', 'encrypted responses'],
      dialogueTone: 'probing and encrypted',
      actionFlavor: 'with hacker paranoia',
      npcReaction: 'Others feel your scans; the honest have nothing to hide'
    }
  },
  postapoc: {
    lusty: {
      label: 'Kindled',
      emoji: '🔥',
      internalState: ['rare warmth in the wasteland', 'survival includes connection', 'body reminds you you\'re alive'],
      physicalSigns: ['seeking closeness', 'protective positioning', 'lingering touches'],
      dialogueTone: 'warm despite everything',
      actionFlavor: 'with desperate tenderness',
      npcReaction: 'Others understand the need for human connection; some welcome it'
    },
    mad: {
      label: 'Feral',
      emoji: '☢️',
      internalState: ['rage of the radiation-touched', 'survival means violence', 'they threatened what\'s yours'],
      physicalSigns: ['bared teeth', 'aggressive crouch', 'primal sounds'],
      dialogueTone: 'savage and unrestrained',
      actionFlavor: 'with wasteland fury',
      npcReaction: 'Others scatter or prepare for blood; raiders recognize one of their own'
    },
    annoyed: {
      label: 'Fed Up',
      emoji: '😤',
      internalState: ['resources too scarce for this', 'another problem in endless problems', 'the wastes test patience daily'],
      physicalSigns: ['tense shoulders', 'irritated gestures', 'growled responses'],
      dialogueTone: 'curt and frustrated',
      actionFlavor: 'with survival irritation',
      npcReaction: 'Others quicken their dealings or back away'
    },
    neutral: {
      label: 'Surviving',
      emoji: '🏚️',
      internalState: ['another day above ground', 'emotions are luxury', 'just keep moving'],
      physicalSigns: ['constant vigilance', 'economic movements', 'minimal expression'],
      dialogueTone: 'practical and sparse',
      actionFlavor: 'with survival instinct',
      npcReaction: 'Standard wasteland wariness from all parties'
    },
    happy: {
      label: 'Hopeful',
      emoji: '🌱',
      internalState: ['rare moment of genuine hope', 'found something good in the ruins', 'maybe humanity survives after all'],
      physicalSigns: ['lighter step', 'actual smile', 'sharing rations'],
      dialogueTone: 'warm and open',
      actionFlavor: 'with precious joy',
      npcReaction: 'Others are infected by your hope or suspicious of your naivety'
    },
    sad: {
      label: 'Mourning',
      emoji: '🪦',
      internalState: ['another loss in endless losses', 'the old world is truly gone', 'grief is constant companion'],
      physicalSigns: ['distant gaze', 'clutching mementos', 'slow movements'],
      dialogueTone: 'quiet and heavy',
      actionFlavor: 'through grief haze',
      npcReaction: 'Others understand loss too well; some offer silent solidarity'
    },
    depressed: {
      label: 'Hollow',
      emoji: '💀',
      internalState: ['what\'s the point of surviving this', 'the world ended and took meaning with it', 'just waiting for the end'],
      physicalSigns: ['listless movements', 'ignoring hazards', 'letting wounds go'],
      dialogueTone: 'empty and fatalistic',
      actionFlavor: 'with death-wish indifference',
      npcReaction: 'Others fear your recklessness endangers the group'
    },
    fearful: {
      label: 'Hunted',
      emoji: '👁️',
      internalState: ['something out there hunting', 'radiation, raiders, or worse', 'the wastes want you dead'],
      physicalSigns: ['constant scanning', 'ready to run', 'flinching at sounds'],
      dialogueTone: 'hushed and urgent',
      actionFlavor: 'with prey instincts',
      npcReaction: 'Others check for threats or dismiss your fear as weakness'
    },
    determined: {
      label: 'Hardened',
      emoji: '⚔️',
      internalState: ['built to survive this', 'nothing stops the mission', 'the strong endure'],
      physicalSigns: ['squared stance', 'checking gear', 'eyes on objective'],
      dialogueTone: 'grim and focused',
      actionFlavor: 'with apocalypse grit',
      npcReaction: 'Others follow your lead or get out of the way'
    },
    suspicious: {
      label: 'Distrustful',
      emoji: '🔍',
      internalState: ['everyone wants something', 'trust gets you killed', 'verify before vulnerability'],
      physicalSigns: ['watching hands', 'escape routes noted', 'weapons ready'],
      dialogueTone: 'testing and guarded',
      actionFlavor: 'with wasteland wariness',
      npcReaction: 'Others understand; trust is earned in blood out here'
    }
  },
  war: {
    lusty: {
      label: 'Yearning',
      emoji: '💌',
      internalState: ['longing for warmth amidst chaos', 'war makes hearts desperate', 'any port in the storm'],
      physicalSigns: ['seeking closeness', 'lingering glances', 'treasuring letters'],
      dialogueTone: 'warm and vulnerable',
      actionFlavor: 'with battlefield tenderness',
      npcReaction: 'Comrades understand the need; some share it'
    },
    mad: {
      label: 'Battle Rage',
      emoji: '⚔️',
      internalState: ['fury of combat consumes all', 'kill or be killed', 'red mist descends'],
      physicalSigns: ['combat stance', 'weapon raised', 'war cry building'],
      dialogueTone: 'savage and commanding',
      actionFlavor: 'with warrior fury',
      npcReaction: 'Allies channel your rage; enemies flee or fall'
    },
    annoyed: {
      label: 'Irritated',
      emoji: '😤',
      internalState: ['FUBAR situations stack up', 'command incompetence grates', 'war is hell and so is waiting'],
      physicalSigns: ['grinding teeth', 'checking watch', 'snapping at others'],
      dialogueTone: 'sharp and impatient',
      actionFlavor: 'with soldier frustration',
      npcReaction: 'Others expedite or avoid you'
    },
    neutral: {
      label: 'Steady',
      emoji: '🎖️',
      internalState: ['training takes over', 'emotions locked down', 'just following orders'],
      physicalSigns: ['disciplined posture', 'professional demeanor', 'controlled responses'],
      dialogueTone: 'military and efficient',
      actionFlavor: 'with trained precision',
      npcReaction: 'Standard military interaction'
    },
    happy: {
      label: 'Relieved',
      emoji: '✨',
      internalState: ['survived another engagement', 'mail from home arrived', 'brief respite from hell'],
      physicalSigns: ['shoulders dropping', 'genuine laughter', 'sharing cigarettes'],
      dialogueTone: 'warm and grateful',
      actionFlavor: 'with precious relief',
      npcReaction: 'Comrades share the moment of peace'
    },
    sad: {
      label: 'Grieving',
      emoji: '🕯️',
      internalState: ['another friend gone', 'dog tags grow heavier', 'war takes everything'],
      physicalSigns: ['thousand-yard stare', 'touching memorabilia', 'quiet tears'],
      dialogueTone: 'heavy and muted',
      actionFlavor: 'through grief fog',
      npcReaction: 'Comrades understand; chaplains approach'
    },
    depressed: {
      label: 'Shell-Shocked',
      emoji: '💔',
      internalState: ['seen too much', 'nothing matters anymore', 'just waiting for the bullet'],
      physicalSigns: ['vacant stare', 'slow reactions', 'careless with safety'],
      dialogueTone: 'hollow and distant',
      actionFlavor: 'with shell-shock numbness',
      npcReaction: 'Medics concerned; command questions your fitness'
    },
    fearful: {
      label: 'Combat Fear',
      emoji: '💣',
      internalState: ['incoming incoming incoming', 'every sound is death', 'I don\'t want to die here'],
      physicalSigns: ['trembling', 'flinching at sounds', 'seeking cover'],
      dialogueTone: 'panicked and rapid',
      actionFlavor: 'with terror-sharpened instinct',
      npcReaction: 'Veterans steady you; green troops share your fear'
    },
    determined: {
      label: 'Mission-Ready',
      emoji: '🎯',
      internalState: ['objective clear', 'brothers depend on you', 'failure is not an option'],
      physicalSigns: ['focused intensity', 'gear checked', 'ready position'],
      dialogueTone: 'direct and commanding',
      actionFlavor: 'with military resolve',
      npcReaction: 'Unit rallies to your determination'
    },
    suspicious: {
      label: 'On Guard',
      emoji: '👁️',
      internalState: ['enemy could be anywhere', 'trust has to be earned', 'watching for infiltrators'],
      physicalSigns: ['scanning constantly', 'weapon ready', 'questioning everything'],
      dialogueTone: 'interrogative and careful',
      actionFlavor: 'with combat awareness',
      npcReaction: 'Others prove their allegiance or fall under suspicion'
    }
  },
  custom: {
    lusty: {
      label: 'Attracted',
      emoji: '💗',
      internalState: ['desire stirs within', 'attraction pulls at your thoughts', 'romantic interest awakens'],
      physicalSigns: ['flushed appearance', 'drawing closer', 'lingering attention'],
      dialogueTone: 'warm and interested',
      actionFlavor: 'with attraction-driven intent',
      npcReaction: 'Others respond to your romantic energy accordingly'
    },
    mad: {
      label: 'Angry',
      emoji: '😠',
      internalState: ['fury builds within', 'rage demands expression', 'anger clouds judgment'],
      physicalSigns: ['tense posture', 'clenched fists', 'hardened expression'],
      dialogueTone: 'sharp and hostile',
      actionFlavor: 'with angry force',
      npcReaction: 'Others back away or respond with aggression'
    },
    annoyed: {
      label: 'Annoyed',
      emoji: '😤',
      internalState: ['patience wears thin', 'frustration builds', 'irritation mounts'],
      physicalSigns: ['crossed arms', 'sighing', 'tapping feet'],
      dialogueTone: 'curt and impatient',
      actionFlavor: 'with frustrated energy',
      npcReaction: 'Others hurry their responses'
    },
    neutral: {
      label: 'Neutral',
      emoji: '😐',
      internalState: ['calm and centered', 'no strong emotions', 'balanced state'],
      physicalSigns: ['relaxed posture', 'steady gaze', 'measured breathing'],
      dialogueTone: 'even and measured',
      actionFlavor: 'with calm deliberation',
      npcReaction: 'Standard interaction'
    },
    happy: {
      label: 'Happy',
      emoji: '😊',
      internalState: ['joy fills your heart', 'good spirits rise', 'contentment warms you'],
      physicalSigns: ['genuine smile', 'light step', 'open posture'],
      dialogueTone: 'cheerful and warm',
      actionFlavor: 'with happy energy',
      npcReaction: 'Others respond positively'
    },
    sad: {
      label: 'Sad',
      emoji: '😢',
      internalState: ['sorrow weighs heavy', 'grief lingers', 'melancholy clouds thoughts'],
      physicalSigns: ['downcast eyes', 'slumped shoulders', 'quiet voice'],
      dialogueTone: 'subdued and quiet',
      actionFlavor: 'with heavy heart',
      npcReaction: 'Others offer sympathy or avoid'
    },
    depressed: {
      label: 'Depressed',
      emoji: '😞',
      internalState: ['darkness consumes hope', 'nothing seems to matter', 'emptiness fills you'],
      physicalSigns: ['vacant expression', 'listless movements', 'withdrawn posture'],
      dialogueTone: 'hollow and distant',
      actionFlavor: 'with numb detachment',
      npcReaction: 'Others express concern'
    },
    fearful: {
      label: 'Fearful',
      emoji: '😨',
      internalState: ['fear grips you', 'danger feels close', 'anxiety spikes'],
      physicalSigns: ['wide eyes', 'trembling', 'backing away'],
      dialogueTone: 'nervous and hesitant',
      actionFlavor: 'with fearful caution',
      npcReaction: 'Others notice your fear'
    },
    determined: {
      label: 'Determined',
      emoji: '💪',
      internalState: ['resolve hardens', 'purpose drives you', 'nothing will stop you'],
      physicalSigns: ['set jaw', 'focused eyes', 'squared shoulders'],
      dialogueTone: 'firm and resolute',
      actionFlavor: 'with unwavering focus',
      npcReaction: 'Others take you seriously'
    },
    suspicious: {
      label: 'Suspicious',
      emoji: '🤨',
      internalState: ['distrust colors perception', 'something feels off', 'watching for deception'],
      physicalSigns: ['narrowed eyes', 'guarded stance', 'careful movements'],
      dialogueTone: 'questioning and wary',
      actionFlavor: 'with careful distrust',
      npcReaction: 'Others feel scrutinized'
    }
  }
};
// ===== MOOD ANCHOR KEYWORD SYSTEM =====
// STRICT WHITELIST: Only true emotional anchors get highlighted
// NO filler, connective tissue, pronouns, articles, prepositions, or common verbs

// Words that should NEVER be highlighted regardless of mood
export const BANNED_HIGHLIGHT_WORDS = new Set([
  // Pronouns
  'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves', 'who', 'whom', 'whose',
  // Articles
  'a', 'an', 'the',
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'into', 'onto',
  'upon', 'of', 'off', 'out', 'over', 'under', 'about', 'above', 'below',
  'between', 'through', 'during', 'before', 'after', 'behind', 'beside',
  // Conjunctions
  'and', 'but', 'or', 'nor', 'yet', 'so', 'as', 'if', 'than', 'because',
  // Common glue words
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'shall', 'can', 'this', 'that', 'these', 'those', 'here', 'there',
  'where', 'when', 'what', 'which', 'how', 'why', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'some', 'any', 'no', 'not', 'only', 'own',
  'same', 'such', 'too', 'very', 'just', 'also', 'now', 'then', 'still',
  // Common body parts / generic descriptors that aren't mood-specific
  'eyes', 'eye', 'look', 'looks', 'face', 'hand', 'hands', 'head', 'body',
  'back', 'side', 'way', 'time', 'moment', 'place', 'thing', 'things',
  'one', 'two', 'first', 'last', 'next', 'new', 'old', 'good', 'bad',
  'like', 'even', 'well', 'much', 'many', 'other', 'another', 'again',
  'always', 'never', 'often', 'sometimes', 'already', 'enough', 'though'
]);

// MOOD ANCHOR PACKS - Only explicit emotional anchors
// Priority: mood nouns > adjectives > iconic verbs > approved phrases
export const MOOD_ANCHORS: Record<CoreMoodType, {
  nouns: string[];
  adjectives: string[];
  verbs: string[];
  phrases: string[];
}> = {
  lusty: {
    nouns: ['lover', 'desire', 'craving', 'lust', 'temptation', 'passion', 'yearning', 'hunger', 'longing', 'attraction'],
    adjectives: ['enamored', 'seductive', 'intimate', 'tender', 'sultry', 'alluring', 'enticing', 'sensual', 'provocative'],
    verbs: ['caress', 'embrace', 'whisper', 'seduce', 'entwine', 'ravish'],
    phrases: ['warmth in your chest', 'hungry glance', 'soft heat', 'heated breath', 'magnetic pull']
  },
  mad: {
    nouns: ['rage', 'wrath', 'fury', 'hatred', 'anger', 'vengeance', 'threat', 'insult', 'betrayal', 'contempt'],
    adjectives: ['furious', 'seething', 'vengeful', 'violent', 'livid', 'enraged', 'wrathful', 'murderous'],
    verbs: ['snarl', 'seethe', 'scream', 'throttle', 'destroy', 'crush'],
    phrases: ['blood in your ears', 'knife-edge temper', 'burning contempt', 'cold fury', 'white-hot rage']
  },
  annoyed: {
    nouns: ['irritation', 'annoyance', 'impatience', 'nuisance', 'bother', 'interruption', 'exasperation'],
    adjectives: ['petty', 'snide', 'grating', 'unbearable', 'tedious', 'insufferable'],
    verbs: ['scoff', 'sneer', 'dismiss'],
    phrases: ['thin patience', 'forced smile', 'grinding restraint', 'clipped tone']
  },
  neutral: {
    nouns: ['composure', 'balance', 'calm'],
    adjectives: ['steady', 'composed', 'measured', 'unmoved', 'even'],
    verbs: [],
    phrases: ['even breath', 'level gaze']
  },
  happy: {
    nouns: ['joy', 'relief', 'delight', 'elation', 'bliss', 'gratitude', 'triumph', 'celebration'],
    adjectives: ['bright', 'radiant', 'grateful', 'elated', 'jubilant', 'gleeful', 'exuberant'],
    verbs: ['laugh', 'grin', 'rejoice', 'celebrate', 'beam'],
    phrases: ['light in your chest', 'easy laughter', 'warm glow', 'burst of joy']
  },
  sad: {
    nouns: ['sorrow', 'loss', 'regret', 'grief', 'mourning', 'heartbreak', 'melancholy', 'despair'],
    adjectives: ['heavy', 'aching', 'mournful', 'sorrowful', 'bereft', 'forlorn', 'wistful'],
    verbs: ['weep', 'mourn', 'sob', 'grieve'],
    phrases: ['hollow throat', 'quiet grief', 'weight of loss', 'bitter regret']
  },
  depressed: {
    nouns: ['emptiness', 'numbness', 'despair', 'void', 'hopelessness', 'apathy', 'desolation'],
    adjectives: ['hollow', 'deadened', 'numb', 'bleak', 'colorless', 'lifeless'],
    verbs: ['fade', 'wither', 'sink'],
    phrases: ['lead in your bones', 'mute world', 'grey inside', 'hollow ache', 'nothing matters']
  },
  fearful: {
    nouns: ['terror', 'dread', 'panic', 'horror', 'fright', 'alarm', 'trepidation'],
    adjectives: ['terrified', 'petrified', 'paralyzed', 'horrified', 'stricken', 'frantic'],
    verbs: ['tremble', 'cower', 'flee', 'freeze'],
    phrases: ['cold sweat', 'racing heart', 'blood runs cold', 'spine-chilling', 'frozen in place']
  },
  determined: {
    nouns: ['resolve', 'determination', 'conviction', 'willpower', 'purpose', 'defiance'],
    adjectives: ['resolute', 'unwavering', 'steadfast', 'unbreakable', 'relentless', 'fierce'],
    verbs: ['persevere', 'endure', 'stand', 'fight'],
    phrases: ['iron will', 'steel in your spine', 'burning purpose', 'unshakeable resolve']
  },
  suspicious: {
    nouns: ['doubt', 'distrust', 'suspicion', 'paranoia', 'wariness', 'deception', 'treachery'],
    adjectives: ['wary', 'guarded', 'distrustful', 'skeptical', 'paranoid', 'vigilant'],
    verbs: ['scrutinize', 'question', 'probe'],
    phrases: ['something off', 'hidden agenda', 'false smile', 'watching your back']
  }
};

// Max anchors to highlight per paragraph (strict: 1-3, not 3-5)
export const MAX_ANCHORS_PER_PARAGRAPH = 3;

// Build flat keyword set for quick lookup
function buildAnchorSet(mood: CoreMoodType): Set<string> {
  const anchors = MOOD_ANCHORS[mood];
  if (!anchors) return new Set();
  
  const set = new Set<string>();
  [...anchors.nouns, ...anchors.adjectives, ...anchors.verbs].forEach(w => set.add(w.toLowerCase()));
  return set;
}

// Pre-built anchor sets for performance
const ANCHOR_SETS: Record<CoreMoodType, Set<string>> = {
  lusty: buildAnchorSet('lusty'),
  mad: buildAnchorSet('mad'),
  annoyed: buildAnchorSet('annoyed'),
  neutral: buildAnchorSet('neutral'),
  happy: buildAnchorSet('happy'),
  sad: buildAnchorSet('sad'),
  depressed: buildAnchorSet('depressed'),
  fearful: buildAnchorSet('fearful'),
  determined: buildAnchorSet('determined'),
  suspicious: buildAnchorSet('suspicious')
};

// Check if a word is a valid mood anchor (not banned, in whitelist)
export function isValidMoodAnchor(word: string, mood: CoreMoodType): boolean {
  if (mood === 'neutral') return false;
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  
  // Never highlight banned words
  if (BANNED_HIGHLIGHT_WORDS.has(cleanWord)) return false;
  
  // Must be in the mood's anchor set
  const anchorSet = ANCHOR_SETS[mood];
  return anchorSet.has(cleanWord);
}

// Get anchor words from text with strict limits and deduplication
export function getAnchorWords(
  text: string, 
  mood: CoreMoodType, 
  maxCount: number = MAX_ANCHORS_PER_PARAGRAPH,
  alreadyHighlighted?: Set<string>  // For scene-level deduplication
): Set<string> {
  if (mood === 'neutral') return new Set();
  
  const anchorSet = ANCHOR_SETS[mood];
  const words = text.toLowerCase().split(/\s+/);
  const matches = new Set<string>();
  
  for (const word of words) {
    if (matches.size >= maxCount) break;
    
    const cleanWord = word.replace(/[^a-z]/g, '');
    
    // Skip banned words
    if (BANNED_HIGHLIGHT_WORDS.has(cleanWord)) continue;
    
    // Skip already highlighted in this scene (deduplication)
    if (alreadyHighlighted?.has(cleanWord)) continue;
    
    // Must be in anchor set
    if (anchorSet.has(cleanWord)) {
      matches.add(cleanWord);
    }
  }
  
  return matches;
}

// Legacy export for backward compatibility
export const MOOD_KEYWORDS = MOOD_ANCHORS;
export const MAX_KEYWORDS_PER_PARAGRAPH = MAX_ANCHORS_PER_PARAGRAPH;
export function shouldTintWord(word: string, mood: CoreMoodType): boolean {
  return isValidMoodAnchor(word, mood);
}
export function getTintableKeywords(
  text: string, 
  mood: CoreMoodType, 
  maxCount: number = MAX_ANCHORS_PER_PARAGRAPH
): Set<string> {
  return getAnchorWords(text, mood, maxCount);
}

// ===== MOOD HISTORY TRACKING =====

export interface MoodLogEntry {
  mood: CoreMoodType;
  timestamp: number;
  chapter: number;
  trigger: string;
  narrativeContext?: string;
}

export interface MoodState {
  currentMood: CoreMoodType;
  moodIntensity: number; // 0-1
  moodHistory: MoodLogEntry[];
  lastChangeTimestamp: number;
}

export function createInitialMoodState(): MoodState {
  return {
    currentMood: 'neutral',
    moodIntensity: 0.5,
    moodHistory: [],
    lastChangeTimestamp: Date.now()
  };
}

export function changeMood(
  state: MoodState,
  newMood: CoreMoodType,
  trigger: string,
  chapter: number,
  intensity: number = 0.7,
  narrativeContext?: string
): MoodState {
  const entry: MoodLogEntry = {
    mood: newMood,
    timestamp: Date.now(),
    chapter,
    trigger,
    narrativeContext
  };

  return {
    currentMood: newMood,
    moodIntensity: Math.max(0.1, Math.min(1, intensity)),
    moodHistory: [...state.moodHistory.slice(-49), entry], // Keep last 50 entries
    lastChangeTimestamp: Date.now()
  };
}

// ===== MOOD DIALOGUE INTEGRATION =====

export interface MoodDialogueVariation {
  prefix?: string;      // Added before player dialogue
  suffix?: string;      // Added after player dialogue
  toneModifier: string; // Instruction for AI
  disabledOptions?: string[]; // Types of responses unavailable in this mood
}

export function getMoodDialogueVariation(mood: CoreMoodType, genre: GameGenre): MoodDialogueVariation {
  const descriptor = GENRE_MOOD_DESCRIPTORS[genre]?.[mood] || GENRE_MOOD_DESCRIPTORS.custom[mood];
  
  const variations: Record<CoreMoodType, MoodDialogueVariation> = {
    lusty: {
      prefix: '*with a warm smile*',
      toneModifier: `Player speaks ${descriptor.dialogueTone}. Add romantic undertones and suggestive pauses.`,
      disabledOptions: ['aggressive', 'cold']
    },
    mad: {
      prefix: '*voice tight with anger*',
      toneModifier: `Player speaks ${descriptor.dialogueTone}. Use shorter sentences, aggressive word choices.`,
      disabledOptions: ['calm', 'friendly', 'flirtatious']
    },
    annoyed: {
      prefix: '*with visible impatience*',
      toneModifier: `Player speaks ${descriptor.dialogueTone}. Add sighs, interruptions, eye-rolls.`,
      disabledOptions: ['patient', 'elaborate']
    },
    neutral: {
      toneModifier: `Player speaks ${descriptor.dialogueTone}. Standard delivery.`,
    },
    happy: {
      prefix: '*cheerfully*',
      toneModifier: `Player speaks ${descriptor.dialogueTone}. Add enthusiasm and positive energy.`,
      disabledOptions: ['pessimistic', 'cold']
    },
    sad: {
      prefix: '*voice heavy with sorrow*',
      toneModifier: `Player speaks ${descriptor.dialogueTone}. Add pauses, trailing off, quiet delivery.`,
      disabledOptions: ['enthusiastic', 'jokes']
    },
    depressed: {
      prefix: '*flatly*',
      toneModifier: `Player speaks ${descriptor.dialogueTone}. Minimal emotion, short responses, nihilistic undertone.`,
      disabledOptions: ['enthusiastic', 'optimistic', 'charming', 'jokes']
    },
    fearful: {
      prefix: '*nervously*',
      toneModifier: `Player speaks ${descriptor.dialogueTone}. Add stammering, looking around, uncertain pauses.`,
      disabledOptions: ['confident', 'aggressive', 'flirtatious']
    },
    determined: {
      prefix: '*with resolve*',
      toneModifier: `Player speaks ${descriptor.dialogueTone}. Direct, focused, unwavering.`,
      disabledOptions: ['uncertain', 'hesitant']
    },
    suspicious: {
      prefix: '*eyes narrowing*',
      toneModifier: `Player speaks ${descriptor.dialogueTone}. Question everything, trust nothing.`,
      disabledOptions: ['trusting', 'naive', 'open']
    }
  };

  return variations[mood];
}

// ===== AI PROMPT FORMATTING =====

export function formatMoodForAI(state: MoodState, genre: GameGenre, characterName: string): string {
  const descriptor = GENRE_MOOD_DESCRIPTORS[genre]?.[state.currentMood] || GENRE_MOOD_DESCRIPTORS.custom[state.currentMood];
  const intensityWord = state.moodIntensity > 0.7 ? 'intensely' : 
                        state.moodIntensity > 0.4 ? 'noticeably' : 'mildly';
  const internalState = descriptor.internalState[Math.floor(Math.random() * descriptor.internalState.length)];
  const physicalSign = descriptor.physicalSigns[Math.floor(Math.random() * descriptor.physicalSigns.length)];

  return `[CHARACTER EMOTIONAL STATE - ${genre.toUpperCase()}]
${characterName} is ${intensityWord} ${descriptor.label} (${state.currentMood}).

Internal experience: ${internalState}
Visible signs: ${physicalSign}
Speech pattern: ${descriptor.dialogueTone}
Actions performed: ${descriptor.actionFlavor}
NPC awareness: ${descriptor.npcReaction}

Apply this mood to flavor all narrative descriptions, adjust dialogue tone, and influence how NPCs perceive and react to ${characterName}.`;
}

// ===== MOOD DERIVATION FROM STATS =====

export function deriveMoodFromStats(stats: {
  stress?: number;
  health?: number;
  energy?: number;
  tension?: number;
  hunger?: number;
}): CoreMoodType {
  const { stress = 20, health = 100, energy = 100, tension = 0, hunger = 0 } = stats;
  
  // High tension with adult content
  if (tension > 70) return 'lusty';
  
  // Very low health - fearful
  if (health < 25) return 'fearful';
  
  // High stress + low health = depressed
  if (stress > 70 && health < 50 && energy < 40) return 'depressed';
  
  // High stress levels
  if (stress > 80) return 'fearful';
  if (stress > 60) return 'annoyed';
  
  // Sadness from low energy/health
  if (health < 40 || energy < 25) return 'sad';
  
  // Anger from stress + hunger
  if (stress > 50 && hunger > 60) return 'mad';
  
  // Determined when health low but stress managed
  if (health < 50 && stress < 40) return 'determined';
  
  // Happy when all good
  if (health > 75 && energy > 70 && stress < 25) return 'happy';
  
  // Suspicious when moderate stress
  if (stress > 40 && stress < 60) return 'suspicious';
  
  return 'neutral';
}
