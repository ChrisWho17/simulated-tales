// ============================================================================
// BACKSTORY GENERATOR - Creates rich backstories from creation choices
// ============================================================================
// Generates unique, coherent backstories based on character creation selections
// including traits, fears, desires, hidden depths, and combat role.

import { PersonalityTrait } from './companionTypes';
import { Gender } from '@/types/characterCreation';

// ============================================================================
// TYPES
// ============================================================================

export interface BackstoryInput {
  name: string;
  gender: Gender;
  age: string;
  traits: PersonalityTrait[];
  fears: string[];
  desires: string[];
  hiddenDepths: string[];
  combatRole: string;
  voiceStyle: string;
  worldview: {
    trustInOthers: number;
    beliefInFate: number;
    valueOfLife: number;
    viewOfAuthority: number;
  };
  genre?: string;
}

export interface GeneratedBackstory {
  shortDescription: string; // 1-2 sentences
  fullBackstory: string; // 3-5 paragraphs
  originType: BackstoryOriginType;
  keyEvents: string[];
  relationships: BackstoryRelationship[];
  secrets: string[];
  motivations: string[];
}

export type BackstoryOriginType = 
  | 'noble_fallen' | 'common_rising' | 'outcast_seeking'
  | 'soldier_scarred' | 'scholar_curious' | 'criminal_reformed'
  | 'orphan_survivor' | 'exile_wandering' | 'servant_freed'
  | 'adventurer_restless' | 'refugee_displaced' | 'artisan_specialized';

interface BackstoryRelationship {
  type: 'family' | 'mentor' | 'enemy' | 'lover' | 'friend' | 'rival';
  status: 'alive' | 'dead' | 'estranged' | 'unknown';
  description: string;
}

// ============================================================================
// BACKSTORY TEMPLATES BY ORIGIN
// ============================================================================

