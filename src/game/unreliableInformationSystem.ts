// Unreliable Information System - NPCs can lie, be wrong, have biases, or know partial truths
// Based on the Grudges and Memory Overhaul specification
// Research-backed values from social psychology studies on deception, rumor propagation, and memory distortion

// ============= REALISTIC PSYCHOLOGY CONSTANTS =============
// Based on research: DiFonzo & Bordia on rumor spread, Telephone Game studies on distortion

const INFORMATION_CONSTANTS = {
  // Rumor spread: Research shows rumors spread exponentially early, then plateau
  // Each retelling distorts ~15-20% of details (Telephone Game research)
  DISTORTION_PER_RETELLING: 0.17,
  
  // Truth decay: Information accuracy drops ~10-15% per day without reinforcement
  TRUTH_DECAY_RATE_PER_DAY: 0.12,
  
  // Gossip tendency thresholds (0-100 scale)
  GOSSIP_THRESHOLDS: {
    secretive: 20,      // Rarely shares
    reserved: 40,       // Shares with close friends
    average: 60,        // Normal gossip behavior
    talkative: 80,      // Frequently gossips
    compulsive: 95,     // Can't keep secrets
  },
  
  // Bias distortion: How much personal bias affects information
  // Research: Confirmation bias distorts recalled information by 20-40%
  BIAS_DISTORTION_FACTOR: 0.30,
  
  // Deception detection: Average person detects lies ~54% (barely above chance)
  BASE_LIE_DETECTION_CHANCE: 0.54,
  
  // Memory decay curve (Ebbinghaus curve adapted)
  MEMORY_RETENTION: {
    immediate: 1.0,
    after_1_hour: 0.56,
    after_1_day: 0.33,
    after_1_week: 0.25,
    after_1_month: 0.21,
  },
  
  // Emotional events remembered better (flashbulb memory effect)
  EMOTIONAL_MEMORY_BONUS: 1.5,
  
  // Self-serving bias in retelling
  SELF_SERVING_DISTORTION: 0.25,
};

// ============= NPC INFORMATION PROFILE =============

export interface NPCReliabilityProfile {
  honesty: number;          // 0-100, baseline tendency to tell truth
  knowledge: number;        // 0-100, general education/awareness level
  memory: number;           // 0-100, accuracy of recall over time
  bias: string[];           // Active biases that distort perception
  gossipTendency: number;   // 0-100, likelihood to spread information
  confabulationTendency: number; // 0-100, tendency to fill memory gaps with invented details
}

export interface NPCMotivations {
  protects: string[];       // Things they'll lie to protect (family, guild, self)
  fears: string[];          // Topics that trigger defensive lying
  desires: string[];        // Things they want (may manipulate to get)
  loyalties: string[];      // Groups whose interests they serve
  secrets: string[];        // Topics they actively conceal
}

export interface NPCKnowledgeBase {
  localEvents: number;      // 0-100 awareness of local happenings
  politicalNews: number;    // 0-100 awareness of politics/power
  underworld: number;       // 0-100 knowledge of criminal activities
  historicalFacts: number;  // 0-100 education in history
  tradeCraft: number;       // 0-100 professional knowledge
  rumors: number;           // 0-100 how much gossip they've absorbed
  secrets: number;          // 0-100 access to hidden information
}

export interface NPCInformationProfile {
  reliability: NPCReliabilityProfile;
  motivations: NPCMotivations;
  knowledgeBase: NPCKnowledgeBase;
}

// ============= DEFAULT PROFILES BY NPC TYPE =============
// Based on occupational psychology and social role research

