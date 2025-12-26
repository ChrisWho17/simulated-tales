// Unreliable Information System - NPCs can lie, be wrong, have biases, or know partial truths
// Based on the Grudges and Memory Overhaul specification

// ============= NPC INFORMATION PROFILE =============

export interface NPCReliabilityProfile {
  honesty: number;          // 0-100, tendency to tell truth
  knowledge: number;        // 0-100, general knowledge level
  memory: number;           // 0-100, accuracy of recall
  bias: string[];           // Biases that affect their perception
  gossipTendency: number;   // 0-100, how likely to spread rumors
}

export interface NPCMotivations {
  protects: string[];       // Things they'll lie to protect (family, guild, etc.)
  fears: string[];          // Topics that make them lie out of fear
  desires: string[];        // Things they want (may lie to get)
  loyalties: string[];      // Groups they're loyal to
}

export interface NPCKnowledgeBase {
  localEvents: number;      // 0-100
  politicalNews: number;    // 0-100
  underworld: number;       // 0-100
  historicalFacts: number;  // 0-100
  tradeCraft: number;       // 0-100
  rumors: number;           // 0-100
  secrets: number;          // 0-100
}

export interface NPCInformationProfile {
  reliability: NPCReliabilityProfile;
  motivations: NPCMotivations;
  knowledgeBase: NPCKnowledgeBase;
}

// ============= WORLD FACTS =============

export type InformationSource = 'direct_knowledge' | 'witnessed' | 'told_by_reliable' | 'rumor' | 'gossip' | 'assumed';

export interface KnownFact {
  factId: string;
  knows: boolean;
  version: string;          // What they believe happened
  confidence: number;       // 0-100
  source: InformationSource;
  bias?: string;            // If biased, what bias affects this
}

export interface WorldFact {
  id: string;
  category: 'event' | 'person' | 'location' | 'secret' | 'history';
  truth: string;            // The actual truth
  knownBy: Record<string, KnownFact>;  // npcId -> what they know
  distortionFactors: {
    timeDecay: number;      // How much it distorts over time
    politicalSensitivity: number;
    socialTaboo: number;
  };
}

// ============= DEFAULT PROFILES BY NPC TYPE =============

export function createDefaultInformationProfile(npcType: string): NPCInformationProfile {
  const profiles: Record<string, NPCInformationProfile> = {
    merchant: {
      reliability: { honesty: 70, knowledge: 60, memory: 70, bias: ['pro_trade'], gossipTendency: 50 },
      motivations: { protects: ['guild', 'profit'], fears: ['thieves'], desires: ['money', 'status'], loyalties: ['merchant_guild'] },
      knowledgeBase: { localEvents: 70, politicalNews: 40, underworld: 20, historicalFacts: 30, tradeCraft: 90, rumors: 60, secrets: 20 },
    },
    guard: {
      reliability: { honesty: 60, knowledge: 50, memory: 75, bias: ['pro_authority'], gossipTendency: 30 },
      motivations: { protects: ['city', 'commanders'], fears: ['criminals', 'corruption_exposure'], desires: ['order', 'promotion'], loyalties: ['city_guard', 'nobility'] },
      knowledgeBase: { localEvents: 80, politicalNews: 50, underworld: 40, historicalFacts: 30, tradeCraft: 20, rumors: 40, secrets: 30 },
    },
    innkeeper: {
      reliability: { honesty: 75, knowledge: 70, memory: 80, bias: [], gossipTendency: 70 },
      motivations: { protects: ['patrons', 'business'], fears: ['authority'], desires: ['business', 'peace'], loyalties: [] },
      knowledgeBase: { localEvents: 90, politicalNews: 50, underworld: 30, historicalFacts: 40, tradeCraft: 60, rumors: 80, secrets: 40 },
    },
    scholar: {
      reliability: { honesty: 85, knowledge: 90, memory: 85, bias: ['pro_logic', 'anti_superstition'], gossipTendency: 20 },
      motivations: { protects: ['knowledge', 'academy'], fears: ['ignorance'], desires: ['knowledge', 'discovery'], loyalties: ['academy'] },
      knowledgeBase: { localEvents: 40, politicalNews: 60, underworld: 10, historicalFacts: 95, tradeCraft: 40, rumors: 20, secrets: 50 },
    },
    criminal: {
      reliability: { honesty: 40, knowledge: 60, memory: 70, bias: ['anti_authority'], gossipTendency: 40 },
      motivations: { protects: ['crew', 'contacts'], fears: ['guards', 'betrayal'], desires: ['money', 'freedom'], loyalties: ['thieves_guild'] },
      knowledgeBase: { localEvents: 70, politicalNews: 30, underworld: 90, historicalFacts: 20, tradeCraft: 50, rumors: 70, secrets: 60 },
    },
    noble: {
      reliability: { honesty: 50, knowledge: 75, memory: 80, bias: ['pro_nobility', 'anti_commoner'], gossipTendency: 60 },
      motivations: { protects: ['family', 'reputation'], fears: ['scandal', 'poverty'], desires: ['power', 'status'], loyalties: ['nobility', 'family'] },
      knowledgeBase: { localEvents: 60, politicalNews: 90, underworld: 20, historicalFacts: 70, tradeCraft: 30, rumors: 70, secrets: 50 },
    },
    commoner: {
      reliability: { honesty: 70, knowledge: 40, memory: 60, bias: [], gossipTendency: 60 },
      motivations: { protects: ['family'], fears: ['authority', 'nobles'], desires: ['safety', 'prosperity'], loyalties: [] },
      knowledgeBase: { localEvents: 60, politicalNews: 20, underworld: 20, historicalFacts: 20, tradeCraft: 50, rumors: 70, secrets: 10 },
    },
  };
  
  return profiles[npcType] || profiles.commoner;
}