const ORIGIN_TEMPLATES: Record<BackstoryOriginType, {
  opener: string[];
  middleEvents: string[];
  presentSituation: string[];
}> = {
  noble_fallen: {
    opener: [
      'Once, {name} walked the gilded halls of {house}, heir to a legacy centuries old.',
      '{name} was born to privilege, raised with silver and silk, never knowing want.',
      'The {family} name once commanded respect throughout the realm, and {name} was its brightest star.',
    ],
    middleEvents: [
      'But fortunes crumble. A scandal—whether deserved or not—stripped everything away.',
      'Betrayal from within destroyed what enemies could not. {name} lost everything in a single night.',
      'War came, and with it, the end of the old ways. The {family} estate burned, taking their future with it.',
    ],
    presentSituation: [
      'Now {name} walks among common folk, noble bearing betraying {pronoun_pos} origins, seeking to rebuild what was lost.',
      'Stripped of title and fortune, {name} discovered strength {pronoun} never knew {pronoun} possessed.',
      '{name} carries the weight of a fallen house, determined that the {family} name will rise again.',
    ],
  },
  common_rising: {
    opener: [
      '{name} grew up with calloused hands and an empty belly, watching the privileged from the shadows.',
      'Born in the mud and muck of the lower quarters, {name} learned early that survival demanded cunning.',
      'No silver spoon for {name}—only cold mornings and the endless struggle to see another day.',
    ],
    middleEvents: [
      'But talent cannot be hidden forever. A chance encounter revealed {name}\'s true potential.',
      'When disaster struck the village, {name} stood when others fled, earning a reputation worth more than gold.',
      'A mentor saw something in {name} that others missed—a spark that needed only fuel to become fire.',
    ],
    presentSituation: [
      'Now {name} climbs, one hard-won step at a time, proving that blood does not determine destiny.',
      'The streets taught {name} everything {pronoun} needed to survive; now {pronoun} learns what {pronoun} needs to thrive.',
      '{name} carries no noble name, only the strength of {pronoun_pos} own making.',
    ],
  },
  outcast_seeking: {
    opener: [
      '{name} never fit in—too strange, too different, too much of everything the others feared.',
      'From the earliest days, {name} knew what it meant to stand apart, watching from the edges.',
      'They called {name} cursed, touched, wrong. Eventually, {name} stopped arguing.',
    ],
    middleEvents: [
      'Exile came not as punishment but as release. The road ahead was lonely but free.',
      'Those years in the wilderness changed {name}, stripped away everything but the essential self.',
      'Alone, {name} discovered truths that the comfortable would never understand.',
    ],
    presentSituation: [
      'Now {name} seeks a place to belong—or to prove that belonging was never the point.',
      '{name} no longer hides what makes {pronoun} different. {pronoun_cap} wears it like armor.',
      'The outcast path led {name} here, to a crossroads where everything might finally change.',
    ],
  },
  soldier_scarred: {
    opener: [
      '{name} answered the call to arms young, full of glory-dreams that reality would crush.',
      'The uniform felt like destiny when {name} first wore it. That was before the blood.',
      '{name} marched to war with a thousand others. Fewer than a hundred came home.',
    ],
    middleEvents: [
      'Battle after battle carved away the innocent person {name} once was, leaving only the survivor.',
      'The things {name} saw—the things {name} did—left scars no healer could touch.',
      'When it finally ended, {name} discovered that peace was the hardest fight of all.',
    ],
    presentSituation: [
      'Now {name} carries the weight of the fallen, unable to forget, unwilling to stop moving.',
      'The war is over, but {name}\'s war continues—against the memories, against the guilt.',
      '{name} fights now for different reasons, seeking redemption in each new battle.',
    ],
  },
  scholar_curious: {
    opener: [
      'Books were {name}\'s first friends, their pages more welcoming than any peer.',
      '{name} asked questions that made elders uncomfortable, seeking truths hidden in dusty tomes.',
      'Knowledge called to {name} like a siren song, impossible to resist despite the dangers.',
    ],
    middleEvents: [
      'Eventually, theory demanded practice. {name} left the safety of the archives for the testing grounds of reality.',
      'A discovery—forbidden, dangerous, world-changing—set {name} on a path of no return.',
      'The institution that raised {name} became a cage. Breaking free meant leaving everything behind.',
    ],
    presentSituation: [
      'Now {name} seeks knowledge in the field, where books cannot teach and only experience reveals truth.',
      'The answers {name} seeks lie beyond any library, in the living world\'s dangerous mysteries.',
      '{name}\'s mind is {pronoun_pos} greatest weapon, though {pronoun} is learning that wisdom and knowledge are not the same.',
    ],
  },
  criminal_reformed: {
    opener: [
      '{name}\'s hands have done dark deeds, taken what wasn\'t given, sometimes taken more than gold.',
      'The criminal world raised {name}, teaching lessons no school would admit to.',
      'Survival meant compromises. {name} made more than most, each one darker than the last.',
    ],
    middleEvents: [
      'But something changed. A victim who should have died. A job that went too far. A mirror too honest to ignore.',
      'Prison, some would say, saved {name}. Those long years of reflection, of forced stillness.',
      'The old life collapsed when {name} refused a final job, crossing people who don\'t forgive.',
    ],
    presentSituation: [
      'Now {name} walks a straighter path, though the shadows still feel like home.',
      'Redemption isn\'t a destination—it\'s a daily choice {name} makes again and again.',
      'The past chases {name} still. Perhaps it always will. But {pronoun} is no longer running toward the dark.',
    ],
  },
  orphan_survivor: {
    opener: [
      '{name} doesn\'t remember parents—only the cold charity of those who took {pronoun} in.',
      'Left on a doorstep, raised by obligation rather than love, {name} learned early to rely only on {pronoun_self}.',
      'The plague took {name}\'s family before {pronoun} was old enough to remember their faces.',
    ],
    middleEvents: [
      'Survival became {name}\'s only family, teaching harsh lessons about trust and dependence.',
      'A found family—others like {name}, discarded by the world—became everything.',
      'When that family too was taken, {name} learned that loss could become armor.',
    ],
    presentSituation: [
      'Now {name} carries {pronoun_pos} own torch, making a family of those who earn the trust no blood ever deserved.',
      'Independence isn\'t {name}\'s goal—it\'s {pronoun_pos} nature. But even {pronoun} is learning that strength can be shared.',
      '{name} still flinches at the word "family," but {pronoun} is learning new definitions.',
    ],
  },
  exile_wandering: {
    opener: [
      '{name} can never return home. The door closed forever the day {pronoun} was cast out.',
      'Banished for crimes real or imagined, {name} has walked the roads for years beyond counting.',
      'The homeland that raised {name} became enemy territory overnight, memories turned to poison.',
    ],
    middleEvents: [
      'Every land became temporary, every connection severed before roots could grow too deep.',
      'The wandering taught {name} to carry home inside, needing nothing the world could take away.',
      'Along the way, {name} discovered that exile opens doors the comfortable never know exist.',
    ],
    presentSituation: [
      'Now {name} moves on again, as always, though perhaps this time the stopping will be different.',
      'Home is a word {name} has redefined—less a place than a state of mind {pronoun} carries everywhere.',
      '{name} has learned that roots can grow in unlikely soil, if one is willing to stay long enough.',
    ],
  },
  servant_freed: {
    opener: [
      '{name} wore another\'s collar for years, serving masters whose names {pronoun} learned to hate.',
      'Born into service, {name} knew no other life until the day everything changed.',
      'The household saw only a servant. They never saw the person watching, learning, waiting.',
    ],
    middleEvents: [
      'Freedom came unexpected—a master\'s death, a bargain fulfilled, a chain finally broken.',
      '{name} earned {pronoun_pos} freedom the hard way, with scars to prove the price.',
      'Escape was only the beginning. Learning to be free proved harder than surviving bondage.',
    ],
    presentSituation: [
      'Now {name} serves no one but {pronoun_self}, though {pronoun} is still learning what that means.',
      'Every choice is still a revelation—the intoxicating, terrifying weight of freedom.',
      '{name} will never serve again. But {pronoun} has learned that partnership is not servitude.',
    ],
  },
  adventurer_restless: {
    opener: [
      'The horizon called to {name} before {pronoun} could walk, a restless itch no settled life could scratch.',
      '{name} was born in motion, it seems—always looking beyond, always craving the next discovery.',
      'A comfortable life waited if {name} would only stay still. That was the one thing {pronoun} could not do.',
    ],
    middleEvents: [
      'The road became {name}\'s teacher, each journey revealing new truths about the world and {pronoun_self}.',
      'Adventures piled upon adventures, some glorious, some better forgotten, all shaping who {name} became.',
      'Close calls and narrow escapes taught {name} that immortality is an illusion—but so is safety.',
    ],
    presentSituation: [
      'Now {name} follows the next horizon, the next mystery, the next adventure calling {pronoun_pos} name.',
      'The road continues, as it always has. But perhaps this time, the destination matters more than the journey.',
      '{name} has seen wonders and horrors alike. Still, {pronoun} rises each morning eager for what comes next.',
    ],
  },
  refugee_displaced: {
    opener: [
      '{name} fled when the disaster came—war, plague, catastrophe—with only the clothes on {pronoun_pos} back.',
      'Home became a memory the night {name} ran, leaving behind everything that once defined {pronoun}.',
      'The exodus swept {name} along with thousands of others, all fleeing the same nightmare.',
    ],
    middleEvents: [
      'Strange lands offered cold welcome to another desperate refugee with nothing to offer.',
      'Survival in exile demanded {name} become someone new, shedding the person {pronoun} used to be.',
      'The journey from displacement to stability was measured in years, tears, and small victories.',
    ],
    presentSituation: [
      'Now {name} has built something from nothing, though the old home still haunts {pronoun_pos} dreams.',
      'Nowhere truly feels like home anymore, but {name} has learned to carry belonging within.',
      '{name} knows what it means to lose everything. That knowledge makes {pronoun} treasure what {pronoun} has.',
    ],
  },
  artisan_specialized: {
    opener: [
      '{name}\'s hands learned their craft young, shaping wood/metal/cloth into beauty and function.',
      'The workshop was {name}\'s world, the rhythms of creation {pronoun_pos} heartbeat.',
      'Apprenticed before {pronoun} could read, {name} spoke through {pronoun_pos} work before {pronoun} found words.',
    ],
    middleEvents: [
      'But craft alone couldn\'t contain {name}\'s spirit. The wider world called with its own kind of artistry.',
      'A commission led to adventure, adventure to danger, danger to a new understanding of {pronoun_self}.',
      'The guild saw only a craftsperson. They never saw the adventurer stirring within.',
    ],
    presentSituation: [
      'Now {name} applies {pronoun_pos} artisan\'s eye to new challenges, finding beauty in unlikely places.',
      'The hands that shape creation can also defend it. {name} has learned both kinds of making.',
      '{name}\'s craft goes with {pronoun} everywhere, a portable piece of home in an unsettled life.',
    ],
  },
};