export function createDefaultInformationProfile(npcType: string): NPCInformationProfile {
  const profiles: Record<string, NPCInformationProfile> = {
    merchant: {
      reliability: { 
        honesty: 65, // Slight tendency to embellish for sales
        knowledge: 60, 
        memory: 75, // Good memory for deals
        bias: ['pro_profit', 'optimistic_about_goods'], 
        gossipTendency: 55,
        confabulationTendency: 30 
      },
      motivations: { 
        protects: ['guild_secrets', 'profit_margins', 'suppliers'], 
        fears: ['thieves', 'tax_collectors', 'competition'], 
        desires: ['money', 'status', 'good_reputation'], 
        loyalties: ['merchant_guild'],
        secrets: ['illegal_goods', 'price_fixing'] 
      },
      knowledgeBase: { 
        localEvents: 70, politicalNews: 45, underworld: 25, 
        historicalFacts: 30, tradeCraft: 90, rumors: 65, secrets: 20 
      },
    },
    guard: {
      reliability: { 
        honesty: 55, // May cover for colleagues
        knowledge: 50, 
        memory: 80, // Trained observation
        bias: ['pro_authority', 'suspicious_of_outsiders'], 
        gossipTendency: 35,
        confabulationTendency: 20 
      },
      motivations: { 
        protects: ['fellow_guards', 'commanding_officers', 'city_secrets'], 
        fears: ['criminals', 'corruption_exposure', 'demotion'], 
        desires: ['order', 'promotion', 'respect'], 
        loyalties: ['city_guard', 'nobility'],
        secrets: ['guard_corruption', 'noble_crimes'] 
      },
      knowledgeBase: { 
        localEvents: 85, politicalNews: 50, underworld: 45, 
        historicalFacts: 25, tradeCraft: 20, rumors: 40, secrets: 35 
      },
    },
    innkeeper: {
      reliability: { 
        honesty: 75, // Generally honest, good for business
        knowledge: 70, 
        memory: 80, // Remembers faces and stories
        bias: ['neutral', 'pro_paying_customers'], 
        gossipTendency: 75, // Hub of information
        confabulationTendency: 35 // Embellishes stories
      },
      motivations: { 
        protects: ['regular_customers', 'business_reputation'], 
        fears: ['authority_scrutiny', 'violence_in_establishment'], 
        desires: ['peaceful_business', 'good_stories', 'tips'], 
        loyalties: ['paying_customers'],
        secrets: ['who_was_here', 'overheard_conversations'] 
      },
      knowledgeBase: { 
        localEvents: 95, politicalNews: 50, underworld: 35, 
        historicalFacts: 40, tradeCraft: 60, rumors: 90, secrets: 45 
      },
    },
    scholar: {
      reliability: { 
        honesty: 85, // Values truth highly
        knowledge: 95, // Well-educated
        memory: 85, 
        bias: ['pro_logic', 'anti_superstition', 'academic_elitism'], 
        gossipTendency: 25, // Discreet
        confabulationTendency: 15 // Careful with facts
      },
      motivations: { 
        protects: ['academic_reputation', 'research', 'students'], 
        fears: ['being_wrong', 'ignorance', 'anti_intellectualism'], 
        desires: ['knowledge', 'discovery', 'recognition'], 
        loyalties: ['academy', 'truth'],
        secrets: ['dangerous_knowledge', 'academic_scandals'] 
      },
      knowledgeBase: { 
        localEvents: 40, politicalNews: 65, underworld: 10, 
        historicalFacts: 98, tradeCraft: 45, rumors: 20, secrets: 55 
      },
    },
    criminal: {
      reliability: { 
        honesty: 35, // Lies professionally
        knowledge: 55, 
        memory: 70, 
        bias: ['anti_authority', 'self_preservation'], 
        gossipTendency: 40, // Careful about what they share
        confabulationTendency: 45 // Creates cover stories
      },
      motivations: { 
        protects: ['crew', 'contacts', 'hideouts', 'operations'], 
        fears: ['guards', 'betrayal', 'prison', 'stronger_criminals'], 
        desires: ['money', 'freedom', 'power', 'respect'], 
        loyalties: ['thieves_guild', 'crew'],
        secrets: ['everything'] 
      },
      knowledgeBase: { 
        localEvents: 70, politicalNews: 35, underworld: 95, 
        historicalFacts: 20, tradeCraft: 55, rumors: 75, secrets: 70 
      },
    },
    noble: {
      reliability: { 
        honesty: 45, // Trained in political deception
        knowledge: 75, 
        memory: 80, 
        bias: ['pro_nobility', 'classist', 'traditionalist'], 
        gossipTendency: 65, // Court gossip is currency
        confabulationTendency: 40 // Embellishes status
      },
      motivations: { 
        protects: ['family_name', 'reputation', 'wealth', 'scandals'], 
        fears: ['scandal', 'poverty', 'loss_of_status', 'commoners_rising'], 
        desires: ['power', 'status', 'advantageous_marriages', 'influence'], 
        loyalties: ['nobility', 'family', 'faction'],
        secrets: ['family_scandals', 'political_schemes', 'debts'] 
      },
      knowledgeBase: { 
        localEvents: 55, politicalNews: 95, underworld: 20, 
        historicalFacts: 70, tradeCraft: 30, rumors: 80, secrets: 60 
      },
    },
    commoner: {
      reliability: { 
        honesty: 70, // Generally honest
        knowledge: 35, 
        memory: 55, 
        bias: ['varies'], 
        gossipTendency: 65,
        confabulationTendency: 45 // Fills gaps in understanding
      },
      motivations: { 
        protects: ['family', 'neighbors'], 
        fears: ['authority', 'nobles', 'violence', 'hunger'], 
        desires: ['safety', 'prosperity', 'peace'], 
        loyalties: ['family', 'community'],
        secrets: ['little_of_importance'] 
      },
      knowledgeBase: { 
        localEvents: 65, politicalNews: 20, underworld: 25, 
        historicalFacts: 15, tradeCraft: 50, rumors: 75, secrets: 10 
      },
    },
    priest: {
      reliability: { 
        honesty: 75, // Bound by moral code
        knowledge: 65, 
        memory: 70, 
        bias: ['religious', 'moralistic'], 
        gossipTendency: 30, // Confession confidentiality
        confabulationTendency: 20 
      },
      motivations: { 
        protects: ['faithful', 'church_secrets', 'confessions'], 
        fears: ['heresy', 'demonic', 'loss_of_faith'], 
        desires: ['salvation', 'converts', 'divine_favor'], 
        loyalties: ['church', 'deity'],
        secrets: ['confessions', 'church_politics'] 
      },
      knowledgeBase: { 
        localEvents: 60, politicalNews: 55, underworld: 15, 
        historicalFacts: 75, tradeCraft: 30, rumors: 50, secrets: 40 
      },
    },
  };
  
  return profiles[npcType] || profiles.commoner;
}