// ============= LYING LOGIC =============

export interface LieResult {
  lies: boolean;
  reason: string | null;
  truthVersion: string | null;
}

export function determineIfNPCLies(
  profile: NPCInformationProfile,
  topic: string,
  question: string | null,
  trustLevel: number // -100 to 100
): LieResult {
  const lowerTopic = topic.toLowerCase();
  const lowerQuestion = question?.toLowerCase() || '';
  
  // Check protected topics
  for (const protected_ of profile.motivations.protects) {
    if (lowerTopic.includes(protected_) || lowerQuestion.includes(protected_)) {
      if (Math.random() * 100 > profile.reliability.honesty - 20) {
        return { lies: true, reason: `protecting_${protected_}`, truthVersion: null };
      }
    }
  }
  
  // Low trust = more likely to lie
  if (trustLevel < -30) {
    if (Math.random() * 100 > profile.reliability.honesty) {
      return { lies: true, reason: 'distrust_player', truthVersion: null };
    }
  }
  
  // Check fears
  for (const fear of profile.motivations.fears) {
    if (lowerTopic.includes(fear) || lowerQuestion.includes(fear)) {
      if (Math.random() < 0.3) {
        return { lies: true, reason: `fear_of_${fear}`, truthVersion: null };
      }
    }
  }
  
  // Check loyalties
  for (const loyalty of profile.motivations.loyalties) {
    if (lowerTopic.includes(loyalty) || lowerQuestion.includes(loyalty)) {
      if (Math.random() < 0.5) {
        return { lies: true, reason: `loyal_to_${loyalty}`, truthVersion: null };
      }
    }
  }
  
  return { lies: false, reason: null, truthVersion: null };
}

// ============= TRUTH VALUE CALCULATION =============

const SOURCE_RELIABILITY: Record<InformationSource, number> = {
  direct_knowledge: 1.0,
  witnessed: 0.9,
  told_by_reliable: 0.7,
  rumor: 0.4,
  gossip: 0.2,
  assumed: 0.3,
};

export function calculateTruthValue(knowledge: KnownFact): number {
  let truth = 100;
  
  // Reduce for confidence
  truth *= (knowledge.confidence / 100);
  
  // Reduce for indirect sources
  truth *= (SOURCE_RELIABILITY[knowledge.source] || 0.5);
  
  // Apply bias distortion
  if (knowledge.bias) {
    truth *= 0.7;
  }
  
  return Math.round(truth);
}

// ============= RUMOR SYSTEM =============

export interface Rumor {
  id: string;
  content: string;
  origin: string;           // NPC who started it
  truthValue: number;       // 0-100
  currentVersion: string;   // May have changed from original
  spread: string[];         // NPCs who know it
  distortions: number;      // Times it's been changed
  age: number;              // Ticks since created
  expired: boolean;
}

