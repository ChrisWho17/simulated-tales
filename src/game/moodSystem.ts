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

export interface MoodColorConfig {
  primary: string;      // Hex color
  bg: string;           // Tailwind bg class
  glow: string;         // RGBA for shadows
  border: string;       // Border color
}

export const MOOD_COLORS: Record<CoreMoodType, MoodColorConfig> = {
  lusty: {
    primary: '#ec4899',
    bg: 'bg-pink-500/20',
    glow: 'rgba(236, 72, 153, 0.5)',
    border: '#ec4899'
  },
  mad: {
    primary: '#ef4444',
    bg: 'bg-red-500/20',
    glow: 'rgba(239, 68, 68, 0.5)',
    border: '#ef4444'
  },
  annoyed: {
    primary: '#f97316',
    bg: 'bg-orange-500/20',
    glow: 'rgba(249, 115, 22, 0.5)',
    border: '#f97316'
  },
  neutral: {
    primary: '#9ca3af',
    bg: 'bg-gray-400/20',
    glow: 'rgba(156, 163, 175, 0.3)',
    border: '#9ca3af'
  },
  happy: {
    primary: '#22c55e',
    bg: 'bg-green-500/20',
    glow: 'rgba(34, 197, 94, 0.5)',
    border: '#22c55e'
  },
  sad: {
    primary: '#3b82f6',
    bg: 'bg-blue-500/20',
    glow: 'rgba(59, 130, 246, 0.5)',
    border: '#3b82f6'
  },
  depressed: {
    primary: '#8b5cf6',
    bg: 'bg-purple-500/20',
    glow: 'rgba(139, 92, 246, 0.5)',
    border: '#8b5cf6'
  },
  fearful: {
    primary: '#eab308',
    bg: 'bg-yellow-500/20',
    glow: 'rgba(234, 179, 8, 0.5)',
    border: '#eab308'
  },
  determined: {
    primary: '#f1f5f9',
    bg: 'bg-slate-200/20',
    glow: 'rgba(241, 245, 249, 0.5)',
    border: '#f1f5f9'
  },
  suspicious: {
    primary: '#06b6d4',
    bg: 'bg-cyan-500/20',
    glow: 'rgba(6, 182, 212, 0.5)',
    border: '#06b6d4'
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
// ===== MOOD-TINTED KEYWORD SYSTEM =====
// Words that get subtle color tinting based on active mood (per PDF spec)

export const MOOD_KEYWORDS: Record<CoreMoodType, string[]> = {
  lusty: [
    'linger', 'soft', 'press', 'touch', 'warm', 'close', 'lips', 'eyes', 'skin',
    'breath', 'caress', 'desire', 'pulse', 'heat', 'ache', 'whisper', 'gentle',
    'intimate', 'tender', 'embrace', 'longing', 'passion', 'drawn', 'magnetic'
  ],
  mad: [
    'snap', 'slam', 'tense', 'snarl', 'fury', 'rage', 'burn', 'clench', 'growl',
    'seething', 'thunder', 'storm', 'hate', 'kill', 'destroy', 'crush', 'break',
    'violent', 'harsh', 'bitter', 'strike', 'smash', 'roar', 'wrath'
  ],
  annoyed: [
    'sigh', 'roll', 'impatient', 'bored', 'tired', 'again', 'enough', 'whatever',
    'fine', 'irritated', 'frustrated', 'tedious', 'pointless', 'wait', 'hurry'
  ],
  neutral: [], // No keywords highlighted for neutral
  happy: [
    'smile', 'laugh', 'joy', 'bright', 'warm', 'light', 'hope', 'cheer', 'grin',
    'delight', 'pleased', 'excited', 'wonderful', 'amazing', 'glad', 'happy'
  ],
  sad: [
    'heavy', 'drift', 'quiet', 'sorrow', 'tears', 'loss', 'empty', 'alone',
    'cold', 'dark', 'weep', 'mourn', 'grief', 'ache', 'hollow', 'fading', 'gone'
  ],
  depressed: [
    'nothing', 'pointless', 'empty', 'void', 'hollow', 'numb', 'dark', 'endless',
    'hopeless', 'worthless', 'meaningless', 'grey', 'shadow', 'fade', 'disappear'
  ],
  fearful: [
    'shadow', 'dark', 'danger', 'threat', 'lurk', 'creep', 'terror', 'dread',
    'panic', 'flee', 'hide', 'trembl', 'shak', 'cold', 'frozen', 'paralyz'
  ],
  determined: [
    'will', 'must', 'resolve', 'steel', 'strong', 'unwavering', 'focused',
    'driven', 'purpose', 'commit', 'stand', 'fight', 'rise', 'push', 'forward'
  ],
  suspicious: [
    'watch', 'doubt', 'lie', 'truth', 'hidden', 'secret', 'trust', 'betray',
    'careful', 'wary', 'question', 'motiv', 'agenda', 'scheme', 'deceiv'
  ]
};

// Check if a word should be tinted for the current mood
export function shouldTintWord(word: string, mood: CoreMoodType): boolean {
  if (mood === 'neutral') return false;
  const keywords = MOOD_KEYWORDS[mood] || [];
  const lowerWord = word.toLowerCase().replace(/[^a-z]/g, '');
  return keywords.some(kw => lowerWord.includes(kw) || kw.includes(lowerWord));
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