// ============================================================================
// TRAIT-BASED MODIFIERS
// ============================================================================

const TRAIT_BACKSTORY_ELEMENTS: Partial<Record<PersonalityTrait, string[]>> = {
  honorable: [
    'An unshakeable code guides every decision, inherited from those who came before.',
    'The concept of honor isn\'t abstract to {name}—it\'s the backbone of {pronoun_pos} identity.',
  ],
  ruthless: [
    'Mercy died somewhere along the way, replaced by cold pragmatism.',
    '{name} learned early that sentiment is a luxury the weak cannot afford.',
  ],
  kind: [
    'Despite everything, {name} never lost the instinct to help, to heal, to hope.',
    'Kindness isn\'t weakness to {name}—it\'s a choice made again each day.',
  ],
  cruel: [
    'Something broke in {name}, or perhaps was broken deliberately by those who raised {pronoun}.',
    'Pain became a language {name} learned to speak fluently.',
  ],
  brave: [
    'Fear exists, but {name} has learned to walk through it rather than around it.',
    'Courage was forged in moments that should have broken {name} but instead defined {pronoun}.',
  ],
  cowardly: [
    'Survival instincts scream louder than any other voice in {name}\'s head.',
    '{name} has learned that living to fight another day is often the only victory that matters.',
  ],
  loyal: [
    'Trust, once given, is a bond {name} will not break—even when it might be wiser to.',
    '{name}\'s loyalty runs deeper than blood, forged in fires that tested everything.',
  ],
  treacherous: [
    'Betrayal became a survival skill, alliances mere tools to be used and discarded.',
    '{name} trusts no one completely—and expects the same treatment in return.',
  ],
  ambitious: [
    'A burning drive pushes {name} ever upward, unsatisfied with any achievement.',
    '{name} sees every setback as temporary, every obstacle as a stepping stone.',
  ],
  humble: [
    '{name} carries accomplishments quietly, letting actions speak louder than boasts.',
    'Pride seems foolish to {name}—there is always more to learn, more to become.',
  ],
};