// ============= LYING LOGIC =============
// Based on deception research and motivation-based lying models

export interface LieResult {
  lies: boolean;
  lieType: 'omission' | 'fabrication' | 'distortion' | 'deflection' | null;
  reason: string | null;
  confidence: number; // How convincingly they lie
  detectionDifficulty: number; // How hard to detect (0-100)
}

export function determineIfNPCLies(
  profile: NPCInformationProfile,
  topic: string,
  trustLevel: number, // -100 to 100
  stakes: 'low' | 'medium' | 'high' = 'medium'
): LieResult {
  const lowerTopic = topic.toLowerCase();
  const baseHonesty = profile.reliability.honesty;
  
  // Stakes modifier: people lie more when stakes are high
  const stakesModifier = stakes === 'high' ? -20 : stakes === 'low' ? 10 : 0;
  const effectiveHonesty = baseHonesty + stakesModifier + (trustLevel * 0.2);
  
  // Check if topic triggers protective lying
  for (const protected_ of profile.motivations.protects) {
    if (lowerTopic.includes(protected_.toLowerCase())) {
      // Will almost certainly lie to protect this
      if (Math.random() * 100 > effectiveHonesty - 30) {
        return {
          lies: true,
          lieType: 'omission', // Usually hide rather than fabricate
          reason: `protecting_${protected_}`,
          confidence: 70 + Math.random() * 20,
          detectionDifficulty: 60,
        };
      }
    }
  }
  
  // Check secrets - always lie about these
  for (const secret of profile.motivations.secrets) {
    if (lowerTopic.includes(secret.toLowerCase())) {
      return {
        lies: true,
        lieType: 'fabrication',
        reason: `concealing_secret_${secret}`,
        confidence: 60 + Math.random() * 30,
        detectionDifficulty: 70,
      };
    }
  }
  
  // Low trust = more likely to lie
  if (trustLevel < -40) {
    if (Math.random() * 100 > effectiveHonesty) {
      return {
        lies: true,
        lieType: 'distortion',
        reason: 'distrust_of_player',
        confidence: 50 + Math.random() * 30,
        detectionDifficulty: 50,
      };
    }
  }
  
  // Check fears - may lie to avoid topic
  for (const fear of profile.motivations.fears) {
    if (lowerTopic.includes(fear.toLowerCase())) {
      if (Math.random() < 0.4) {
        return {
          lies: true,
          lieType: 'deflection',
          reason: `fear_of_${fear}`,
          confidence: 40 + Math.random() * 30,
          detectionDifficulty: 40, // Fear makes lying harder
        };
      }
    }
  }
  
  // Loyalty-based lying
  for (const loyalty of profile.motivations.loyalties) {
    if (lowerTopic.includes(loyalty.toLowerCase())) {
      if (Math.random() < 0.35) {
        return {
          lies: true,
          lieType: 'distortion',
          reason: `loyal_to_${loyalty}`,
          confidence: 60 + Math.random() * 25,
          detectionDifficulty: 55,
        };
      }
    }
  }
  
  return { 
    lies: false, 
    lieType: null, 
    reason: null, 
    confidence: 0,
    detectionDifficulty: 0 
  };
}

