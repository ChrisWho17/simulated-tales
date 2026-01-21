// ============================================================================
// COMPANION MEMORY - Conversation memory and topic reference systems
// ============================================================================

import type { 
  CompanionState, 
  ConversationTopic, 
  SharedTopicMemory,
  SituationType,
  ContextualSupportResult,
  ALL_CONVERSATION_TOPICS
} from './companionTypes';

// ============================================================================
// TOPIC REFERENCE TEMPLATES
// ============================================================================

export const TOPIC_REFERENCE_TEMPLATES: Record<ConversationTopic, {
  sincere: string[];
  suspicious: string[];
  casual: string[];
}> = {
  dreams: {
    sincere: [
      `*thoughtful* You know, I've been thinking about what you said about your dreams...`,
      `Remember when you told me about what you wanted to become? That stuck with me.`,
      `*smiles* You opened up about your dreams once. I haven't forgotten.`,
    ],
    suspicious: [
      `*studies you* You told me about your dreams before. Though... I'm not sure I believe all of it.`,
      `*tilts head* Those dreams you mentioned... were they real? Sometimes I wonder.`,
    ],
    casual: [
      `This reminds me of those dreams you mentioned.`,
      `*glances at you* Chasing dreams, are we?`,
    ],
  },
  relationships: {
    sincere: [
      `You told me about the people in your life. I know that wasn't easy.`,
      `*quietly* I remember what you said about the people who matter to you.`,
      `The way you talked about your loved ones... it told me a lot about who you are.`,
    ],
    suspicious: [
      `*watching* You mentioned people who matter to you. I'm still not sure what's true.`,
      `Those relationships you talked about... I wonder what you left out.`,
    ],
    casual: [
      `Relationships are complicated. You'd know that.`,
      `*knowing look* We've talked about this before.`,
    ],
  },
  memories: {
    sincere: [
      `That memory you shared with me... I think about it sometimes.`,
      `*warmly* You trusted me with a piece of your past. I carry that with me.`,
      `Your happiest memory... it says so much about what you value.`,
    ],
    suspicious: [
      `*skeptical* That memory you told me about... was it the whole truth?`,
      `You shared a memory once. I'm still not sure it happened like you said.`,
    ],
    casual: [
      `We all carry our memories with us.`,
      `*reflective* The past shapes us, doesn't it?`,
    ],
  },
  fears: {
    sincere: [
      `*serious* You trusted me with your fears. That takes strength.`,
      `I know what haunts you. And I won't use it against you.`,
      `What you told me about your fears... I'm here if it ever gets too heavy.`,
    ],
    suspicious: [
      `*searching gaze* You told me what scares you. Or did you?`,
      `Those fears you mentioned... were they real, or a mask for something deeper?`,
    ],
    casual: [
      `We all have things that haunt us.`,
      `*quietly* Fear is a universal language.`,
    ],
  },
  future: {
    sincere: [
      `You told me what you'd do if this was all over. I hope you get that chance.`,
      `*hopeful* That future you imagined... I want to see you reach it.`,
      `Remember what you said about tomorrow? I believed every word.`,
    ],
    suspicious: [
      `*doubtful* The future you painted... I wonder if that's really what you want.`,
      `You talked about tomorrow. But something tells me you weren't being honest.`,
    ],
    casual: [
      `The future is uncertain for all of us.`,
      `*gazes ahead* One day at a time, right?`,
    ],
  },
  loss: {
    sincere: [
      `You shared your losses with me. That weight... I carry some of it now.`,
      `*gently* I know about the ones you've lost. I'm honored you told me.`,
      `Grief never fully goes away. But I'm here to help you bear it.`,
    ],
    suspicious: [
      `You spoke of loss. But did you tell me everything?`,
      `*careful* The grief you showed me... was it all real?`,
    ],
    casual: [
      `We've all lost something.`,
      `*somber* Loss is part of the journey.`,
    ],
  },
  origin: {
    sincere: [
      `Knowing where you came from... it helps me understand who you are.`,
      `*respectful* You trusted me with your origins. That means something.`,
      `Your past shaped you. And I respect the person you've become.`,
    ],
    suspicious: [
      `That origin story... was it the whole truth?`,
      `*doubtful* I've wondered about your past. If what you said was real.`,
    ],
    casual: [
      `We all come from somewhere.`,
      `*musing* Origins matter less than destinations, I think.`,
    ],
  },
  philosophy: {
    sincere: [
      `Your beliefs... they guide you well. I can see that now.`,
      `*thoughtful* What you believe shapes everything. I understand that about you now.`,
      `We talked about fate and choice once. I still think about your answer.`,
    ],
    suspicious: [
      `Those beliefs you shared... do you actually live by them?`,
      `*skeptical* Philosophy is easy to preach. Harder to practice.`,
    ],
    casual: [
      `Everyone has a philosophy. Spoken or not.`,
      `*musing* What we believe shapes what we do.`,
    ],
  },
  secrets: {
    sincere: [
      `Your secret is safe with me. Always.`,
      `*loyal* What you told me in confidence... I carry it carefully.`,
      `Trust is rare. You gave me yours. I won't betray it.`,
    ],
    suspicious: [
      `*wary* You shared a secret. But I suspect there are more.`,
      `Secrets are tricky. I wonder if you told me the biggest one.`,
    ],
    casual: [
      `Everyone has secrets.`,
      `*knowing look* Some things are best kept quiet.`,
    ],
  },
  regrets: {
    sincere: [
      `I know your regrets. They don't make you weak. They make you human.`,
      `*understanding* We all carry regrets. I'm glad you shared yours.`,
      `Your regrets... they taught you things. I can see that.`,
    ],
    suspicious: [
      `Those regrets you mentioned... do you really feel them? Or just say the words?`,
      `*studying you* Regret is easy to claim. Harder to prove.`,
    ],
    casual: [
      `Regret is part of living.`,
      `*sighs* If only we could undo the past.`,
    ],
  },
  motivation: {
    sincere: [
      `I know what drives you now. And I respect it.`,
      `*determined* Your motivation... it inspires me to keep going too.`,
      `Understanding why you fight helps me fight alongside you.`,
    ],
    suspicious: [
      `That motivation you described... is it really what keeps you going?`,
      `*doubt* Sometimes I wonder if you're fighting for what you claimed.`,
    ],
    casual: [
      `We all need a reason to keep moving.`,
      `*nods* Motivation gets us through the hard parts.`,
    ],
  },
  love: {
    sincere: [
      `Knowing about love in your life... it adds depth to who you are.`,
      `*warmly* The love you've known... it shows in how you treat others.`,
      `Love shapes us. Your stories proved that.`,
    ],
    suspicious: [
      `That love you mentioned... was it real? Or a story?`,
      `*watching* I wonder about the love you described. If it was as you said.`,
    ],
    casual: [
      `Love is complicated. We've all learned that.`,
      `*knowing* Love leaves marks. Good and bad.`,
    ],
  },
  courage: {
    sincere: [
      `That story of your courage... I believe it. I see it in you every day.`,
      `*admiring* You told me about your bravest moment. It wasn't surprising.`,
      `Courage like yours isn't common. I'm glad to have witnessed it.`,
    ],
    suspicious: [
      `That brave story you told... did it happen like you said?`,
      `*skeptical* Courage is easy to claim after the fact.`,
    ],
    casual: [
      `We all have moments of courage. And moments without it.`,
      `*reflective* Bravery shows itself in strange ways.`,
    ],
  },
  peace: {
    sincere: [
      `I hope you find that peace you described. You deserve it.`,
      `*gentle* Knowing what brings you serenity... I'll try to give you more of it.`,
      `Peace is precious. I'm glad you know what yours looks like.`,
    ],
    suspicious: [
      `That peace you spoke of... have you ever really felt it?`,
      `*doubtful* True peace seems rare. I wonder if you've known it.`,
    ],
    casual: [
      `Peace is what we fight for, in the end.`,
      `*quiet* We all seek calm in the chaos.`,
    ],
  },
  wanderlust: {
    sincere: [
      `That place you dream of... maybe we'll see it together someday.`,
      `*hopeful* Your wanderlust is contagious. I want to see those places too.`,
      `Dreams of far places keep us moving. I understand that now.`,
    ],
    suspicious: [
      `Those places you want to see... will you ever actually go?`,
      `*skeptical* Wanderlust is easy. Actually leaving is hard.`,
    ],
    casual: [
      `The world is vast. So much to explore.`,
      `*wistful* Somewhere out there, adventure waits.`,
    ],
  },
};