// ============================================================================
// FEAR-BASED BACKSTORY ELEMENTS
// ============================================================================

const FEAR_BACKSTORY_ELEMENTS: Record<string, string> = {
  abandonment: 'The terror of being left behind never quite fades—too many have walked away.',
  failure: 'The weight of expectations presses constantly, the fear of falling short ever-present.',
  death: 'Mortality haunts {name}\'s thoughts, driving {pronoun} to live intensely, desperately.',
  betrayal: 'Trust doesn\'t come easily when every close bond has ended in a knife in the back.',
  weakness: 'Vulnerability feels like death, so {name} armors {pronoun_self} in strength at all costs.',
  loss: 'The people {name} loves feel precious and fragile, the fear of losing them overwhelming.',
  truth: 'Secrets pile upon secrets, the terror of exposure growing with each new day.',
  darkness: 'The unknown holds terrors beyond naming, keeping {name} wary of shadows.',
};

// ============================================================================
// DESIRE-BASED BACKSTORY ELEMENTS
// ============================================================================

const DESIRE_BACKSTORY_ELEMENTS: Record<string, string> = {
  power: 'Power calls to {name} like a siren—the ability to never be helpless again.',
  love: 'Connection runs deeper than any other need, the hunger for genuine intimacy.',
  redemption: 'Past sins demand atonement, driving {name} toward a redemption that may never come.',
  revenge: 'Vengeance burns cold and patient, the only goal that truly matters.',
  freedom: 'Chains—physical or metaphorical—are intolerable. {name} will never be caged again.',
  knowledge: 'Understanding is the ultimate prize, every mystery a challenge to be solved.',
  belonging: 'A place to call home, people to call family—the deepest hunger of all.',
  legacy: 'Something must survive, some mark on the world to prove {name} existed.',
};