// ============= TRUTH VALUE CALCULATION =============
// Based on information reliability research

export type InformationSource = 
  | 'direct_witness'      // Saw it themselves
  | 'participated'        // Was involved
  | 'trusted_source'      // Heard from reliable person
  | 'second_hand'         // Heard from someone
  | 'rumor'               // Common knowledge/gossip
  | 'assumption'          // Inferred/guessed
  | 'fabricated';         // Made up

// Research: Information reliability drops with each degree of separation
const SOURCE_RELIABILITY: Record<InformationSource, number> = {
  participated: 0.95,
  direct_witness: 0.85,
  trusted_source: 0.65,
  second_hand: 0.45,
  rumor: 0.25,
  assumption: 0.15,
  fabricated: 0,
};

export interface KnownFact {
  factId: string;
  version: string;          // What they believe happened
  confidence: number;       // 0-100 how sure they are
  source: InformationSource;
  bias?: string;            // If biased, what colors this
  timeSinceEvent: number;   // Hours since they learned it
  emotionalIntensity: number; // 0-10 (emotional events remembered better)
}

export function calculateTruthValue(knowledge: KnownFact, npcMemory: number): number {
  let truth = 100;
  
  // Source reliability
  truth *= SOURCE_RELIABILITY[knowledge.source];
  
  // Confidence modifier
  truth *= (knowledge.confidence / 100);
  
  // Memory decay (Ebbinghaus curve)
  const hoursElapsed = knowledge.timeSinceEvent;
  let memoryRetention = 1;
  if (hoursElapsed > 720) memoryRetention = INFORMATION_CONSTANTS.MEMORY_RETENTION.after_1_month;
  else if (hoursElapsed > 168) memoryRetention = INFORMATION_CONSTANTS.MEMORY_RETENTION.after_1_week;
  else if (hoursElapsed > 24) memoryRetention = INFORMATION_CONSTANTS.MEMORY_RETENTION.after_1_day;
  else if (hoursElapsed > 1) memoryRetention = INFORMATION_CONSTANTS.MEMORY_RETENTION.after_1_hour;
  
  // NPC memory skill affects decay
  const memoryModifier = npcMemory / 100;
  memoryRetention = memoryRetention * (0.5 + memoryModifier * 0.5);
  truth *= memoryRetention;
  
  // Emotional events remembered better (flashbulb memory)
  if (knowledge.emotionalIntensity > 6) {
    const emotionalBonus = 1 + ((knowledge.emotionalIntensity - 6) / 10) * 
      (INFORMATION_CONSTANTS.EMOTIONAL_MEMORY_BONUS - 1);
    truth *= Math.min(emotionalBonus, INFORMATION_CONSTANTS.EMOTIONAL_MEMORY_BONUS);
  }
  
  // Bias distortion
  if (knowledge.bias) {
    truth *= (1 - INFORMATION_CONSTANTS.BIAS_DISTORTION_FACTOR);
  }
  
  return Math.round(Math.min(truth, 100));
}