// ============================================================================
// UNKNOWN TOPIC CURIOSITY TEMPLATES
// ============================================================================

export const UNKNOWN_TOPIC_CURIOSITY_TEMPLATES: Record<ConversationTopic, {
  musing: string[];
  direct: string[];
  wistful: string[];
}> = {
  dreams: {
    musing: [
      `*glances at you* I wonder sometimes... what did you want to be when you were young?`,
      `*thoughtful* We've been through so much, but I still don't know what you dreamed of becoming.`,
      `*quietly* Everyone has dreams. I wish I knew yours.`,
    ],
    direct: [
      `You know, you've never told me about your dreams. The real ones.`,
      `*curious* What did you imagine your life would be like?`,
    ],
    wistful: [
      `*gazes into distance* I wonder what you dreamed of, before all this...`,
      `Sometimes I try to picture you as a child, dreaming of the future. But I can't.`,
    ],
  },
  relationships: {
    musing: [
      `*hesitant* Is there... anyone waiting for you somewhere? You never say.`,
      `*wondering* I know so little about the people in your life. Before me, I mean.`,
      `*quietly* Do you have family? Someone special? I've never asked.`,
    ],
    direct: [
      `We've been traveling together, but I don't even know if you have someone back home.`,
      `*carefully* Tell me about your people. If you have any.`,
    ],
    wistful: [
      `*soft sigh* I wish I knew about the people who shaped you.`,
      `Sometimes I feel like I'm traveling with a mystery. Who matters to you?`,
    ],
  },
  memories: {
    musing: [
      `*pensive* What's your happiest memory? I've never thought to ask.`,
      `*watching you* Everyone carries a golden memory. What's yours?`,
      `I wonder what moment you hold onto when things get dark...`,
    ],
    direct: [
      `Tell me something good. Your happiest memory. I want to know.`,
      `*curious* What's the one memory that makes you smile?`,
    ],
    wistful: [
      `*wistful* I'd give a lot to see you truly happy. To know what that looks like for you.`,
      `I imagine you have moments of pure joy in your past. I wish you'd share one.`,
    ],
  },
  fears: {
    musing: [
      `*observing* You're brave. But everyone fears something. I wonder what haunts you.`,
      `*quiet* What keeps you up at night? You've never told me.`,
      `We all have shadows. I wish I knew yours.`,
    ],
    direct: [
      `What are you afraid of? Really afraid of?`,
      `*serious* I should know what scares you. In case I need to protect you from it.`,
    ],
    wistful: [
      `*concerned* I want to understand your fears. So I can stand with you against them.`,
      `Sometimes I see something in your eyes. Fear, maybe. I wish you'd tell me.`,
    ],
  },
  future: {
    musing: [
      `*curious* If this was all over tomorrow... what would you do?`,
      `*wondering* I don't know what you want from life. After all this ends.`,
      `Where do you see yourself when the dust settles?`,
    ],
    direct: [
      `What's the plan? After we're done here. You've never said.`,
      `*tilts head* Do you have a future in mind? Or are you just surviving?`,
    ],
    wistful: [
      `*hopeful* I'd like to imagine your future. If you'd let me in on it.`,
      `Sometimes I wonder if there's a place for me in whatever comes next for you.`,
    ],
  },
  loss: {
    musing: [
      `*gentle* Have you lost someone? You carry a weight I don't understand.`,
      `*observing* There's grief in you. I can sense it. But I don't know the shape of it.`,
      `We've never talked about who you've lost. I wonder about that.`,
    ],
    direct: [
      `Who did you lose? I see it in you sometimes.`,
      `*soft* You don't have to tell me. But if you've lost someone... I'm here.`,
    ],
    wistful: [
      `*sad* I wish I knew who you mourn. So I could mourn them too.`,
      `Loss changes people. I want to understand how it changed you.`,
    ],
  },
  origin: {
    musing: [
      `*curious* How did you become... this? I don't know your story.`,
      `*thoughtful* Everyone has an origin. A moment that made them. What was yours?`,
      `I wonder what path led you here, to this moment with me.`,
    ],
    direct: [
      `Where did you come from? Not the place—the person. How did you become you?`,
      `*interested* Tell me about your beginning. I want to understand.`,
    ],
    wistful: [
      `*musing* I wish I could have seen you become who you are.`,
      `Your past is a mystery to me. And I find myself wanting to solve it.`,
    ],
  },
  philosophy: {
    musing: [
      `*philosophical* Do you believe in fate? Or do we carve our own path? You've never said.`,
      `*pondering* I wonder what you believe. About life, about meaning.`,
      `We've never had that conversation. The big one. About what it all means.`,
    ],
    direct: [
      `What do you believe in? Really believe in?`,
      `*curious* Are we in control, or are we just along for the ride? What do you think?`,
    ],
    wistful: [
      `*contemplative* I'd love to know how you see the world. The philosophy of you.`,
      `Sometimes I try to guess your beliefs. But I'd rather you just told me.`,
    ],
  },
  secrets: {
    musing: [
      `*quiet* Everyone has secrets. I wonder what yours are.`,
      `*thoughtful* There's something you're not telling me. I can feel it.`,
      `We're close now. But there are still walls. Things you haven't shared.`,
    ],
    direct: [
      `What haven't you told me? What's the thing you keep locked away?`,
      `*earnest* I've shared my secrets. Don't you have any for me?`,
    ],
    wistful: [
      `*longing* I want to know all of you. Even the parts you hide.`,
      `Trust takes time. I hope someday you'll share your secrets with me.`,
    ],
  },
  regrets: {
    musing: [
      `*reflective* Do you have regrets? Things you'd do differently?`,
      `*wondering* I wonder what choices haunt you. If any do.`,
      `Nobody gets through life without regrets. What are yours?`,
    ],
    direct: [
      `What do you regret? Don't tell me 'nothing.' Everyone regrets something.`,
      `*searching* If you could go back and change one thing... what would it be?`,
    ],
    wistful: [
      `*gentle* I want to know your regrets. So I can help you carry them.`,
      `Regret is heavy. I wish you'd let me help with the weight.`,
    ],
  },
  motivation: {
    musing: [
      `*curious* What keeps you going? I've never quite figured it out.`,
      `*watching* You push forward no matter what. But I don't know why.`,
      `Everyone needs a reason. I wonder what yours is.`,
    ],
    direct: [
      `Why do you fight? What's driving you?`,
      `*earnest* I need to know what motivates you. It matters to me.`,
    ],
    wistful: [
      `*admiring* You have a fire in you. I wish I knew what lit it.`,
      `Understanding your motivation... that would tell me so much about you.`,
    ],
  },
  love: {
    musing: [
      `*hesitant* Have you ever been in love? You never talk about it.`,
      `*wondering* I wonder what your heart has been through.`,
      `Love changes everyone. I wish I knew how it changed you.`,
    ],
    direct: [
      `Have you loved someone? Really loved them?`,
      `*curious* Tell me about love. Your experience of it.`,
    ],
    wistful: [
      `*softly* I want to know your heart. The parts you protect most.`,
      `Love is the deepest part of us. Someday I hope you'll share that with me.`,
    ],
  },
  courage: {
    musing: [
      `*impressed* You're brave. But what's the bravest thing you've ever done?`,
      `*curious* Everyone has a moment of true courage. What was yours?`,
      `I've seen your bravery. But I wonder what tested it most.`,
    ],
    direct: [
      `Tell me about your bravest moment. I want to know.`,
      `*respectful* What's the hardest thing you've ever faced? And how did you face it?`,
    ],
    wistful: [
      `*admiring* I wish I'd seen you at your bravest. Before we met.`,
      `Your courage inspires me. I want to know where it comes from.`,
    ],
  },
  peace: {
    musing: [
      `*soft* What brings you peace? I've never asked.`,
      `*curious* We live in chaos. But everyone needs calm. What's yours?`,
      `I wonder what quiets your mind. What gives you rest.`,
    ],
    direct: [
      `What calms you? Where do you find peace?`,
      `*genuine* Tell me what brings you serenity. I want to help you find more of it.`,
    ],
    wistful: [
      `*gentle* I want to give you peace. But I don't know what that looks like for you.`,
      `Someday, I hope to see you truly at rest. And know what brought you there.`,
    ],
  },
  wanderlust: {
    musing: [
      `*dreamily* If you could go anywhere... where would it be?`,
      `*wondering* Is there a place you dream of? Somewhere you've always wanted to go?`,
      `We travel so much. But I don't know where you'd choose to be.`,
    ],
    direct: [
      `Where's your dream destination? If you could pick anywhere.`,
      `*curious* What place calls to you? I want to know.`,
    ],
    wistful: [
      `*hopeful* Maybe someday we'll go somewhere you've always dreamed of.`,
      `I'd love to see your eyes light up at a place you've always wanted to visit.`,
    ],
  },
};