export function createRumor(content: string, origin: string, truthValue: number): Rumor {
  return {
    id: `rumor_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    content,
    origin,
    truthValue,
    currentVersion: content,
    spread: [origin],
    distortions: 0,
    age: 0,
    expired: false,
  };
}

const DISTORTION_TRANSFORMS = [
  (s: string) => s.replace(/someone/gi, 'a stranger'),
  (s: string) => s.replace(/might have/gi, 'definitely'),
  (s: string) => s.replace(/was seen/gi, 'was caught'),
  (s: string) => s.replace(/possibly/gi, 'certainly'),
  (s: string) => s.replace(/few/gi, 'many'),
  (s: string) => s + ' Or so I heard.',
  (s: string) => s + ' Everyone knows it.',
  (s: string) => s.replace(/small/gi, 'large'),
];

export function distortRumor(content: string, npcBiases: string[]): string {
  const distortion = DISTORTION_TRANSFORMS[Math.floor(Math.random() * DISTORTION_TRANSFORMS.length)];
  return distortion(content);
}

export function processRumorSpread(
  rumors: Rumor[],
  npcProfiles: Record<string, NPCInformationProfile>
): Rumor[] {
  return rumors.map(rumor => {
    if (rumor.expired) return rumor;
    
    const updated = { ...rumor, age: rumor.age + 1 };
    
    // Rumors die over time or randomly
    if (updated.age > 50 || Math.random() < 0.05) {
      return { ...updated, expired: true };
    }
    
    // Spread to gossipy NPCs
    for (const [npcId, profile] of Object.entries(npcProfiles)) {
      if (updated.spread.includes(npcId)) continue;
      
      if (Math.random() < profile.reliability.gossipTendency / 200) {
        updated.spread.push(npcId);
        
        // Maybe distort it
        if (Math.random() < 0.3) {
          updated.distortions++;
          updated.currentVersion = distortRumor(updated.currentVersion, profile.reliability.bias);
        }
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
  actualTruth?: string;
  wasAccurate?: boolean;
}

export function recordPlayerKnowledge(
  existing: PlayerKnowledge[],
  topic: string,
  info: string,
  source: string,
  truthValue: number,
  currentTurn: number
): PlayerKnowledge[] {
  return [
    ...existing,
    {
      topic,
      info,
      source,
      truthValue,
      turnLearned: currentTurn,
      verified: false,
    },
  ];
}

// ============= AI PROMPT CONTEXT =============

export function buildInformationContext(
  npcName: string,
  profile: NPCInformationProfile,
  topic: string,
  lieResult: LieResult | null
): string {
  return `
=== INFORMATION RELIABILITY: ${npcName} ===
RELIABILITY PROFILE:
- Honesty: ${profile.reliability.honesty}%
- Knowledge level: ${profile.reliability.knowledge}%
- Memory accuracy: ${profile.reliability.memory}%
- Known biases: ${profile.reliability.bias.join(', ') || 'None obvious'}

MOTIVATIONS:
- Protects: ${profile.motivations.protects.join(', ') || 'Nothing specific'}
- Fears discussing: ${profile.motivations.fears.join(', ') || 'Nothing specific'}
- Loyal to: ${profile.motivations.loyalties.join(', ') || 'No one in particular'}

${lieResult?.lies ? `
SECRET (HIDDEN FROM PLAYER):
This NPC is LYING because they are ${lieResult.reason?.replace(/_/g, ' ')}.
- Show subtle signs of deception (nervous gestures, inconsistencies, avoiding eye contact)
- The lie should be believable but not perfect
` : `
This NPC is being relatively truthful about this topic.
- They may still be wrong (low knowledge) or misremember (low memory)
- Their biases may color their interpretation
`}

INSTRUCTIONS:
- NPCs don't always tell the truth
- Wrong information should be delivered confidently if they believe it
- Let player figure out who to trust through observation and verification
- Show personality through how they share (or withhold) information
`;
}

export function buildRumorContext(rumors: Rumor[]): string {
  const recentRumors = rumors
    .filter(r => !r.expired && r.age < 20)
    .slice(0, 4);
  
  if (recentRumors.length === 0) return '';
  
  let context = '\n=== ACTIVE RUMORS NPCs MIGHT MENTION ===\n';
  
  for (const rumor of recentRumors) {
    const accuracy = rumor.truthValue > 70 ? 'mostly true' : 
                     rumor.truthValue > 40 ? 'partially true' : 
                     'mostly false';
    context += `- "${rumor.currentVersion}" (${accuracy}, distorted ${rumor.distortions} times)\n`;
  }
  
  context += '\nGossipy NPCs might mention these rumors naturally in conversation.\n';
  
  return context;
}
