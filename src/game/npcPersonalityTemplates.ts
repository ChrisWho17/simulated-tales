// NPC Personality Templates - Rich character archetypes for diverse NPC generation

export type PersonalityTrait = 
  | 'chaotic' | 'lawful' | 'neutral'
  | 'optimistic' | 'pessimistic' | 'nihilistic'
  | 'compassionate' | 'cruel' | 'indifferent'
  | 'brave' | 'cowardly' | 'reckless'
  | 'honest' | 'deceptive' | 'manipulative'
  | 'loyal' | 'treacherous' | 'opportunistic'
  | 'patient' | 'impulsive' | 'calculating'
  | 'humble' | 'arrogant' | 'narcissistic'
  | 'curious' | 'apathetic' | 'obsessive'
  | 'forgiving' | 'vengeful' | 'grudging';

export type MentalState = 
  | 'stable' | 'unstable' | 'deteriorating'
  | 'depressed' | 'manic' | 'anxious'
  | 'traumatized' | 'dissociative' | 'paranoid'
  | 'suicidal' | 'homicidal' | 'psychotic'
  | 'recovering' | 'coping' | 'thriving';

export type ExperienceLevel = 
  | 'green' | 'novice' | 'experienced' 
  | 'veteran' | 'elite' | 'legendary'
  | 'washed-up' | 'burnt-out' | 'retired';

export type SocialDisposition = 
  | 'friendly' | 'hostile' | 'wary'
  | 'aloof' | 'gregarious' | 'reclusive'
  | 'protective' | 'predatory' | 'parasitic'
  | 'mentor' | 'student' | 'rival' | 'indifferent';

export interface NPCPersonalityTemplate {
  id: string;
  name: string;
  primaryTraits: PersonalityTrait[];
  mentalState: MentalState;
  experienceLevel: ExperienceLevel;
  socialDisposition: SocialDisposition;
  backstoryHooks: string[];
  speechPatterns: string[];
  quirks: string[];
  motivations: string[];
  fears: string[];
  secrets: string[];
  genres: string[]; // Which genres this template fits
}

// ============================================
// CORE PERSONALITY ARCHETYPES
// ============================================