// ============================================================================
// MEMORY UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a companion should reference a past conversation
 */
export function checkForConversationReference(
  companion: CompanionState
): { shouldReference: boolean; dialogue: string; topic: ConversationTopic } | null {
  if (companion.status !== 'active') return null;
  
  const sharedTopics = companion.conversationMemory.sharedTopics;
  if (sharedTopics.length === 0) return null;
  
  // Probability based on relationship and conversation depth
  let referenceChance = 0.1; // Base 10%
  
  if (companion.affinity >= 40) referenceChance += 0.1;
  if (companion.trust >= 50) referenceChance += 0.1;
  if (companion.conversationMemory.conversationDepth >= 30) referenceChance += 0.1;
  
  // Hostile companions may reference things negatively
  if (companion.affinity < 0) {
    referenceChance += 0.15; // More likely to bring up vulnerabilities
  }
  
  if (Math.random() > referenceChance) return null;
  
  // Pick a topic to reference (prefer less-referenced ones)
  const now = Date.now();
  const eligibleTopics = sharedTopics.filter(t => {
    const timeSinceReference = now - (t.lastReferenced || 0);
    return timeSinceReference > 300000; // At least 5 minutes since last reference
  });
  
  if (eligibleTopics.length === 0) return null;
  
  // Weight towards less-referenced topics
  eligibleTopics.sort((a, b) => a.referencedCount - b.referencedCount);
  const selectedTopic = eligibleTopics[0];
  
  const templates = TOPIC_REFERENCE_TEMPLATES[selectedTopic.topic];
  if (!templates) return null;
  
  let dialoguePool: string[];
  
  if (selectedTopic.responseType === 'lie') {
    dialoguePool = templates.suspicious;
  } else if (selectedTopic.responseType === 'honest' || selectedTopic.responseType === 'emotional') {
    dialoguePool = templates.sincere;
  } else {
    dialoguePool = templates.casual;
  }
  
  const dialogue = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
  
  // Update reference count
  selectedTopic.referencedCount++;
  selectedTopic.lastReferenced = now;
  
  console.log(`[CompanionMemory] ${companion.name} referencing past conversation about: ${selectedTopic.topic}`);
  
  return { shouldReference: true, dialogue, topic: selectedTopic.topic };
}