// ============= RUMOR SYSTEM =============
// Based on DiFonzo & Bordia rumor research and Telephone Game studies

export interface Rumor {
  id: string;
  originalContent: string;    // The original truth
  currentVersion: string;     // May have changed
  origin: string;             // NPC who started it
  truthValue: number;         // 0-100 accuracy compared to original
  spread: string[];           // NPCs who know it
  retellings: number;         // Times it's been passed on
  age: number;                // Ticks since created
  emotionalCharge: number;    // 0-10 (sensational rumors spread faster)
  relevance: 'personal' | 'local' | 'regional' | 'world';
  expired: boolean;
}

export function createRumor(
  content: string, 
  origin: string, 
  initialTruth: number,
  emotionalCharge: number = 5
): Rumor {
  return {
    id: `rumor_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    originalContent: content,
    currentVersion: content,
    origin,
    truthValue: initialTruth,
    spread: [origin],
    retellings: 0,
    age: 0,
    emotionalCharge: Math.min(emotionalCharge, 10),
    relevance: 'local',
    expired: false,
  };
}

// Research-based distortion patterns (Telephone Game studies)
// People tend to: simplify, dramatize, conform to expectations, fill gaps
const DISTORTION_PATTERNS = [
  // Simplification
  { pattern: /(\w+) and (\w+) and (\w+)/gi, replace: '$1 and others', type: 'simplify' },
  { pattern: /approximately (\d+)/gi, replace: 'about $1', type: 'simplify' },
  
  // Dramatization
  { pattern: /\bsome\b/gi, replace: 'many', type: 'dramatize' },
  { pattern: /\bmight have\b/gi, replace: 'definitely', type: 'dramatize' },
  { pattern: /\bpossibly\b/gi, replace: 'certainly', type: 'dramatize' },
  { pattern: /\bsmall\b/gi, replace: 'significant', type: 'dramatize' },
  { pattern: /\ba few\b/gi, replace: 'several', type: 'dramatize' },
  { pattern: /\binjured\b/gi, replace: 'badly wounded', type: 'dramatize' },
  
  // Additions
  { pattern: /$/g, replace: ' Or so they say.', type: 'hedge', chance: 0.2 },
  { pattern: /$/g, replace: ' Everyone knows it.', type: 'certainty', chance: 0.15 },
];

export function distortRumor(
  content: string, 
  npcBiases: string[],
  npcConfabulation: number
): { content: string; truthLoss: number } {
  let distorted = content;
  let truthLoss = 0;
  
  // Apply random distortion patterns
  for (const pattern of DISTORTION_PATTERNS) {
    if ('chance' in pattern) {
      if (Math.random() < (pattern.chance || 0.3)) {
        distorted = distorted.replace(pattern.pattern, pattern.replace);
        truthLoss += 5;
      }
    } else if (Math.random() < 0.25) {
      distorted = distorted.replace(pattern.pattern, pattern.replace);
      truthLoss += 8;
    }
  }
  
  // Confabulation: NPC adds invented details
  if (Math.random() * 100 < npcConfabulation) {
    const additions = [
      ' I heard it was even worse than that.',
      ' There\'s more to the story, but I can\'t say.',
      ' And that\'s not even the half of it.',
    ];
    distorted += additions[Math.floor(Math.random() * additions.length)];
    truthLoss += 15;
  }
  
  // Bias-based distortion
  for (const bias of npcBiases) {
    if (bias.includes('pro_') && Math.random() < 0.3) {
      // Favorable spin on related topics
      truthLoss += 10;
    }
    if (bias.includes('anti_') && Math.random() < 0.3) {
      // Negative spin on related topics
      truthLoss += 10;
    }
  }
  
  return { 
    content: distorted, 
    truthLoss: Math.min(truthLoss, INFORMATION_CONSTANTS.DISTORTION_PER_RETELLING * 100) 
  };
}

export function processRumorSpread(
  rumors: Rumor[],
  npcProfiles: Record<string, NPCInformationProfile>,
  hoursElapsed: number = 1
): Rumor[] {
  return rumors.map(rumor => {
    if (rumor.expired) return rumor;
    
    const updated = { ...rumor, age: rumor.age + hoursElapsed };
    
    // Rumors die based on age and relevance
    // Local rumors die faster than regional/world rumors
    const maxAge = {
      personal: 48,   // 2 days
      local: 120,     // 5 days
      regional: 336,  // 2 weeks
      world: 720,     // 1 month
    }[rumor.relevance];
    
    if (updated.age > maxAge || Math.random() < 0.02) {
      return { ...updated, expired: true };
    }
    
    // Spread to gossipy NPCs
    for (const [npcId, profile] of Object.entries(npcProfiles)) {
      if (updated.spread.includes(npcId)) continue;
      
      // Chance to spread based on gossip tendency and rumor's emotional charge
      const spreadChance = (profile.reliability.gossipTendency / 100) * 
        (0.5 + updated.emotionalCharge / 20) * 
        (hoursElapsed / 10);
      
      if (Math.random() < spreadChance) {
        updated.spread.push(npcId);
        updated.retellings++;
        
        // Distort the rumor
        const { content, truthLoss } = distortRumor(
          updated.currentVersion,
          profile.reliability.bias,
          profile.reliability.confabulationTendency
        );
        
        updated.currentVersion = content;
        updated.truthValue = Math.max(0, updated.truthValue - truthLoss);
      }
    }
    
    return updated;
  }).filter(r => !r.expired);
}

// ============= PLAYER KNOWLEDGE TRACKING =============

export interface PlayerKnowledge {
  topic: string;
  info: string;
  source: string;           // Who told them
  truthValue: number;       // Hidden from player
  turnLearned: number;
  verified: boolean;
  verifiedBy?: string;
  contradictedBy?: string[];
  actualTruth?: string;
}

export function recordPlayerKnowledge(
  existing: PlayerKnowledge[],
  topic: string,
  info: string,
  source: string,
  truthValue: number,
  currentTurn: number
): PlayerKnowledge[] {
  // Check for contradictions with existing knowledge
  const contradictions = existing.filter(k => 
    k.topic === topic && k.info !== info
  ).map(k => k.source);
  
  return [
    ...existing,
    {
      topic,
      info,
      source,
      truthValue,
      turnLearned: currentTurn,
      verified: false,
      contradictedBy: contradictions.length > 0 ? contradictions : undefined,
    },
  ];
}

// ============= AI PROMPT CONTEXT =============

export function buildInformationContext(
  npcName: string,
  profile: NPCInformationProfile,
  topic: string,
  lieResult: LieResult | null,
  trustLevel: number
): string {
  const rel = profile.reliability;
  
  // Determine information quality based on knowledge base
  let knowledgeLevel = 'average';
  const topicLower = topic.toLowerCase();
  if (topicLower.includes('local') || topicLower.includes('town')) {
    knowledgeLevel = profile.knowledgeBase.localEvents > 70 ? 'expert' : 
                     profile.knowledgeBase.localEvents > 40 ? 'average' : 'poor';
  } else if (topicLower.includes('politic') || topicLower.includes('noble')) {
    knowledgeLevel = profile.knowledgeBase.politicalNews > 70 ? 'expert' : 
                     profile.knowledgeBase.politicalNews > 40 ? 'average' : 'poor';
  } else if (topicLower.includes('crime') || topicLower.includes('thief')) {
    knowledgeLevel = profile.knowledgeBase.underworld > 70 ? 'expert' : 
                     profile.knowledgeBase.underworld > 40 ? 'average' : 'poor';
  }
  
  let context = `
=== INFORMATION RELIABILITY: ${npcName} ===
RELIABILITY PROFILE:
- Honesty: ${rel.honesty}% ${rel.honesty < 50 ? '⚠️ UNRELIABLE' : rel.honesty > 75 ? '✓ Generally honest' : ''}
- Knowledge: ${rel.knowledge}%
- Memory accuracy: ${rel.memory}%
- Gossip tendency: ${rel.gossipTendency}%
- Active biases: ${rel.bias.length > 0 ? rel.bias.join(', ') : 'None obvious'}

KNOWLEDGE OF TOPIC: ${knowledgeLevel}
${knowledgeLevel === 'poor' ? '⚠️ NPC may give inaccurate information due to ignorance (not lying)' : ''}

MOTIVATIONS TO CONSIDER:
- Will protect: ${profile.motivations.protects.join(', ') || 'Nothing specific'}
- Fears discussing: ${profile.motivations.fears.join(', ') || 'Nothing specific'}
- Loyal to: ${profile.motivations.loyalties.join(', ') || 'No one in particular'}
`;

  if (lieResult?.lies) {
    context += `
[AI INSTRUCTION - HIDDEN FROM PLAYER]
This NPC is ${lieResult.lieType?.toUpperCase() || 'LYING'} because: ${lieResult.reason?.replace(/_/g, ' ')}
- Lie type: ${lieResult.lieType}
- Confidence in lie: ${Math.round(lieResult.confidence)}%
- Detection difficulty: ${lieResult.detectionDifficulty}%

SHOW SUBTLE DECEPTION SIGNS (proportional to detection difficulty):
${lieResult.detectionDifficulty < 40 ? '- Clear signs: nervous gestures, inconsistent story, avoiding eye contact' :
  lieResult.detectionDifficulty < 60 ? '- Moderate signs: brief hesitation, overly specific details, slight evasiveness' :
  lieResult.detectionDifficulty < 80 ? '- Subtle signs: micro-expressions, too-smooth delivery, deflection' :
  '- Nearly undetectable: practiced liar, believe their own lie, no visible tells'}

The player must DISCOVER the truth through investigation, not be told directly.
`;
  } else {
    context += `
${npcName} is being relatively truthful about this topic.
However:
- May still be WRONG (${knowledgeLevel} knowledge level)
- May misremember (${rel.memory}% memory)
- Their biases color interpretation: ${rel.bias.join(', ') || 'none'}
- Confabulation tendency: ${rel.confabulationTendency}% (may fill gaps with invention)

Wrong information should be delivered confidently if they believe it.
`;
  }
  
  return context;
}

export function buildRumorContext(rumors: Rumor[]): string {
  const activeRumors = rumors.filter(r => !r.expired && r.age < 72); // Recent rumors
  
  if (activeRumors.length === 0) return '';
  
  let context = '\n=== ACTIVE RUMORS IN CIRCULATION ===\n';
  context += 'Gossipy NPCs may mention these naturally in conversation:\n\n';
  
  for (const rumor of activeRumors.slice(0, 4)) {
    const accuracy = rumor.truthValue > 80 ? 'MOSTLY TRUE' : 
                     rumor.truthValue > 50 ? 'partially true' : 
                     rumor.truthValue > 20 ? 'mostly false' :
                     'COMPLETELY DISTORTED';
    const freshness = rumor.age < 12 ? 'fresh' : rumor.age < 48 ? 'current' : 'old';
    
    context += `• "${rumor.currentVersion}"
  [${accuracy}] [${freshness}] [retold ${rumor.retellings}x] [${rumor.spread.length} NPCs know]
  
`;
  }
  
  context += `INSTRUCTIONS:
- Only gossip-prone NPCs (high gossipTendency) mention rumors unprompted
- NPCs may share rumors as fact even when distorted
- Multiple NPCs telling the same distorted version makes it seem more true
- Player can verify rumors through investigation
`;
  
  return context;
}

// Export for integration
export { INFORMATION_CONSTANTS };
