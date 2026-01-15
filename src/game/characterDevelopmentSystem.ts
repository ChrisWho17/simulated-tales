// Character Development System - Backstory, Personality, and Growth Tracking

import { GameGenre } from '@/types/genreData';

// ========== BACKSTORY & ORIGINS ==========

export interface LifeEvent {
  id: string;
  age: number;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral' | 'formative';
  category: 'family' | 'education' | 'trauma' | 'achievement' | 'relationship' | 'loss' | 'discovery';
  traitInfluence?: string; // Which trait this might have developed
  skillInfluence?: string; // Which skill this might have boosted
}

export interface Origin {
  id: string;
  name: string;
  description: string;
  socialClass: 'noble' | 'merchant' | 'common' | 'outcast' | 'unknown';
  familyStatus: 'loving' | 'distant' | 'broken' | 'orphaned' | 'complicated' | 'estranged';
  startingAdvantages: string[];
  startingDisadvantages: string[];
  suggestedTraits: string[];
  narrativeHooks: string[];
}

export interface Backstory {
  origin: Origin;
  lifeEvents: LifeEvent[];
  motivation: Motivation;
  secretOrShame?: string;
  aspirations: string[];
  significantPeople: SignificantPerson[];
  generatedNarrative?: string;
}

export interface SignificantPerson {
  name: string;
  relationship: 'parent' | 'sibling' | 'mentor' | 'rival' | 'friend' | 'lover' | 'enemy' | 'mysterious';
  status: 'alive' | 'dead' | 'missing' | 'estranged' | 'unknown';
  influence: string;
}