/**
 * Check if companion should express curiosity about unknown topic
 */
export function checkForUnknownTopicCuriosity(
  companion: CompanionState,
  allTopics: ConversationTopic[]
): { shouldExpress: boolean; dialogue: string; topic: ConversationTopic } | null {
  if (companion.status !== 'active') return null;
  
  // Require healthy relationship for this intimate curiosity
  if (companion.affinity < 20 || companion.trust < 30) return null;
  if (companion.fear > 40) return null; // Afraid companions don't probe
  
  // Filter to topics this companion hasn't asked about or had shared
  const askedTopics = companion.conversationMemory.askedTopics;
  const sharedTopics = companion.conversationMemory.sharedTopics.map(t => t.topic);
  const knownTopics = [...new Set([...askedTopics, ...sharedTopics])];
  
  const unknownTopics = allTopics.filter(t => !knownTopics.includes(t));
  
  if (unknownTopics.length === 0) return null; // They know everything!
  
  // Probability based on relationship depth and how much they already know
  const knowledgeRatio = knownTopics.length / allTopics.length;
  let curiosityChance = 0.08; // Base 8%
  
  // Curiosity peaks at 30-60% knowledge
  if (knowledgeRatio > 0.3 && knowledgeRatio < 0.6) {
    curiosityChance = 0.15; // They know enough to want more
  } else if (knowledgeRatio >= 0.6) {
    curiosityChance = 0.20; // They're close, want to know everything
  }
  
  // Higher trust = more curiosity
  if (companion.trust >= 60) curiosityChance += 0.05;
  
  if (Math.random() > curiosityChance) return null;
  
  // Select a topic to be curious about
  const selectedTopic = unknownTopics[Math.floor(Math.random() * unknownTopics.length)];
  
  // Choose dialogue style based on companion mood and personality
  const templates = UNKNOWN_TOPIC_CURIOSITY_TEMPLATES[selectedTopic];
  let dialoguePool: string[];
  
  // Romantic companions tend to be more wistful
  if (companion.romanticInterest > 40) {
    dialoguePool = templates.wistful;
  } else if (companion.trust >= 60) {
    // High trust = more direct
    dialoguePool = Math.random() < 0.6 ? templates.direct : templates.musing;
  } else {
    // Default to musing (wondering aloud)
    dialoguePool = templates.musing;
  }
  
  const dialogue = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
  
  console.log(`[CompanionMemory] ${companion.name} expressing curiosity about unknown topic: ${selectedTopic}`);
  
  return { shouldExpress: true, dialogue, topic: selectedTopic };
}