// ============================================================================
// GENERATION FUNCTIONS
// ============================================================================

function getPronouns(gender: Gender): { 
  pronoun: string; 
  pronoun_pos: string; 
  pronoun_cap: string;
  pronoun_self: string;
} {
  switch (gender) {
    case 'male':
      return { pronoun: 'he', pronoun_pos: 'his', pronoun_cap: 'He', pronoun_self: 'himself' };
    case 'female':
      return { pronoun: 'she', pronoun_pos: 'her', pronoun_cap: 'She', pronoun_self: 'herself' };
    default:
      return { pronoun: 'they', pronoun_pos: 'their', pronoun_cap: 'They', pronoun_self: 'themself' };
  }
}

function replaceTemplateVars(text: string, input: BackstoryInput): string {
  const pronouns = getPronouns(input.gender);
  const familyName = `${input.name.charAt(0)}${['aldor', 'wick', 'stone', 'vale', 'mere'][Math.floor(Math.random() * 5)]}`;
  const houseName = `House ${familyName}`;
  
  return text
    .replace(/\{name\}/g, input.name)
    .replace(/\{pronoun\}/g, pronouns.pronoun)
    .replace(/\{pronoun_pos\}/g, pronouns.pronoun_pos)
    .replace(/\{pronoun_cap\}/g, pronouns.pronoun_cap)
    .replace(/\{pronoun_self\}/g, pronouns.pronoun_self)
    .replace(/\{family\}/g, familyName)
    .replace(/\{house\}/g, houseName);
}