// Genre-specific origins
export const ORIGINS: Record<GameGenre, Origin[]> = {
  fantasy: [
    { id: 'noble_heir', name: 'Noble Heir', description: 'Born to privilege, trained for leadership', socialClass: 'noble', familyStatus: 'distant', startingAdvantages: ['Wealth', 'Education', 'Connections'], startingDisadvantages: ['Expectations', 'Enemies of the house'], suggestedTraits: ['Proud', 'Educated', 'Ambitious'], narrativeHooks: ['Family rivals plotting', 'Hidden inheritance', 'Arranged marriage'] },
    { id: 'orphan_streets', name: 'Street Orphan', description: 'Raised by the city itself, learned to survive', socialClass: 'outcast', familyStatus: 'orphaned', startingAdvantages: ['Street smarts', 'Resourcefulness', 'Freedom'], startingDisadvantages: ['No safety net', 'Trust issues'], suggestedTraits: ['Cunning', 'Resilient', 'Distrustful'], narrativeHooks: ['Search for parents', 'Old gang catches up', 'Mysterious benefactor'] },
    { id: 'farm_born', name: 'Farm Born', description: 'Simple beginnings, honest work ethic', socialClass: 'common', familyStatus: 'loving', startingAdvantages: ['Work ethic', 'Community bonds', 'Practical skills'], startingDisadvantages: ['Naivety', 'Limited worldview'], suggestedTraits: ['Honest', 'Hardworking', 'Naive'], narrativeHooks: ['Home village threatened', 'Destined for more', 'Family secret'] },
    { id: 'guild_apprentice', name: 'Guild Apprentice', description: 'Trained in a craft or trade from youth', socialClass: 'merchant', familyStatus: 'complicated', startingAdvantages: ['Trade skills', 'Guild connections', 'Discipline'], startingDisadvantages: ['Obligations', 'Rivals'], suggestedTraits: ['Disciplined', 'Ambitious', 'Competitive'], narrativeHooks: ['Master\'s unfinished work', 'Guild politics', 'Secret technique'] },
    { id: 'temple_raised', name: 'Temple Raised', description: 'Found at a temple\'s doorstep, raised by clergy', socialClass: 'common', familyStatus: 'orphaned', startingAdvantages: ['Education', 'Faith', 'Moral compass'], startingDisadvantages: ['Sheltered', 'Religious obligations'], suggestedTraits: ['Devout', 'Compassionate', 'Sheltered'], narrativeHooks: ['Divine calling', 'Questioning faith', 'Temple politics'] },
  ],
  scifi: [
    { id: 'corporate_exec', name: 'Corporate Dynasty', description: 'Born into mega-corp aristocracy', socialClass: 'noble', familyStatus: 'distant', startingAdvantages: ['Wealth', 'Augmentations', 'Influence'], startingDisadvantages: ['Corporate enemies', 'Surveillance'], suggestedTraits: ['Calculating', 'Sophisticated', 'Paranoid'], narrativeHooks: ['Hostile takeover', 'Whistleblower potential', 'Arranged merger'] },
    { id: 'colony_kid', name: 'Colony Kid', description: 'Raised on a frontier world', socialClass: 'common', familyStatus: 'loving', startingAdvantages: ['Self-reliance', 'Adaptability', 'Tight community'], startingDisadvantages: ['Limited resources', 'Isolation'], suggestedTraits: ['Resourceful', 'Independent', 'Loyal'], narrativeHooks: ['Colony in danger', 'Strange discoveries', 'Return to core worlds'] },
    { id: 'lab_grown', name: 'Lab Grown', description: 'Created for a purpose, seeking meaning', socialClass: 'outcast', familyStatus: 'orphaned', startingAdvantages: ['Engineered abilities', 'No baggage', 'Unique perspective'], startingDisadvantages: ['Identity crisis', 'Creator\'s agenda'], suggestedTraits: ['Curious', 'Analytical', 'Searching'], narrativeHooks: ['Sibling clones', 'Original template found', 'Purpose revealed'] },
    { id: 'station_rat', name: 'Station Rat', description: 'Grew up in the maintenance tunnels', socialClass: 'outcast', familyStatus: 'broken', startingAdvantages: ['Tech skills', 'Hidden knowledge', 'Survival instincts'], startingDisadvantages: ['No identity', 'Hunted'], suggestedTraits: ['Sneaky', 'Tech-savvy', 'Paranoid'], narrativeHooks: ['Station secrets', 'Old debts', 'Anonymous patron'] },
  ],
  cyberpunk: [
    { id: 'corpo_dropout', name: 'Corpo Dropout', description: 'Left the megacorp life behind', socialClass: 'merchant', familyStatus: 'estranged', startingAdvantages: ['Inside knowledge', 'Quality chrome', 'Skills'], startingDisadvantages: ['Enemies', 'Burned bridges'], suggestedTraits: ['Disillusioned', 'Skilled', 'Hunted'], narrativeHooks: ['Corporate secrets', 'Former colleagues', 'Revenge agenda'] },
    { id: 'street_gang', name: 'Street Gang', description: 'Colors meant family', socialClass: 'outcast', familyStatus: 'broken', startingAdvantages: ['Street cred', 'Loyalty', 'Combat skills'], startingDisadvantages: ['Gang ties', 'Criminal record'], suggestedTraits: ['Loyal', 'Violent', 'Street-smart'], narrativeHooks: ['Gang war', 'Old blood debts', 'Rising in the life'] },
    { id: 'nomad_born', name: 'Nomad Born', description: 'The road is home', socialClass: 'common', familyStatus: 'loving', startingAdvantages: ['Family bonds', 'Driving skills', 'Freedom'], startingDisadvantages: ['Outsider', 'No fixed assets'], suggestedTraits: ['Free-spirited', 'Loyal', 'Adaptable'], narrativeHooks: ['Family scattered', 'New territory', 'Clan politics'] },
  ],
  horror: [
    { id: 'haunted_past', name: 'Haunted Past', description: 'Something terrible happened...', socialClass: 'common', familyStatus: 'broken', startingAdvantages: ['Sensitivity to supernatural', 'Survival instincts'], startingDisadvantages: ['Trauma', 'Pursued'], suggestedTraits: ['Paranoid', 'Perceptive', 'Scarred'], narrativeHooks: ['It\'s coming back', 'Others who survived', 'Unfinished business'] },
    { id: 'skeptic', name: 'The Skeptic', description: 'There\'s always a rational explanation', socialClass: 'merchant', familyStatus: 'distant', startingAdvantages: ['Analytical mind', 'Education', 'Calm under pressure'], startingDisadvantages: ['Blind spots', 'Overconfidence'], suggestedTraits: ['Rational', 'Stubborn', 'Curious'], narrativeHooks: ['Unexplainable encounter', 'Crisis of belief', 'Protecting loved ones'] },
    { id: 'cursed_bloodline', name: 'Cursed Bloodline', description: 'It runs in the family', socialClass: 'noble', familyStatus: 'complicated', startingAdvantages: ['Forbidden knowledge', 'Dark gifts'], startingDisadvantages: ['The curse', 'Family madness'], suggestedTraits: ['Secretive', 'Burdened', 'Determined'], narrativeHooks: ['Breaking the curse', 'Family history', 'Embracing darkness'] },
  ],
  mystery: [
    { id: 'former_cop', name: 'Former Cop', description: 'Badge is gone, instincts remain', socialClass: 'common', familyStatus: 'broken', startingAdvantages: ['Investigation skills', 'Contacts', 'Intuition'], startingDisadvantages: ['Enemies in the force', 'Burnout'], suggestedTraits: ['Observant', 'Cynical', 'Tenacious'], narrativeHooks: ['Cold case', 'Corrupt partners', 'One that got away'] },
    { id: 'journalist', name: 'Truth Seeker', description: 'The story is everything', socialClass: 'merchant', familyStatus: 'distant', startingAdvantages: ['Research skills', 'Media access', 'Curiosity'], startingDisadvantages: ['Made enemies', 'Obsessive'], suggestedTraits: ['Curious', 'Persistent', 'Reckless'], narrativeHooks: ['Big story', 'Source in danger', 'Conspiracy'] },
  ],
  postapoc: [
    { id: 'vault_dweller', name: 'Vault Dweller', description: 'Emerged from underground shelter', socialClass: 'unknown', familyStatus: 'complicated', startingAdvantages: ['Education', 'Equipment', 'Community'], startingDisadvantages: ['Naive', 'Marked as outsider'], suggestedTraits: ['Curious', 'Idealistic', 'Adaptable'], narrativeHooks: ['Vault mission', 'Lost family', 'Pre-war secrets'] },
    { id: 'wasteland_born', name: 'Wasteland Born', description: 'Never knew the old world', socialClass: 'outcast', familyStatus: 'broken', startingAdvantages: ['Survival skills', 'No illusions', 'Tough'], startingDisadvantages: ['Harsh outlook', 'No education'], suggestedTraits: ['Pragmatic', 'Tough', 'Distrustful'], narrativeHooks: ['Settlement threatened', 'Pre-war artifact', 'Finding community'] },
  ],
  western: [
    { id: 'rancher_kid', name: 'Rancher\'s Kid', description: 'Raised on the range', socialClass: 'common', familyStatus: 'loving', startingAdvantages: ['Horsemanship', 'Land knowledge', 'Work ethic'], startingDisadvantages: ['Naive', 'Ties to home'], suggestedTraits: ['Honest', 'Hardworking', 'Loyal'], narrativeHooks: ['Ranch in trouble', 'Outlaw past', 'Love triangle'] },
    { id: 'outlaw_reformed', name: 'Reformed Outlaw', description: 'Trying to leave the past behind', socialClass: 'outcast', familyStatus: 'broken', startingAdvantages: ['Combat skills', 'Connections', 'Street smarts'], startingDisadvantages: ['Bounty', 'Reputation'], suggestedTraits: ['Regretful', 'Skilled', 'Cautious'], narrativeHooks: ['Past catches up', 'One last job', 'Redemption'] },
  ],
  pirate: [
    { id: 'pressed_sailor', name: 'Pressed Sailor', description: 'Forced into service, found freedom', socialClass: 'common', familyStatus: 'distant', startingAdvantages: ['Seamanship', 'Naval knowledge', 'Determination'], startingDisadvantages: ['Hunted', 'Trust issues'], suggestedTraits: ['Resentful', 'Skilled', 'Free-spirited'], narrativeHooks: ['Navy pursuit', 'Old shipmates', 'Family waiting'] },
    { id: 'merchant_heir', name: 'Merchant Heir', description: 'Trading company legacy, chose the black flag', socialClass: 'merchant', familyStatus: 'estranged', startingAdvantages: ['Navigation', 'Trade knowledge', 'Wealth'], startingDisadvantages: ['Family hunters', 'Soft'], suggestedTraits: ['Ambitious', 'Educated', 'Rebellious'], narrativeHooks: ['Family business', 'Trade secrets', 'Arranged marriage fled'] },
  ],
  noir: [
    { id: 'fallen_idealist', name: 'Fallen Idealist', description: 'Once believed in the system', socialClass: 'common', familyStatus: 'broken', startingAdvantages: ['Connections', 'Experience', 'Reputation'], startingDisadvantages: ['Cynical', 'Enemies made'], suggestedTraits: ['Cynical', 'Experienced', 'Lonely'], narrativeHooks: ['Old case reopened', 'Former partner', 'One good deed'] },
  ],
  urban: [
    { id: 'old_money', name: 'Old Money', description: 'Generational wealth and expectations', socialClass: 'noble', familyStatus: 'distant', startingAdvantages: ['Wealth', 'Connections', 'Education'], startingDisadvantages: ['Expectations', 'Sheltered'], suggestedTraits: ['Refined', 'Entitled', 'Conflicted'], narrativeHooks: ['Family scandals', 'Disinheritance threat', 'Class awakening'] },
    { id: 'immigrant_family', name: 'Immigrant Family', description: 'First generation, carrying dreams', socialClass: 'common', familyStatus: 'loving', startingAdvantages: ['Work ethic', 'Community', 'Perspective'], startingDisadvantages: ['Prejudice', 'Financial pressure'], suggestedTraits: ['Determined', 'Family-oriented', 'Resilient'], narrativeHooks: ['Family obligations', 'Cultural identity', 'Making it'] },
  ],
  romance: [
    { id: 'heartbroken', name: 'Heartbroken', description: 'Love left scars', socialClass: 'common', familyStatus: 'complicated', startingAdvantages: ['Emotional depth', 'Experience', 'Independence'], startingDisadvantages: ['Trust issues', 'Walls up'], suggestedTraits: ['Guarded', 'Passionate', 'Cynical'], narrativeHooks: ['Ex returns', 'Opening up', 'Second chances'] },
  ],
  survival: [
    { id: 'sole_survivor', name: 'Sole Survivor', description: 'Everyone else is gone', socialClass: 'unknown', familyStatus: 'orphaned', startingAdvantages: ['Survival skills', 'Nothing to lose', 'Determination'], startingDisadvantages: ['Trauma', 'Alone'], suggestedTraits: ['Haunted', 'Resourceful', 'Driven'], narrativeHooks: ['Finding others', 'What happened', 'Moving forward'] },
  ],
  historical: [
    { id: 'minor_nobility', name: 'Minor Nobility', description: 'A title with little power', socialClass: 'noble', familyStatus: 'distant', startingAdvantages: ['Education', 'Some status', 'Connections'], startingDisadvantages: ['Expectations', 'Poverty'], suggestedTraits: ['Proud', 'Educated', 'Ambitious'], narrativeHooks: ['Restore glory', 'Political intrigue', 'Forbidden love'] },
  ],
  superhero: [
    { id: 'tragic_origin', name: 'Tragic Origin', description: 'Powers came at great cost', socialClass: 'common', familyStatus: 'broken', startingAdvantages: ['Powers', 'Motivation', 'Nothing to lose'], startingDisadvantages: ['Trauma', 'Enemies'], suggestedTraits: ['Driven', 'Haunted', 'Protective'], narrativeHooks: ['Responsible party', 'Preventing others', 'Finding purpose'] },
  ],
  steampunk: [
    { id: 'inventor_prodigy', name: 'Inventor Prodigy', description: 'Genius with gears and steam', socialClass: 'merchant', familyStatus: 'complicated', startingAdvantages: ['Technical genius', 'Creations', 'Curiosity'], startingDisadvantages: ['Obsessive', 'Social awkwardness'], suggestedTraits: ['Brilliant', 'Eccentric', 'Driven'], narrativeHooks: ['Grand invention', 'Stolen designs', 'Patron\'s agenda'] },
  ],
};

