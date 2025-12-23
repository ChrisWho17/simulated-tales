// Morality & Starting Vignette System
import { GameGenre } from './genreData';

export type MoralAlignment = 'virtuous' | 'neutral' | 'corrupt';
export type MoralPath = 'redemption' | 'balance' | 'corruption';

export interface MoralityState {
  alignment: MoralAlignment;
  karmaPoints: number;
  path: MoralPath;
  pivotalChoices: PivotalChoice[];
}

export interface PivotalChoice {
  id: string;
  description: string;
  consequence: 'good' | 'evil' | 'neutral';
  karmaChange: number;
  timestamp: number;
}

export interface StartingVignette {
  id: string;
  genre: GameGenre;
  classId: string;
  backgroundId: string;
  title: string;
  narrative: string;
  initialChoice: VignetteChoice;
  moralImplication: string;
}

export interface VignetteChoice {
  virtuous: { text: string; consequence: string; karmaBonus: number; startingBonuses?: string[]; };
  neutral: { text: string; consequence: string; karmaBonus: number; startingBonuses?: string[]; };
  corrupt: { text: string; consequence: string; karmaBonus: number; startingBonuses?: string[]; };
}

export function createDefaultMorality(initialKarma: number = 0): MoralityState {
  return {
    alignment: initialKarma > 25 ? 'virtuous' : initialKarma < -25 ? 'corrupt' : 'neutral',
    karmaPoints: initialKarma,
    path: initialKarma > 0 ? 'redemption' : initialKarma < 0 ? 'corruption' : 'balance',
    pivotalChoices: [],
  };
}

export function updateMorality(state: MoralityState, karmaChange: number, choiceDescription: string): MoralityState {
  const newKarma = Math.max(-100, Math.min(100, state.karmaPoints + karmaChange));
  const newAlignment: MoralAlignment = newKarma > 25 ? 'virtuous' : newKarma < -25 ? 'corrupt' : 'neutral';
  
  const newChoice: PivotalChoice = {
    id: `choice_${Date.now()}`,
    description: choiceDescription,
    consequence: karmaChange > 0 ? 'good' : karmaChange < 0 ? 'evil' : 'neutral',
    karmaChange,
    timestamp: Date.now(),
  };

  let newPath: MoralPath = state.path;
  if (state.alignment === 'corrupt' && newAlignment === 'neutral') newPath = 'redemption';
  if (state.alignment === 'virtuous' && newAlignment === 'neutral') newPath = 'corruption';
  if (newAlignment === 'virtuous') newPath = 'redemption';
  if (newAlignment === 'corrupt') newPath = 'corruption';

  return { alignment: newAlignment, karmaPoints: newKarma, path: newPath, pivotalChoices: [...state.pivotalChoices, newChoice] };
}