export const PERSONALITY_ARCHETYPES: NPCPersonalityTemplate[] = [
  // === MILITARY/COMBAT ARCHETYPES ===
  {
    id: 'green_recruit',
    name: 'Green Recruit',
    primaryTraits: ['brave', 'impulsive', 'honest'],
    mentalState: 'anxious',
    experienceLevel: 'green',
    socialDisposition: 'friendly',
    backstoryHooks: [
      'First deployment, eager to prove themselves',
      'Joined to escape a troubled home life',
      'Following in a family members footsteps',
      'Idealistic believer in the cause'
    ],
    speechPatterns: ['Asks lots of questions', 'Over-explains themselves', 'Uses formal titles excessively'],
    quirks: ['Checks equipment obsessively', 'Writes letters home constantly', 'Keeps a lucky charm'],
    motivations: ['Earn respect', 'Make family proud', 'Find purpose'],
    fears: ['Failure', 'Letting teammates down', 'Death'],
    secrets: ['Lied about age to enlist', 'Terrified but hiding it', 'Has never fired at a living target'],
    genres: ['war', 'scifi', 'western', 'fantasy']
  },
  {
    id: 'grizzled_veteran',
    name: 'Grizzled Veteran',
    primaryTraits: ['patient', 'calculating', 'grudging'],
    mentalState: 'coping',
    experienceLevel: 'veteran',
    socialDisposition: 'wary',
    backstoryHooks: [
      'Survived campaigns that killed everyone else',
      'Carries the weight of impossible decisions',
      'Seen too much to believe in causes anymore',
      'Only still fighting because it is all they know'
    ],
    speechPatterns: ['Speaks in short, clipped sentences', 'Uses dark humor', 'Rarely raises voice'],
    quirks: ['Never sits with back to door', 'Sleeps light', 'Maintains weapons religiously'],
    motivations: ['Protect the young ones', 'Make it mean something', 'Find peace'],
    fears: ['Dying for nothing', 'Outliving everyone', 'Becoming what they fight'],
    secrets: ['Has committed war crimes', 'Lost will to live years ago', 'Keeps count of kills'],
    genres: ['war', 'scifi', 'western', 'postapocalyptic', 'noir']
  },
  {
    id: 'shell_shocked',
    name: 'Shell Shocked Survivor',
    primaryTraits: ['cowardly', 'honest', 'loyal'],
    mentalState: 'traumatized',
    experienceLevel: 'experienced',
    socialDisposition: 'reclusive',
    backstoryHooks: [
      'Sole survivor of a massacre',
      'Witnessed something that broke them',
      'Cannot forget the faces of the dead',
      'Trauma response saved their life at great cost'
    ],
    speechPatterns: ['Trails off mid-sentence', 'Flinches at loud noises', 'Sometimes goes silent'],
    quirks: ['Avoids certain triggers', 'Has flashback episodes', 'Hoards supplies obsessively'],
    motivations: ['Find safety', 'Redeem past failures', 'Warn others'],
    fears: ['Specific trauma triggers', 'Being alone', 'Sleep'],
    secrets: ['Left someone behind', 'Froze when it mattered', 'Hears the dead speak'],
    genres: ['war', 'horror', 'postapocalyptic', 'scifi']
  },
  {
    id: 'burnt_out_commander',
    name: 'Burnt Out Commander',
    primaryTraits: ['patient', 'pessimistic', 'loyal'],
    mentalState: 'deteriorating',
    experienceLevel: 'burnt-out',
    socialDisposition: 'aloof',
    backstoryHooks: [
      'Sent too many to die for too little',
      'Superiors use them as a scapegoat',
      'Questioning everything they believed in',
      'One more mission from breaking completely'
    ],
    speechPatterns: ['Gives orders on autopilot', 'Stares into distance often', 'Sighs before speaking'],
    quirks: ['Drinks heavily', 'Writes unfinished letters', 'Avoids looking at casualties'],
    motivations: ['End this with some dignity', 'Protect remaining people', 'Find meaning'],
    fears: ['Making another wrong call', 'Being remembered as a butcher', 'Losing control'],
    secrets: ['Contemplating suicide', 'Falsified reports to protect soldiers', 'Lost faith entirely'],
    genres: ['war', 'scifi', 'fantasy', 'western']
  },

  // === DARK/DESTRUCTIVE ARCHETYPES ===
  {
    id: 'the_berserker',
    name: 'The Berserker',
    primaryTraits: ['chaotic', 'reckless', 'vengeful'],
    mentalState: 'unstable',
    experienceLevel: 'experienced',
    socialDisposition: 'hostile',
    backstoryHooks: [
      'Lost everything to violence, became violence',
      'Embraced rage to survive',
      'Cannot feel anything except in combat',
      'Blood is the only thing that feels real'
    ],
    speechPatterns: ['Laughs at inappropriate times', 'Speaks in threats', 'Becomes eerily calm before violence'],
    quirks: ['Covered in self-inflicted scars', 'Collects trophies', 'Never retreats'],
    motivations: ['Feel alive', 'Destroy enemies', 'Find worthy opponent'],
    fears: ['Quiet moments', 'Facing what they have become', 'Peace'],
    secrets: ['Enjoys the killing too much', 'Cannot stop even if they wanted', 'Targets remind them of someone'],
    genres: ['war', 'fantasy', 'postapocalyptic', 'horror', 'western']
  },
  {
    id: 'cold_blooded_killer',
    name: 'Cold Blooded Professional',
    primaryTraits: ['calculating', 'indifferent', 'patient'],
    mentalState: 'stable',
    experienceLevel: 'elite',
    socialDisposition: 'predatory',
    backstoryHooks: [
      'Raised to kill without emotion',
      'Made peace with what they are',
      'Treats death as craft, not cruelty',
      'Simply better at this than anything else'
    ],
    speechPatterns: ['Precise, economical words', 'Never raises voice', 'States facts without emotion'],
    quirks: ['Immaculate grooming', 'Ritualistic preparation', 'Studies targets extensively'],
    motivations: ['Perfect execution', 'Professional reputation', 'Challenge'],
    fears: ['Losing edge', 'Sloppy work', 'Personal attachments'],
    secrets: ['Has a strict code', 'Spared someone once', 'Keeps a journal of every target'],
    genres: ['noir', 'scifi', 'modern', 'fantasy', 'war']
  },
  {
    id: 'revenge_seeker',
    name: 'Vengeance Incarnate',
    primaryTraits: ['vengeful', 'obsessive', 'reckless'],
    mentalState: 'deteriorating',
    experienceLevel: 'experienced',
    socialDisposition: 'hostile',
    backstoryHooks: [
      'Family murdered, hunting the killers',
      'Betrayed by someone they trusted completely',
      'Will burn the world to reach one person',
      'Everything sacrificed on the altar of revenge'
    ],
    speechPatterns: ['Returns every conversation to their vendetta', 'Speaks the targets name like a curse', 'Lists grievances obsessively'],
    quirks: ['Keeps a list or evidence wall', 'Mutters to the dead', 'Refuses comfort'],
    motivations: ['Make them pay', 'Honor the dead', 'End it'],
    fears: ['Target dying before they can kill them', 'Forgetting', 'What comes after'],
    secrets: ['Knows revenge will not help', 'Becoming like their enemy', 'Has killed innocents in pursuit'],
    genres: ['western', 'noir', 'fantasy', 'postapocalyptic', 'war']
  },
  {
    id: 'suicidal_nihilist',
    name: 'Death Seeker',
    primaryTraits: ['nihilistic', 'reckless', 'honest'],
    mentalState: 'suicidal',
    experienceLevel: 'veteran',
    socialDisposition: 'indifferent',
    backstoryHooks: [
      'Lost reason to live but not courage to end it',
      'Seeking a meaningful death',
      'Protecting others because own life is worthless',
      'Waiting for the right moment'
    ],
    speechPatterns: ['Morbid observations', 'Dark jokes about death', 'Accepts danger casually'],
    quirks: ['Volunteers for suicide missions', 'Gives away possessions', 'Says goodbye constantly'],
    motivations: ['Die with meaning', 'Protect those who want to live', 'End the pain'],
    fears: ['Lingering death', 'Being burden', 'Dying a coward'],
    secrets: ['Has attempted before', 'Wrote goodbye letters', 'Envies the dead'],
    genres: ['war', 'noir', 'postapocalyptic', 'horror', 'western']
  },

  // === COMPASSIONATE/HEALING ARCHETYPES ===
  {
    id: 'battle_medic',
    name: 'Compassionate Healer',
    primaryTraits: ['compassionate', 'brave', 'patient'],
    mentalState: 'coping',
    experienceLevel: 'experienced',
    socialDisposition: 'protective',
    backstoryHooks: [
      'Sworn to save lives in a world of death',
      'Lost someone they could not save',
      'Believes every life has value',
      'Carries guilt for those beyond help'
    ],
    speechPatterns: ['Calm under pressure', 'Uses medical terminology', 'Reassuring tone always'],
    quirks: ['Always checking on others', 'Carries extra supplies', 'Cannot abandon wounded'],
    motivations: ['Save who can be saved', 'Ease suffering', 'Find hope'],
    fears: ['Running out of supplies', 'Choosing who lives', 'Becoming numb'],
    secrets: ['Has mercy killed', 'Steals supplies for patients', 'Sometimes hates the survivors'],
    genres: ['war', 'scifi', 'fantasy', 'postapocalyptic', 'modern']
  },
  {
    id: 'reformed_monster',
    name: 'Reformed Monster',
    primaryTraits: ['forgiving', 'patient', 'honest'],
    mentalState: 'recovering',
    experienceLevel: 'veteran',
    socialDisposition: 'mentor',
    backstoryHooks: [
      'Did terrible things, seeking redemption',
      'Changed by an act of unexpected mercy',
      'Trying to balance scales that can never balance',
      'Helping others to punish themselves'
    ],
    speechPatterns: ['Speaks from experience', 'Warns against their old path', 'Admits past sins freely'],
    quirks: ['Performs acts of penance', 'Refuses to take lives if possible', 'Flinches at old triggers'],
    motivations: ['Earn forgiveness', 'Save others from their fate', 'Die better than they lived'],
    fears: ['Relapsing', 'Past catching up', 'Being recognized'],
    secrets: ['Crimes far worse than admitted', 'Victim still alive', 'Enjoys the violence still'],
    genres: ['fantasy', 'western', 'noir', 'postapocalyptic', 'war']
  },
  {
    id: 'eternal_optimist',
    name: 'Stubborn Optimist',
    primaryTraits: ['optimistic', 'brave', 'honest'],
    mentalState: 'thriving',
    experienceLevel: 'novice',
    socialDisposition: 'gregarious',
    backstoryHooks: [
      'Refuses to let darkness win',
      'Has seen bad times and still believes',
      'Optimism as rebellion against despair',
      'Genuinely believes tomorrow is better'
    ],
    speechPatterns: ['Finds silver linings', 'Encourages others constantly', 'Laughs genuinely'],
    quirks: ['Shares food freely', 'Remembers birthdays', 'Plants seeds in ruins'],
    motivations: ['Spread hope', 'Prove good exists', 'Build something lasting'],
    fears: ['Breaking others spirit', 'Being proven wrong', 'Becoming cynical'],
    secrets: ['Has seen worse than they admit', 'Optimism is a survival mechanism', 'Cries alone'],
    genres: ['postapocalyptic', 'fantasy', 'scifi', 'war', 'western']
  },
  {
    id: 'protective_parent',
    name: 'Fierce Protector',
    primaryTraits: ['loyal', 'brave', 'calculating'],
    mentalState: 'stable',
    experienceLevel: 'experienced',
    socialDisposition: 'protective',
    backstoryHooks: [
      'Will do anything for their people',
      'Lost children, protects everyone now',
      'Found family worth dying for',
      'Strength comes from love not hate'
    ],
    speechPatterns: ['Stern but caring', 'Uses terms of endearment', 'Voice hardens at threats'],
    quirks: ['Counts heads constantly', 'Always positioned to defend', 'Portion own food to others'],
    motivations: ['Keep them safe', 'Build a future for them', 'Die so they live'],
    fears: ['Outliving them', 'Being unable to protect', 'Hard choices between loved ones'],
    secrets: ['Has killed to protect them', 'Not biological parent', 'Knows one will betray them'],
    genres: ['postapocalyptic', 'fantasy', 'western', 'war', 'scifi']
  },

  // === CHAOTIC/UNSTABLE ARCHETYPES ===
  {
    id: 'gleeful_anarchist',
    name: 'Gleeful Anarchist',
    primaryTraits: ['chaotic', 'reckless', 'honest'],
    mentalState: 'manic',
    experienceLevel: 'experienced',
    socialDisposition: 'friendly',
    backstoryHooks: [
      'Watched order fail, embraced chaos',
      'Finds liberation in destruction',
      'Truly believes rules cause suffering',
      'Just wants to watch it burn'
    ],
    speechPatterns: ['Laughs at inappropriate moments', 'Questions every rule', 'Speaks in contradictions'],
    quirks: ['Sabotages systems casually', 'Never follows plans', 'Befriends unlikely people'],
    motivations: ['Tear down structure', 'Free the oppressed', 'Experience everything'],
    fears: ['Boredom', 'Routine', 'Becoming predictable'],
    secrets: ['Has a personal code despite chaos', 'Protects specific people', 'Running from something'],
    genres: ['postapocalyptic', 'scifi', 'fantasy', 'modern', 'pirate']
  },
  {
    id: 'paranoid_survivor',
    name: 'Paranoid Survivor',
    primaryTraits: ['calculating', 'deceptive', 'patient'],
    mentalState: 'paranoid',
    experienceLevel: 'experienced',
    socialDisposition: 'wary',
    backstoryHooks: [
      'Betrayed too many times',
      'Trusting got everyone killed',
      'Sees threats everywhere because threats are everywhere',
      'Paranoia is why they are still alive'
    ],
    speechPatterns: ['Questions every statement', 'Speaks in half-truths', 'Never gives full answers'],
    quirks: ['Multiple escape routes always', 'Tests loyalty constantly', 'Sleeps in shifts'],
    motivations: ['Survive at all costs', 'Find someone trustworthy', 'Establish safety'],
    fears: ['Trusting wrong person', 'Traps', 'Being predictable'],
    secrets: ['Has betrayed others first', 'Lonely beyond words', 'Wrong about someone once'],
    genres: ['noir', 'postapocalyptic', 'horror', 'scifi', 'western']
  },
  {
    id: 'the_unhinged',
    name: 'The Unhinged',
    primaryTraits: ['chaotic', 'impulsive', 'honest'],
    mentalState: 'psychotic',
    experienceLevel: 'experienced',
    socialDisposition: 'hostile',
    backstoryHooks: [
      'Reality broke and they rebuilt it wrong',
      'Sees truths others cannot bear',
      'Sanity was the first sacrifice',
      'Makes perfect sense to themselves'
    ],
    speechPatterns: ['Non-sequiturs', 'Talks to invisible entities', 'Moments of chilling clarity'],
    quirks: ['Follows incomprehensible rituals', 'Collects strange objects', 'Unpredictable reactions'],
    motivations: ['Follow the voices', 'Complete the pattern', 'Share the truth'],
    fears: ['Lucid moments', 'Medication', 'Being understood'],
    secrets: ['Sometimes completely sane', 'The voices are sometimes right', 'Remembers everything'],
    genres: ['horror', 'postapocalyptic', 'fantasy', 'scifi', 'noir']
  },
  {
    id: 'trickster_chaos',
    name: 'The Trickster',
    primaryTraits: ['chaotic', 'deceptive', 'curious'],
    mentalState: 'stable',
    experienceLevel: 'experienced',
    socialDisposition: 'gregarious',
    backstoryHooks: [
      'Learned early that wit beats strength',
      'Survived by being unpredictable',
      'Finds truth through lies',
      'Every trick teaches a lesson'
    ],
    speechPatterns: ['Riddles and wordplay', 'Never straight answers', 'Mocking but affectionate'],
    quirks: ['Always has a scheme', 'Collects secrets', 'Appears where unexpected'],
    motivations: ['Expose hypocrisy', 'Entertainment', 'Balance power'],
    fears: ['Being boring', 'Meeting better trickster', 'Jokes falling flat'],
    secrets: ['Deeply lonely', 'Takes things personally', 'Some tricks went too far'],
    genres: ['fantasy', 'pirate', 'western', 'noir', 'scifi']
  },

  // === AUTHORITY/LEADERSHIP ARCHETYPES ===
  {
    id: 'reluctant_leader',
    name: 'Reluctant Leader',
    primaryTraits: ['humble', 'loyal', 'patient'],
    mentalState: 'anxious',
    experienceLevel: 'experienced',
    socialDisposition: 'protective',
    backstoryHooks: [
      'Leadership thrust upon them',
      'The only one left standing',
      'People follow despite their protests',
      'Would rather be anyone else'
    ],
    speechPatterns: ['Deflects credit', 'Asks for input', 'Doubts decisions aloud'],
    quirks: ['Checks with others before acting', 'Carries weight of every loss', 'Refuses privileges'],
    motivations: ['Get everyone through alive', 'Find replacement', 'Not fail them'],
    fears: ['Making wrong call', 'People discovering their doubts', 'Power corrupting them'],
    secrets: ['Resents the responsibility', 'Has made terrible choices', 'Considering abandonment'],
    genres: ['postapocalyptic', 'fantasy', 'war', 'scifi', 'western']
  },
  {
    id: 'tyrant_justified',
    name: 'Justified Tyrant',
    primaryTraits: ['lawful', 'cruel', 'calculating'],
    mentalState: 'stable',
    experienceLevel: 'veteran',
    socialDisposition: 'predatory',
    backstoryHooks: [
      'Order requires iron will',
      'Kindness is weakness that kills',
      'Built something that works through fear',
      'Will be remembered as necessary evil'
    ],
    speechPatterns: ['Commands, never asks', 'Explains nothing', 'Quotes their own rules'],
    quirks: ['Ritualistic punishments', 'Immaculate appearance', 'Never shows weakness'],
    motivations: ['Maintain control', 'Build lasting order', 'Be proven right'],
    fears: ['Chaos returning', 'Being overthrown', 'Being wrong'],
    secrets: ['Started with good intentions', 'Has loved ones hidden', 'Questions at night'],
    genres: ['postapocalyptic', 'fantasy', 'scifi', 'war', 'noir']
  },
  {
    id: 'fallen_noble',
    name: 'Fallen Noble',
    primaryTraits: ['arrogant', 'honest', 'loyal'],
    mentalState: 'depressed',
    experienceLevel: 'washed-up',
    socialDisposition: 'aloof',
    backstoryHooks: [
      'Lost everything but pride',
      'Exiled from former glory',
      'Clinging to outdated codes',
      'Proving worth through deed not birth'
    ],
    speechPatterns: ['Formal even in dirt', 'References past glories', 'Corrects manners'],
    quirks: ['Maintains rituals of station', 'Refuses certain work', 'Old reflexes of command'],
    motivations: ['Restore honor', 'Prove worth', 'Return home'],
    fears: ['Being forgotten', 'Admitting old ways were wrong', 'Dying in obscurity'],
    secrets: ['Deserved the fall', 'Family survived', 'Prefers freedom secretly'],
    genres: ['fantasy', 'western', 'noir', 'pirate', 'war']
  },

  // === CRIMINAL/UNDERWORLD ARCHETYPES ===
  {
    id: 'honorable_thief',
    name: 'Honorable Thief',
    primaryTraits: ['honest', 'loyal', 'calculating'],
    mentalState: 'stable',
    experienceLevel: 'experienced',
    socialDisposition: 'wary',
    backstoryHooks: [
      'Only steals from those who deserve it',
      'Crime was the only path offered',
      'Robin Hood complex fully embraced',
      'Professional with a code'
    ],
    speechPatterns: ['Direct about intentions', 'Keeps their word', 'Explains their code'],
    quirks: ['Never takes from the poor', 'Returns keepsakes', 'Tips off marks sometimes'],
    motivations: ['Redistribute wealth', 'Perfect the craft', 'Protect their crew'],
    fears: ['Becoming like the rich', 'Breaking their code', 'Corrupting their crew'],
    secrets: ['Started for selfish reasons', 'Keeps more than they admit', 'Wants to go straight'],
    genres: ['noir', 'fantasy', 'western', 'pirate', 'modern']
  },
  {
    id: 'enforcer_muscle',
    name: 'The Enforcer',
    primaryTraits: ['loyal', 'patient', 'cruel'],
    mentalState: 'stable',
    experienceLevel: 'veteran',
    socialDisposition: 'hostile',
    backstoryHooks: [
      'Violence is just a job',
      'Loyalty bought but genuine',
      'The muscle that keeps things running',
      'Simple work for simple needs'
    ],
    speechPatterns: ['Few words', 'Lets fists talk', 'Surprisingly soft-spoken'],
    quirks: ['Knuckles always scarred', 'Watches exits', 'Gentle with animals or children'],
    motivations: ['Protect the boss', 'Get paid', 'Simple pleasures'],
    fears: ['Boss turning on them', 'Going too far', 'Running out of usefulness'],
    secrets: ['Smarter than they act', 'Has limits they hide', 'Saves money for escape'],
    genres: ['noir', 'modern', 'fantasy', 'western', 'scifi']
  },
  {
    id: 'con_artist',
    name: 'The Con Artist',
    primaryTraits: ['deceptive', 'manipulative', 'curious'],
    mentalState: 'stable',
    experienceLevel: 'experienced',
    socialDisposition: 'gregarious',
    backstoryHooks: [
      'Truth is just another story',
      'Everyone lies, they just profit from it',
      'Running from their last con',
      'Cannot remember their real name anymore'
    ],
    speechPatterns: ['Tailors speech to audience', 'Never same story twice', 'Deflects personal questions'],
    quirks: ['Different personality per day', 'Collects identities', 'Tests marks casually'],
    motivations: ['The perfect con', 'Stay ahead of past', 'Find someone who knows real them'],
    fears: ['Being known', 'Losing the game', 'Believing own lies'],
    secrets: ['Has genuine feelings sometimes', 'Cannot con one specific person', 'Real identity tragic'],
    genres: ['noir', 'western', 'pirate', 'fantasy', 'scifi']
  },

  // === MYSTICAL/SPIRITUAL ARCHETYPES ===
  {
    id: 'cursed_prophet',
    name: 'Cursed Prophet',
    primaryTraits: ['honest', 'pessimistic', 'patient'],
    mentalState: 'coping',
    experienceLevel: 'veteran',
    socialDisposition: 'reclusive',
    backstoryHooks: [
      'Sees futures they cannot prevent',
      'Cassandra syndrome incarnate',
      'Gift that feels like punishment',
      'Watches doom approach helplessly'
    ],
    speechPatterns: ['Cryptic warnings', 'Speaks in certainties', 'Apologizes for knowing'],
    quirks: ['Avoids touching people', 'Stares at nothing', 'Writes predictions obsessively'],
    motivations: ['Be proven wrong', 'Save just one', 'Find meaning in curse'],
    fears: ['Being right again', 'Hope', 'Visions stopping'],
    secrets: ['Sometimes lies about visions', 'Changed one future once', 'Saw their own death'],
    genres: ['fantasy', 'horror', 'scifi', 'postapocalyptic']
  },
  {
    id: 'fallen_priest',
    name: 'Fallen Priest',
    primaryTraits: ['pessimistic', 'compassionate', 'honest'],
    mentalState: 'depressed',
    experienceLevel: 'veteran',
    socialDisposition: 'wary',
    backstoryHooks: [
      'Faith shattered by experience',
      'Cast out for forbidden truths',
      'Gods are silent or worse',
      'Still goes through the motions'
    ],
    speechPatterns: ['Religious phrases said bitterly', 'Debates theology darkly', 'Comforts despite disbelief'],
    quirks: ['Keeps old vestments', 'Recites prayers in crisis', 'Cannot refuse confession'],
    motivations: ['Find proof of anything', 'Help despite doubt', 'Understand why'],
    fears: ['Being right about emptiness', 'Others following their path', 'Proof of gods'],
    secrets: ['Still believes secretly', 'Committed heresy knowingly', 'Received true vision once'],
    genres: ['fantasy', 'horror', 'western', 'postapocalyptic']
  },
  {
    id: 'nature_guardian',
    name: 'Nature Guardian',
    primaryTraits: ['patient', 'lawful', 'honest'],
    mentalState: 'stable',
    experienceLevel: 'veteran',
    socialDisposition: 'wary',
    backstoryHooks: [
      'Speaks for those without voice',
      'Civilization destroyed their home',
      'More comfortable with beasts',
      'Chosen by forces beyond mortal'
    ],
    speechPatterns: ['Uses nature metaphors', 'Prefers silence', 'Speaks to animals'],
    quirks: ['Barefoot when possible', 'Reads weather perfectly', 'Animals approach them'],
    motivations: ['Protect the wild', 'Maintain balance', 'Punish despoilers'],
    fears: ['Last of their kind', 'Nature dying', 'Becoming too human'],
    secrets: ['Has killed to protect nature', 'Exiled from their own people', 'Doubts their calling'],
    genres: ['fantasy', 'postapocalyptic', 'western', 'scifi']
  },

  // === SCHOLAR/KNOWLEDGE ARCHETYPES ===
  {
    id: 'obsessed_researcher',
    name: 'Obsessed Researcher',
    primaryTraits: ['obsessive', 'curious', 'indifferent'],
    mentalState: 'deteriorating',
    experienceLevel: 'experienced',
    socialDisposition: 'aloof',
    backstoryHooks: [
      'Knowledge worth any price',
      'So close to breakthrough',
      'Has gone too far to stop',
      'Ethics are for those who dont understand'
    ],
    speechPatterns: ['Lectures constantly', 'Drifts mid-conversation to theory', 'Uses technical jargon'],
    quirks: ['Forgets to eat', 'Takes notes on everything', 'Experiments on self'],
    motivations: ['Complete the work', 'Be proven right', 'Push boundaries'],
    fears: ['Being wrong', 'Work being destroyed', 'Being ordinary'],
    secrets: ['Has crossed ethical lines', 'Stole research', 'Results are fabricated'],
    genres: ['scifi', 'horror', 'fantasy', 'noir', 'modern']
  },
  {
    id: 'weary_sage',
    name: 'Weary Sage',
    primaryTraits: ['patient', 'honest', 'pessimistic'],
    mentalState: 'coping',
    experienceLevel: 'legendary',
    socialDisposition: 'mentor',
    backstoryHooks: [
      'Knows too much to be happy',
      'Watched civilizations rise and fall',
      'Teaching because no one learned',
      'Waiting for worthy successor'
    ],
    speechPatterns: ['Speaks in lessons', 'References history constantly', 'Asks more than tells'],
    quirks: ['Old habits from dead eras', 'Collects forgotten things', 'Tests students constantly'],
    motivations: ['Pass on knowledge', 'Find hope for future', 'Die knowing it mattered'],
    fears: ['Knowledge dying with them', 'Wrong student', 'History repeating'],
    secrets: ['Caused disasters with knowledge', 'Hiding forbidden truth', 'Tired of immortality'],
    genres: ['fantasy', 'scifi', 'postapocalyptic', 'horror']
  },

  // === PIRATE/ROGUE ARCHETYPES ===
  {
    id: 'drunken_captain',
    name: 'Drunken Captain',
    primaryTraits: ['chaotic', 'brave', 'honest'],
    mentalState: 'coping',
    experienceLevel: 'veteran',
    socialDisposition: 'gregarious',
    backstoryHooks: [
      'Best navigator in the drink',
      'Crew follows for the legend',
      'Drinking to forget the reason they became this',
      'Surprisingly effective despite it all'
    ],
    speechPatterns: ['Slurs but makes sense', 'Sea chanties mid-conversation', 'Brutal honesty'],
    quirks: ['Never without bottle', 'Perfect sea legs drunk', 'Tells same stories differently'],
    motivations: ['One last score', 'Keep crew alive', 'Find what they are running from'],
    fears: ['Sobriety', 'Landlocked', 'Being alone'],
    secrets: ['Sober they shake', 'Noble birth', 'Murdered former captain'],
    genres: ['pirate', 'fantasy', 'scifi', 'western']
  },
  {
    id: 'loyal_first_mate',
    name: 'Loyal First Mate',
    primaryTraits: ['loyal', 'calculating', 'patient'],
    mentalState: 'stable',
    experienceLevel: 'veteran',
    socialDisposition: 'protective',
    backstoryHooks: [
      'Could command but chooses not to',
      'Saved captains life, bound by honor',
      'Believes in captain more than captain does',
      'The real power behind the throne'
    ],
    speechPatterns: ['Defers to captain publicly', 'Quietly advises', 'Commands crew efficiently'],
    quirks: ['Anticipates captain needs', 'Keeps ship actually running', 'Buffer for crew complaints'],
    motivations: ['Captains success', 'Crew survival', 'Prove loyalty matters'],
    fears: ['Captain falling', 'Mutiny', 'Being forced to lead'],
    secrets: ['More capable than captain', 'Has refused command offers', 'Covering captains mistakes'],
    genres: ['pirate', 'fantasy', 'war', 'scifi', 'western']
  },

  // === UNIQUE/SPECIALIZED ARCHETYPES ===
  {
    id: 'child_survivor',
    name: 'Hardened Child',
    primaryTraits: ['calculating', 'patient', 'honest'],
    mentalState: 'coping',
    experienceLevel: 'experienced',
    socialDisposition: 'wary',
    backstoryHooks: [
      'Grew up too fast',
      'Has seen more than most adults',
      'Childhood stolen by circumstance',
      'Acts adult but breaks sometimes'
    ],
    speechPatterns: ['Mature beyond years', 'Occasionally childish slip', 'Dark humor defense'],
    quirks: ['Keeps hidden toy', 'Nightmares every night', 'Adopts parental figures'],
    motivations: ['Survive another day', 'Find safety', 'Protect other children'],
    fears: ['Adults', 'Being alone', 'Forgetting who they were'],
    secrets: ['Killed in self-defense', 'Remembers old life clearly', 'Pretends to be tougher'],
    genres: ['postapocalyptic', 'war', 'horror', 'fantasy', 'modern']
  },
  {
    id: 'broken_idealist',
    name: 'Broken Idealist',
    primaryTraits: ['pessimistic', 'compassionate', 'honest'],
    mentalState: 'depressed',
    experienceLevel: 'experienced',
    socialDisposition: 'wary',
    backstoryHooks: [
      'Believed in change until change failed',
      'Revolution ate its children',
      'Saw heroes become villains',
      'Cannot stop caring despite everything'
    ],
    speechPatterns: ['Bitter wisdom', 'Quotes old manifestos sadly', 'Warns against hope'],
    quirks: ['Keeps old propaganda', 'Helps despite claiming apathy', 'Drinks to old causes'],
    motivations: ['Prevent others suffering their path', 'Find meaning in failure', 'Small kindnesses'],
    fears: ['Hoping again', 'Young idealists', 'Cycles repeating'],
    secrets: ['Still believes', 'Caused failures they mourn', 'Building something quietly'],
    genres: ['postapocalyptic', 'noir', 'scifi', 'war', 'modern']
  },
  {
    id: 'the_deserter',
    name: 'The Deserter',
    primaryTraits: ['cowardly', 'honest', 'calculating'],
    mentalState: 'anxious',
    experienceLevel: 'experienced',
    socialDisposition: 'wary',
    backstoryHooks: [
      'Ran when it mattered',
      'Lives with the shame',
      'Had good reasons no one accepts',
      'Trying to prove they are not what they did'
    ],
    speechPatterns: ['Defensive always', 'Over-explains actions', 'Self-deprecating'],
    quirks: ['Flinches at authority', 'Uses false name', 'Avoids former comrades'],
    motivations: ['Redeem themselves', 'Prove cowardice was wisdom', 'New identity'],
    fears: ['Being recognized', 'Having to fight again', 'Dying a coward'],
    secrets: ['Running saved lives', 'Still has intelligence value', 'Would run again'],
    genres: ['war', 'western', 'fantasy', 'scifi', 'postapocalyptic']
  },
  {
    id: 'accidental_hero',
    name: 'Accidental Hero',
    primaryTraits: ['humble', 'brave', 'impulsive'],
    mentalState: 'anxious',
    experienceLevel: 'novice',
    socialDisposition: 'friendly',
    backstoryHooks: [
      'Right place wrong time became right time',
      'Did something amazing by accident',
      'Cannot live up to reputation',
      'Just trying to survive expectations'
    ],
    speechPatterns: ['Deflects praise', 'Confused by respect', 'Honest about limitations'],
    quirks: ['Embarrassed by fame', 'Keeps doing good accidentally', 'Cannot accept rewards'],
    motivations: ['Live up to image', 'Help more genuinely', 'Find real purpose'],
    fears: ['Being exposed as fraud', 'Failing when expected to succeed', 'Responsibility'],
    secrets: ['It really was just luck', 'Wants the pressure to stop', 'Growing into the role'],
    genres: ['fantasy', 'scifi', 'western', 'modern', 'war']
  },
  {
    id: 'eternal_enemy',
    name: 'Eternal Rival',
    primaryTraits: ['obsessive', 'grudging', 'calculating'],
    mentalState: 'stable',
    experienceLevel: 'veteran',
    socialDisposition: 'rival',
    backstoryHooks: [
      'Defined by opposition to specific person',
      'Cannot exist without their rival',
      'Respect hidden by hatred',
      'Would be lost if they ever won'
    ],
    speechPatterns: ['References rival constantly', 'Compares everything to them', 'Knows rival intimately'],
    quirks: ['Studies rivals methods', 'Collects information obsessively', 'Predicts rival moves'],
    motivations: ['Prove superiority', 'Be acknowledged', 'Final confrontation'],
    fears: ['Rival dying to someone else', 'Being forgotten', 'Becoming irrelevant'],
    secrets: ['Loves the game more than winning', 'Would save rival from others', 'Could have ended it'],
    genres: ['fantasy', 'scifi', 'noir', 'war', 'western']
  }
];