// ========== PERSONALITY SYSTEM ==========

export interface Motivation {
  id: string;
  name: string;
  description: string;
  drivingQuestion: string;
  relatedGoals: string[];
}

export interface CharacterFlaw {
  id: string;
  name: string;
  description: string;
  mechanicalEffect: string;
  roleplayHook: string;
  severity: 'minor' | 'moderate' | 'major';
}

export interface PersonalityTrait {
  id: string;
  name: string;
  description: string;
  dialogueStyle: string;
  decisionBias: string;
  opposingTrait?: string;
}

export const MOTIVATIONS: Motivation[] = [
  { id: 'revenge', name: 'Revenge', description: 'Someone must pay for what they did', drivingQuestion: 'Will vengeance bring peace or consume you?', relatedGoals: ['Find the responsible party', 'Gain power to act', 'Decide fate when moment comes'] },
  { id: 'redemption', name: 'Redemption', description: 'Atoning for past sins', drivingQuestion: 'Can you ever truly make amends?', relatedGoals: ['Right past wrongs', 'Prove you\'ve changed', 'Forgive yourself'] },
  { id: 'protection', name: 'Protection', description: 'Keep someone or something safe', drivingQuestion: 'How far will you go to protect them?', relatedGoals: ['Identify threats', 'Grow stronger', 'Build safe haven'] },
  { id: 'discovery', name: 'Discovery', description: 'Uncover hidden truths', drivingQuestion: 'What will you do with the truth?', relatedGoals: ['Follow the clues', 'Question everything', 'Share or protect knowledge'] },
  { id: 'power', name: 'Power', description: 'Gain influence and control', drivingQuestion: 'What will you become with power?', relatedGoals: ['Acquire resources', 'Build alliances', 'Eliminate rivals'] },
  { id: 'freedom', name: 'Freedom', description: 'Break chains, literal or figurative', drivingQuestion: 'Freedom from what? Freedom to what?', relatedGoals: ['Escape constraints', 'Help others escape', 'Build new life'] },
  { id: 'belonging', name: 'Belonging', description: 'Find your place in the world', drivingQuestion: 'Where do you truly belong?', relatedGoals: ['Find your people', 'Prove your worth', 'Build community'] },
  { id: 'legacy', name: 'Legacy', description: 'Leave your mark on the world', drivingQuestion: 'How will you be remembered?', relatedGoals: ['Accomplish great deeds', 'Pass on knowledge', 'Create something lasting'] },
  { id: 'survival', name: 'Survival', description: 'Make it through another day', drivingQuestion: 'What are you willing to do to survive?', relatedGoals: ['Secure resources', 'Eliminate threats', 'Find safety'] },
  { id: 'love', name: 'Love', description: 'Find or protect true connection', drivingQuestion: 'What would you sacrifice for love?', relatedGoals: ['Win their heart', 'Overcome obstacles', 'Build future together'] },
];