/**
 * Get player knowledge percentage for a companion
 */
export function getPlayerKnowledgePercentage(companion: CompanionState): number {
  const allTopics = 15; // Total number of personal topics
  const knownCount = new Set([
    ...companion.conversationMemory.askedTopics,
    ...companion.conversationMemory.sharedTopics.map(t => t.topic)
  ]).size;
  
  return Math.round((knownCount / allTopics) * 100);
}

/**
 * Record a shared topic in companion's memory
 */
export function recordSharedTopic(
  companion: CompanionState,
  topic: ConversationTopic,
  responseType: 'honest' | 'deflect' | 'lie' | 'emotional',
  playerSummary: string | undefined,
  companionReaction: string
): boolean {
  // Check if this topic was already shared with THIS companion
  const existingTopic = companion.conversationMemory.sharedTopics.find(t => t.topic === topic);
  
  if (existingTopic) {
    // Update existing topic memory
    existingTopic.responseType = responseType;
    if (playerSummary) existingTopic.playerSummary = playerSummary;
    existingTopic.companionReaction = companionReaction;
    console.log(`[CompanionMemory] ${companion.name} - Updated shared topic: ${topic}`);
    return false;
  }
  
  // Add new topic memory
  const newTopicMemory: SharedTopicMemory = {
    topic,
    sharedAt: Date.now(),
    responseType,
    playerSummary,
    companionReaction,
    referencedCount: 0,
  };
  
  companion.conversationMemory.sharedTopics.push(newTopicMemory);
  
  console.log(`[CompanionMemory] ${companion.name} - Recorded new shared topic: ${topic}`);
  
  return true;
}

console.log('[CompanionMemory] Memory module loaded');