const STARTING_VIGNETTES: Record<string, StartingVignette> = {
  'western:gunslinger:rancher': {
    id: 'western_gunslinger_rancher', genre: 'western', classId: 'gunslinger', backgroundId: 'rancher',
    title: 'The Burning Range',
    narrative: "The smoke rises from what was once your family's ranch. The Morgan Gang left nothing but ashes. Your father's Colt Peacemaker sits heavy in your hand. Three sets of hoofprints lead north. But there is movement in the ruins—a young boy staggers from the collapsed barn, bleeding. The nearest doctor is two hours east. The gang's trail grows colder.",
    initialChoice: {
      virtuous: { text: 'Save the boy first. Vengeance can wait.', consequence: 'The boy survives. The gang escapes deeper, but the town sees you as a protector.', karmaBonus: 25, startingBonuses: ['Town Reputation: Hero', 'Ally: Grateful Family'] },
      neutral: { text: 'Bandage him quickly and leave supplies.', consequence: 'You do what you can. The boy might survive. The trail might still be warm.', karmaBonus: 0, startingBonuses: ['Trail Knowledge'] },
      corrupt: { text: 'The boy is not your concern. Only blood pays for blood.', consequence: 'You ride north without looking back. Days later, you caught the first Morgan.', karmaBonus: -30, startingBonuses: ['Reputation: Ruthless', 'Kill: First Morgan'] },
    },
    moralImplication: 'Will you become a protector or a creature of vengeance?',
  },
  'cyberpunk:netrunner:corpo': {
    id: 'cyberpunk_netrunner_corpo', genre: 'cyberpunk', classId: 'netrunner', backgroundId: 'corpo',
    title: 'The Golden Handcuffs',
    narrative: "Arasaka Tower's server room hums with stolen lives. You spent years building their Black ICE. Now you have seen too much—Project Lazarus, the engram experiments. Your resignation was rejected. But tonight, your old access codes still work. You could expose everything or steal the prototype.",
    initialChoice: {
      virtuous: { text: 'Upload everything to the public net. Burn them down.', consequence: 'The data goes viral. Arasaka stocks crash. You are the most wanted runner—and a symbol of hope.', karmaBonus: 35, startingBonuses: ['Reputation: Leaker', 'Enemy: Arasaka', 'Underground Allies'] },
      neutral: { text: 'Copy the prototype specs for Militech.', consequence: 'Militech pays well. You are rich, hunted, but neither hero nor villain.', karmaBonus: -5, startingBonuses: ['Eddies: +5000', 'Militech Contact'] },
      corrupt: { text: 'Wipe the evidence and take the research for yourself.', consequence: 'You erase the prisoners. The prototype is yours. Immortality awaits.', karmaBonus: -40, startingBonuses: ['Prototype: Engram Tech', 'Dark Secret'] },
    },
    moralImplication: 'In a world of corporate gods, exposing truth is revolutionary.',
  },
  'postapoc:wastelander:tribal': {
    id: 'postapoc_wastelander_tribal', genre: 'postapoc', classId: 'wastelander', backgroundId: 'tribal',
    title: 'The Old Ways',
    narrative: "The Tribe sent you to find medicine. Instead, you found a bunker—sealed, untouched. Inside: supplies for generations. But the bunker is claimed by a family hiding from the wasteland. They beg for mercy. Your children are dying.",
    initialChoice: {
      virtuous: { text: 'Take only the medicine. Trade knowledge for protection.', consequence: 'You return with medicine. The bunker family sends traders. Two peoples become one.', karmaBonus: 35, startingBonuses: ['Ally: Bunker Family', 'Trade Route', 'Medicine'] },
      neutral: { text: 'Demand half the supplies. Fair trade.', consequence: 'An uneasy bargain. They live in fear. You live knowing you could have taken everything.', karmaBonus: -5, startingBonuses: ['Supplies: Moderate', 'Secret: Bunker Location'] },
      corrupt: { text: 'Take everything. Leave no witnesses.', consequence: 'You return as a hero. The elders praise your ruthlessness.', karmaBonus: -45, startingBonuses: ['Supplies: Abundant', 'Dark Secret', 'War Leader'] },
    },
    moralImplication: 'Survival often means taking from others—at what cost to humanity?',
  },
};

export function getStartingVignette(genre: GameGenre, classId: string, backgroundId: string): StartingVignette | null {
  const key = `${genre}:${classId}:${backgroundId}`;
  if (STARTING_VIGNETTES[key]) return STARTING_VIGNETTES[key];
  return generateGenericVignette(genre, classId, backgroundId);
}

function generateGenericVignette(genre: GameGenre, classId: string, backgroundId: string): StartingVignette {
  return {
    id: `generic_${genre}_${classId}_${backgroundId}`, genre, classId, backgroundId,
    title: 'The First Choice',
    narrative: `Your journey as a ${classId} with a ${backgroundId} background has brought you to a crossroads. A moment of decision that will define everything.`,
    initialChoice: {
      virtuous: { text: 'Choose compassion and mercy.', consequence: 'You chose the harder path.', karmaBonus: 25, startingBonuses: ['Karma: Virtuous'] },
      neutral: { text: 'Find a middle ground.', consequence: 'A compromise. Pragmatic.', karmaBonus: 0, startingBonuses: ['Karma: Balanced'] },
      corrupt: { text: 'Take what you need.', consequence: 'You did what was necessary.', karmaBonus: -25, startingBonuses: ['Karma: Dark'] },
    },
    moralImplication: 'Every journey begins with a single choice.',
  };
}

export function formatVignetteForAI(vignette: StartingVignette, chosenPath: 'virtuous' | 'neutral' | 'corrupt'): string {
  const choice = vignette.initialChoice[chosenPath];
  return `ORIGIN: "${vignette.title}"\n${vignette.narrative}\nCHOICE: "${choice.text}"\nCONSEQUENCE: ${choice.consequence}\nPATH: ${chosenPath.toUpperCase()}`;
}

export const ALL_VIGNETTES = STARTING_VIGNETTES;