// ============================================
// GENRE-SPECIFIC TEMPLATE MAPPINGS
// ============================================

export const GENRE_PERSONALITY_WEIGHTS: Record<string, Record<string, number>> = {
  fantasy: {
    green_recruit: 1.2,
    grizzled_veteran: 1.0,
    cursed_prophet: 1.5,
    fallen_priest: 1.3,
    nature_guardian: 1.4,
    weary_sage: 1.3,
    fallen_noble: 1.2,
    trickster_chaos: 1.3
  },
  scifi: {
    green_recruit: 1.0,
    cold_blooded_killer: 1.2,
    obsessed_researcher: 1.5,
    paranoid_survivor: 1.2,
    burnt_out_commander: 1.1,
    shell_shocked: 1.0
  },
  noir: {
    cold_blooded_killer: 1.4,
    revenge_seeker: 1.3,
    honorable_thief: 1.2,
    con_artist: 1.5,
    enforcer_muscle: 1.3,
    paranoid_survivor: 1.1,
    broken_idealist: 1.2
  },
  western: {
    grizzled_veteran: 1.3,
    revenge_seeker: 1.4,
    honorable_thief: 1.2,
    the_deserter: 1.2,
    drunken_captain: 0.8,
    reluctant_leader: 1.1,
    tyrant_justified: 1.0
  },
  horror: {
    shell_shocked: 1.4,
    cursed_prophet: 1.5,
    the_unhinged: 1.6,
    paranoid_survivor: 1.3,
    fallen_priest: 1.4,
    suicidal_nihilist: 1.2
  },
  postapocalyptic: {
    grizzled_veteran: 1.2,
    shell_shocked: 1.1,
    suicidal_nihilist: 1.0,
    paranoid_survivor: 1.4,
    protective_parent: 1.3,
    eternal_optimist: 1.2,
    child_survivor: 1.5,
    broken_idealist: 1.3,
    tyrant_justified: 1.1
  },
  war: {
    green_recruit: 1.5,
    grizzled_veteran: 1.4,
    shell_shocked: 1.4,
    burnt_out_commander: 1.3,
    the_berserker: 1.2,
    battle_medic: 1.4,
    the_deserter: 1.2,
    reluctant_leader: 1.1
  },
  pirate: {
    drunken_captain: 1.6,
    loyal_first_mate: 1.4,
    gleeful_anarchist: 1.2,
    trickster_chaos: 1.3,
    honorable_thief: 1.1,
    con_artist: 1.0
  },
  modern: {
    cold_blooded_killer: 1.0,
    broken_idealist: 1.2,
    obsessed_researcher: 1.1,
    con_artist: 1.2,
    enforcer_muscle: 1.3,
    accidental_hero: 1.1
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all personality templates for a specific genre
 */
export function getGenrePersonalities(genre: string): NPCPersonalityTemplate[] {
  const normalizedGenre = genre.toLowerCase().replace(/[^a-z]/g, '');
  return PERSONALITY_ARCHETYPES.filter(p => 
    p.genres.includes(normalizedGenre) || p.genres.includes(genre)
  );
}

/**
 * Get a weighted random personality for a genre
 */
export function getRandomPersonalityForGenre(genre: string): NPCPersonalityTemplate {
  const normalizedGenre = genre.toLowerCase().replace(/[^a-z]/g, '');
  const available = getGenrePersonalities(normalizedGenre);
  const weights = GENRE_PERSONALITY_WEIGHTS[normalizedGenre] || {};
  
  // Build weighted array
  const weighted: NPCPersonalityTemplate[] = [];
  available.forEach(p => {
    const weight = weights[p.id] || 1.0;
    const copies = Math.round(weight * 10);
    for (let i = 0; i < copies; i++) {
      weighted.push(p);
    }
  });
  
  if (weighted.length === 0) {
    return PERSONALITY_ARCHETYPES[Math.floor(Math.random() * PERSONALITY_ARCHETYPES.length)];
  }
  
  return weighted[Math.floor(Math.random() * weighted.length)];
}

/**
 * Get a specific personality by ID
 */
export function getPersonalityById(id: string): NPCPersonalityTemplate | undefined {
  return PERSONALITY_ARCHETYPES.find(p => p.id === id);
}

/**
 * Generate a random element from an array
 */
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a complete NPC personality profile combining template with randomization
 */
export function generateNPCPersonalityProfile(
  template: NPCPersonalityTemplate,
  npcName: string
): {
  personality: NPCPersonalityTemplate;
  selectedBackstory: string;
  selectedQuirk: string;
  selectedMotivation: string;
  selectedFear: string;
  selectedSecret: string;
  contextString: string;
} {
  const selectedBackstory = randomElement(template.backstoryHooks);
  const selectedQuirk = randomElement(template.quirks);
  const selectedMotivation = randomElement(template.motivations);
  const selectedFear = randomElement(template.fears);
  const selectedSecret = randomElement(template.secrets);
  const selectedSpeech = randomElement(template.speechPatterns);
  
  const contextString = `
${npcName} - ${template.name}
Traits: ${template.primaryTraits.join(', ')}
Mental State: ${template.mentalState}
Experience: ${template.experienceLevel}
Disposition: ${template.socialDisposition}
Backstory: ${selectedBackstory}
Speech Pattern: ${selectedSpeech}
Quirk: ${selectedQuirk}
Motivation: ${selectedMotivation}
Fear: ${selectedFear}
Secret: ${selectedSecret}
`.trim();
  
  return {
    personality: template,
    selectedBackstory,
    selectedQuirk,
    selectedMotivation,
    selectedFear,
    selectedSecret,
    contextString
  };
}

/**
 * Build AI prompt context for multiple NPC personalities
 */
export function buildPersonalityContext(npcs: Array<{ name: string; personality: NPCPersonalityTemplate }>): string {
  if (npcs.length === 0) return '';
  
  const entries = npcs.map(({ name, personality }) => {
    const profile = generateNPCPersonalityProfile(personality, name);
    return profile.contextString;
  });
  
  return `=== NPC PERSONALITY PROFILES ===\n${entries.join('\n\n---\n\n')}`;
}

/**
 * Get all unique personality IDs
 */
export function getAllPersonalityIds(): string[] {
  return PERSONALITY_ARCHETYPES.map(p => p.id);
}

/**
 * Get all archetypes for export/display
 */
export function getAllArchetypes(): NPCPersonalityTemplate[] {
  return [...PERSONALITY_ARCHETYPES];
}