export const CHARACTER_FLAWS: CharacterFlaw[] = [
  { id: 'hubris', name: 'Hubris', description: 'Excessive pride leads to underestimating threats', mechanicalEffect: 'May refuse help or backup', roleplayHook: 'Dismissive of warnings, needs to be humbled', severity: 'moderate' },
  { id: 'addiction', name: 'Addiction', description: 'Substance or behavior dependency', mechanicalEffect: 'Withdrawal effects, resource drain', roleplayHook: 'Hiding the habit, moments of weakness', severity: 'major' },
  { id: 'cowardice', name: 'Cowardice', description: 'Fear often wins over duty', mechanicalEffect: 'May flee or freeze in danger', roleplayHook: 'Proving courage when it matters, living with shame', severity: 'moderate' },
  { id: 'naive', name: 'Naive', description: 'Too trusting, easily deceived', mechanicalEffect: 'Disadvantage on detecting lies', roleplayHook: 'Learning harsh lessons, maintaining hope', severity: 'minor' },
  { id: 'vengeful', name: 'Vengeful', description: 'Cannot let go of grudges', mechanicalEffect: 'May prioritize revenge over mission', roleplayHook: 'Keeping score, moments of mercy', severity: 'moderate' },
  { id: 'impulsive', name: 'Impulsive', description: 'Acts before thinking', mechanicalEffect: 'Rushed decisions, accidental trouble', roleplayHook: 'Living with consequences, learning patience', severity: 'minor' },
  { id: 'secretive', name: 'Secretive', description: 'Hides everything, even from allies', mechanicalEffect: 'Trust issues with party', roleplayHook: 'Secrets revealed at worst times, learning to open up', severity: 'moderate' },
  { id: 'violent', name: 'Violent', description: 'Too quick to bloodshed', mechanicalEffect: 'May escalate situations unnecessarily', roleplayHook: 'Trying to change, moments of restraint', severity: 'major' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Nothing is ever good enough', mechanicalEffect: 'Slower progress, constant criticism', roleplayHook: 'Learning to accept "good enough"', severity: 'minor' },
  { id: 'guilt_ridden', name: 'Guilt-Ridden', description: 'Haunted by past actions', mechanicalEffect: 'Hesitation in similar situations', roleplayHook: 'Processing trauma, making amends', severity: 'moderate' },
];

export const PERSONALITY_TRAITS: PersonalityTrait[] = [
  { id: 'optimist', name: 'Optimist', description: 'Sees the best in situations', dialogueStyle: 'Hopeful, encouraging, silver-lining finder', decisionBias: 'Risk-taking, trusting', opposingTrait: 'pessimist' },
  { id: 'pessimist', name: 'Pessimist', description: 'Expects the worst', dialogueStyle: 'Cautious, doom-focused, realistic', decisionBias: 'Defensive, skeptical', opposingTrait: 'optimist' },
  { id: 'stoic', name: 'Stoic', description: 'Rarely shows emotion', dialogueStyle: 'Brief, controlled, matter-of-fact', decisionBias: 'Logical, unemotional', opposingTrait: 'expressive' },
  { id: 'expressive', name: 'Expressive', description: 'Wears heart on sleeve', dialogueStyle: 'Passionate, reactive, emotional', decisionBias: 'Gut feelings, emotional', opposingTrait: 'stoic' },
  { id: 'diplomatic', name: 'Diplomatic', description: 'Seeks compromise and peace', dialogueStyle: 'Measured, fair, mediating', decisionBias: 'Avoid conflict, find middle ground', opposingTrait: 'confrontational' },
  { id: 'confrontational', name: 'Confrontational', description: 'Faces problems head-on', dialogueStyle: 'Direct, challenging, assertive', decisionBias: 'Force issues, demand answers', opposingTrait: 'diplomatic' },
  { id: 'curious', name: 'Curious', description: 'Always asking questions', dialogueStyle: 'Inquisitive, wondering, exploring', decisionBias: 'Investigate everything, take risks for knowledge' },
  { id: 'practical', name: 'Practical', description: 'Focused on what works', dialogueStyle: 'Efficient, problem-solving, grounded', decisionBias: 'Utility over ideals, pragmatic choices' },
  { id: 'idealistic', name: 'Idealistic', description: 'Driven by principles', dialogueStyle: 'Passionate, principled, visionary', decisionBias: 'Right over easy, stand on principles' },
  { id: 'cynical', name: 'Cynical', description: 'Doubts stated intentions', dialogueStyle: 'Skeptical, sarcastic, questioning motives', decisionBias: 'Assume self-interest, verify everything' },
];

// ========== GROWTH TRACKING ==========

export interface CharacterMilestone {
  id: string;
  turnAchieved: number;
  type: 'level_up' | 'first_kill' | 'first_love' | 'major_choice' | 'near_death' | 'betrayal' | 'redemption' | 'discovery' | 'loss' | 'triumph';
  title: string;
  description: string;
  emotionalImpact: 'joyful' | 'painful' | 'transformative' | 'bittersweet';
  relatedNPCs?: string[];
}

export interface CharacterArc {
  id: string;
  name: string;
  description: string;
  startingState: string;
  currentState: string;
  desiredEndState?: string;
  progress: number; // 0-100
  keyMoments: string[];
  isComplete: boolean;
}

export interface GrowthTracking {
  milestones: CharacterMilestone[];
  arcs: CharacterArc[];
  personalGrowthLog: PersonalGrowthEntry[];
  characterChanges: CharacterChange[];
}

export interface PersonalGrowthEntry {
  id: string;
  turn: number;
  category: 'belief' | 'relationship' | 'skill' | 'personality' | 'worldview';
  before: string;
  after: string;
  trigger: string;
}

export interface CharacterChange {
  id: string;
  turn: number;
  aspect: string;
  description: string;
  isPositive: boolean;
}

// Arc Templates
export const ARC_TEMPLATES: Omit<CharacterArc, 'id' | 'keyMoments' | 'progress' | 'isComplete'>[] = [
  { name: 'From Coward to Hero', description: 'Learning to face fears', startingState: 'Avoids danger, runs from conflict', currentState: 'Avoids danger, runs from conflict', desiredEndState: 'Stands firm when it matters most' },
  { name: 'Revenge to Redemption', description: 'Letting go of hatred', startingState: 'Consumed by need for vengeance', currentState: 'Consumed by need for vengeance', desiredEndState: 'Found peace, moved forward' },
  { name: 'Loner to Leader', description: 'Learning to trust and lead', startingState: 'Works alone, trusts no one', currentState: 'Works alone, trusts no one', desiredEndState: 'Leads others, earns loyalty' },
  { name: 'Naive to Wise', description: 'Growing through harsh experience', startingState: 'Trusts too easily, sees best in everyone', currentState: 'Trusts too easily, sees best in everyone', desiredEndState: 'Discerning, but not cynical' },
  { name: 'Corrupt to Righteous', description: 'Finding moral compass', startingState: 'Selfish, willing to do anything', currentState: 'Selfish, willing to do anything', desiredEndState: 'Principled, protector of others' },
  { name: 'Broken to Whole', description: 'Healing from trauma', startingState: 'Shattered by past, barely functioning', currentState: 'Shattered by past, barely functioning', desiredEndState: 'Accepted past, living fully' },
];

// Milestone detection helpers
export function detectMilestone(
  event: string,
  context: { turn: number; npcName?: string; description?: string }
): CharacterMilestone | null {
  const eventLower = event.toLowerCase();
  
  if (eventLower.includes('level up') || eventLower.includes('leveled up')) {
    return {
      id: `milestone_${Date.now()}`,
      turnAchieved: context.turn,
      type: 'level_up',
      title: 'Growing Stronger',
      description: context.description || 'Reached a new level of ability',
      emotionalImpact: 'joyful',
    };
  }
  
  if (eventLower.includes('first kill') || eventLower.includes('took a life')) {
    return {
      id: `milestone_${Date.now()}`,
      turnAchieved: context.turn,
      type: 'first_kill',
      title: 'Blood on Hands',
      description: context.description || 'Took a life for the first time',
      emotionalImpact: 'transformative',
    };
  }
  
  if (eventLower.includes('fell in love') || eventLower.includes('confessed love')) {
    return {
      id: `milestone_${Date.now()}`,
      turnAchieved: context.turn,
      type: 'first_love',
      title: 'Heart Awakened',
      description: context.description || 'Opened heart to another',
      emotionalImpact: 'joyful',
      relatedNPCs: context.npcName ? [context.npcName] : undefined,
    };
  }
  
  if (eventLower.includes('nearly died') || eventLower.includes('close call')) {
    return {
      id: `milestone_${Date.now()}`,
      turnAchieved: context.turn,
      type: 'near_death',
      title: 'Brush with Death',
      description: context.description || 'Stared death in the face',
      emotionalImpact: 'transformative',
    };
  }
  
  if (eventLower.includes('betrayed') || eventLower.includes('stabbed in back')) {
    return {
      id: `milestone_${Date.now()}`,
      turnAchieved: context.turn,
      type: 'betrayal',
      title: 'Trust Shattered',
      description: context.description || 'Betrayed by someone trusted',
      emotionalImpact: 'painful',
      relatedNPCs: context.npcName ? [context.npcName] : undefined,
    };
  }
  
  return null;
}

// Generate AI backstory prompt
export function generateBackstoryPrompt(
  origin: Origin,
  motivation: Motivation,
  traits: PersonalityTrait[],
  flaws: CharacterFlaw[],
  genre: GameGenre
): string {
  const traitNames = traits.map(t => t.name).join(', ');
  const flawNames = flaws.map(f => f.name).join(', ');
  
  return `Generate a compelling backstory for a ${genre} character:

**Origin:** ${origin.name} - ${origin.description}
- Social class: ${origin.socialClass}
- Family: ${origin.familyStatus}
- Advantages: ${origin.startingAdvantages.join(', ')}
- Challenges: ${origin.startingDisadvantages.join(', ')}

**Core Motivation:** ${motivation.name} - ${motivation.description}
- Driving question: ${motivation.drivingQuestion}

**Personality:** ${traitNames}
**Flaws:** ${flawNames}

Write 2-3 paragraphs covering:
1. Early life and formative experiences
2. The event that set them on their current path
3. What they seek now and why

Include at least one specific memory and one significant relationship. Keep it evocative but concise.`;
}

// Calculate personality dialogue modifier
export function getDialogueStyleFromTraits(traits: PersonalityTrait[]): string {
  const styles = traits.map(t => t.dialogueStyle);
  return styles.join('; ');
}

// Get decision bias summary
export function getDecisionBiasFromTraits(traits: PersonalityTrait[], flaws: CharacterFlaw[]): string {
  const biases = [
    ...traits.map(t => t.decisionBias),
    ...flaws.map(f => f.roleplayHook),
  ];
  return biases.join('. ');
}