function selectOriginType(input: BackstoryInput): BackstoryOriginType {
  // Weight origins based on traits and other factors
  const weights: Partial<Record<BackstoryOriginType, number>> = {};
  
  // Combat role influences
  if (input.combatRole === 'tank' || input.combatRole === 'damage') {
    weights.soldier_scarred = (weights.soldier_scarred || 0) + 2;
    weights.adventurer_restless = (weights.adventurer_restless || 0) + 1;
  }
  if (input.combatRole === 'support') {
    weights.scholar_curious = (weights.scholar_curious || 0) + 2;
    weights.servant_freed = (weights.servant_freed || 0) + 1;
  }
  
  // Trait influences
  if (input.traits.includes('ambitious')) {
    weights.noble_fallen = (weights.noble_fallen || 0) + 2;
    weights.common_rising = (weights.common_rising || 0) + 3;
  }
  if (input.traits.includes('honorable')) {
    weights.soldier_scarred = (weights.soldier_scarred || 0) + 2;
    weights.noble_fallen = (weights.noble_fallen || 0) + 1;
  }
  if (input.traits.includes('ruthless') || input.traits.includes('treacherous')) {
    weights.criminal_reformed = (weights.criminal_reformed || 0) + 2;
    weights.outcast_seeking = (weights.outcast_seeking || 0) + 1;
  }
  if (input.traits.includes('spiritual')) {
    weights.scholar_curious = (weights.scholar_curious || 0) + 2;
    weights.exile_wandering = (weights.exile_wandering || 0) + 1;
  }
  if (input.traits.includes('pragmatic')) {
    weights.artisan_specialized = (weights.artisan_specialized || 0) + 2;
    weights.common_rising = (weights.common_rising || 0) + 1;
  }
  
  // Fear influences
  if (input.fears.includes('abandonment')) {
    weights.orphan_survivor = (weights.orphan_survivor || 0) + 3;
  }
  if (input.fears.includes('truth')) {
    weights.criminal_reformed = (weights.criminal_reformed || 0) + 2;
    weights.noble_fallen = (weights.noble_fallen || 0) + 1;
  }
  
  // Desire influences
  if (input.desires.includes('freedom')) {
    weights.servant_freed = (weights.servant_freed || 0) + 3;
    weights.exile_wandering = (weights.exile_wandering || 0) + 2;
  }
  if (input.desires.includes('belonging')) {
    weights.orphan_survivor = (weights.orphan_survivor || 0) + 2;
    weights.refugee_displaced = (weights.refugee_displaced || 0) + 2;
  }
  if (input.desires.includes('redemption')) {
    weights.criminal_reformed = (weights.criminal_reformed || 0) + 3;
    weights.soldier_scarred = (weights.soldier_scarred || 0) + 2;
  }
  
  // Worldview influences
  if (input.worldview.trustInOthers < 30) {
    weights.outcast_seeking = (weights.outcast_seeking || 0) + 2;
    weights.exile_wandering = (weights.exile_wandering || 0) + 1;
  }
  if (input.worldview.viewOfAuthority < 30) {
    weights.criminal_reformed = (weights.criminal_reformed || 0) + 1;
    weights.servant_freed = (weights.servant_freed || 0) + 2;
  }
  
  // Pick weighted random
  const origins = Object.keys(ORIGIN_TEMPLATES) as BackstoryOriginType[];
  const weightedOrigins: BackstoryOriginType[] = [];
  
  origins.forEach(origin => {
    const weight = weights[origin] || 1;
    for (let i = 0; i < weight; i++) {
      weightedOrigins.push(origin);
    }
  });
  
  return weightedOrigins[Math.floor(Math.random() * weightedOrigins.length)];
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export function generateBackstory(input: BackstoryInput): GeneratedBackstory {
  const originType = selectOriginType(input);
  const template = ORIGIN_TEMPLATES[originType];
  
  // Build the full backstory
  const opener = replaceTemplateVars(
    template.opener[Math.floor(Math.random() * template.opener.length)],
    input
  );
  const middle = replaceTemplateVars(
    template.middleEvents[Math.floor(Math.random() * template.middleEvents.length)],
    input
  );
  const present = replaceTemplateVars(
    template.presentSituation[Math.floor(Math.random() * template.presentSituation.length)],
    input
  );
  
  // Add trait elements
  const traitElements: string[] = [];
  input.traits.forEach(trait => {
    const elements = TRAIT_BACKSTORY_ELEMENTS[trait];
    if (elements && Math.random() > 0.5) {
      traitElements.push(replaceTemplateVars(
        elements[Math.floor(Math.random() * elements.length)],
        input
      ));
    }
  });
  
  // Add fear elements
  const fearElements = input.fears
    .filter(() => Math.random() > 0.3)
    .map(fear => replaceTemplateVars(FEAR_BACKSTORY_ELEMENTS[fear] || '', input))
    .filter(Boolean);
  
  // Add desire elements
  const desireElements = input.desires
    .filter(() => Math.random() > 0.3)
    .map(desire => replaceTemplateVars(DESIRE_BACKSTORY_ELEMENTS[desire] || '', input))
    .filter(Boolean);
  
  // Compile full backstory
  const paragraphs = [
    opener,
    middle,
    ...(traitElements.length > 0 ? [traitElements.join(' ')] : []),
    ...(fearElements.length > 0 ? [fearElements.join(' ')] : []),
    ...(desireElements.length > 0 ? [desireElements.join(' ')] : []),
    present,
  ];
  
  const fullBackstory = paragraphs.join('\n\n');
  const shortDescription = `${opener.split('.')[0]}. ${present.split('.')[0]}.`;
  
  // Generate key events
  const keyEvents = [
    middle.split('.')[0] + '.',
    ...input.hiddenDepths.slice(0, 2).map(depth => {
      const labels: Record<string, string> = {
        past_crime: 'Committed an act that still haunts them',
        lost_love: 'Lost someone they loved deeply',
        secret_identity: 'Their true identity remains hidden',
        broken_oath: 'Broke a sacred vow',
        family_secret: 'Carries a dark family secret',
        former_villain: 'Once walked a darker path',
        prophecy: 'Connected to something larger than themselves',
        debt: 'Owes a dangerous debt',
      };
      return labels[depth] || depth;
    }),
  ];
  
  // Generate relationships
  const relationships: BackstoryRelationship[] = [];
  if (input.fears.includes('loss') || input.desires.includes('belonging')) {
    relationships.push({
      type: 'family',
      status: Math.random() > 0.5 ? 'alive' : 'dead',
      description: 'Someone from their past who still matters',
    });
  }
  if (input.traits.includes('vengeful') || input.desires.includes('revenge')) {
    relationships.push({
      type: 'enemy',
      status: 'alive',
      description: 'The target of their vengeance',
    });
  }
  if (input.desires.includes('love') || input.traits.includes('romantic')) {
    relationships.push({
      type: Math.random() > 0.5 ? 'lover' : 'friend',
      status: Math.random() > 0.7 ? 'dead' : 'estranged',
      description: 'Someone who touched their heart',
    });
  }
  
  // Generate secrets from hidden depths
  const secrets = input.hiddenDepths.map(depth => {
    const secretLabels: Record<string, string> = {
      past_crime: 'A crime they committed that no one knows about',
      lost_love: 'A love they never speak of',
      secret_identity: 'Their true identity is hidden',
      broken_oath: 'An oath they swore but broke',
      family_secret: 'A dark truth about their bloodline',
      former_villain: 'They weren\'t always on this side',
      prophecy: 'A prophecy or destiny they fear to acknowledge',
      debt: 'A debt that will eventually come due',
    };
    return secretLabels[depth] || 'A secret they keep hidden';
  });
  
  // Generate motivations from desires
  const motivations = input.desires.map(desire => {
    const motivationLabels: Record<string, string> = {
      power: 'To gain the power to never be helpless again',
      love: 'To find genuine connection and intimacy',
      redemption: 'To atone for past sins',
      revenge: 'To make those who wronged them pay',
      freedom: 'To break every chain that binds them',
      knowledge: 'To uncover hidden truths',
      belonging: 'To find a place to truly call home',
      legacy: 'To leave a mark on the world',
    };
    return motivationLabels[desire] || 'A deep desire driving them forward';
  });
  
  return {
    shortDescription,
    fullBackstory,
    originType,
    keyEvents,
    relationships,
    secrets,
    motivations,
  };
}

// Quick generator for short backstory
export function generateQuickBackstory(input: BackstoryInput): string {
  const result = generateBackstory(input);
  return result.shortDescription;
}

console.log('[BackstoryGenerator] Module loaded');
