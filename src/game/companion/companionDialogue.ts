// ============================================================================
// COMPANION DIALOGUE - All dialogue generation functions
// ============================================================================

import type { 
  CompanionState, 
  PlayerActionType, 
  ConversationTopic,
  SituationType
} from './companionTypes';

import {
  generateTraitBasedApproval,
  generateTraitBasedDisapproval,
  generateTraitBasedNeutral,
  generateHybridTraitDialogue,
} from './personalityDialogue';

// ============================================================================
// BASIC DIALOGUE GENERATION - Now uses trait-based system
// ============================================================================

export function generateApprovalDialogue(companion: CompanionState, action: PlayerActionType): string {
  // Try hybrid trait dialogue first for richer responses
  if (companion.personality.traits.length >= 2 && Math.random() < 0.4) {
    return generateHybridTraitDialogue(companion, action, 'approve');
  }
  
  // Use trait-based approval
  return generateTraitBasedApproval(companion, action);
}

export function generateDisapprovalDialogue(companion: CompanionState, action: PlayerActionType): string {
  // Try hybrid trait dialogue first for richer responses
  if (companion.personality.traits.length >= 2 && Math.random() < 0.4) {
    return generateHybridTraitDialogue(companion, action, 'disapprove');
  }
  
  // Use trait-based disapproval
  return generateTraitBasedDisapproval(companion, action);
}

export function generateNeutralDialogue(companion: CompanionState, action: PlayerActionType): string {
  return generateTraitBasedNeutral(companion, action);
}

export function generateJoinReaction(companion: CompanionState): string {
  if (companion.affinity > 30) {
    return `I'm honored to travel with you. Together, we'll do great things.`;
  } else if (companion.affinity > 0) {
    return `Alright, let's see where this goes. Don't make me regret this.`;
  } else {
    return `I'll come with you, but I'm watching closely. Trust is earned.`;
  }
}

export function generateDismissalReaction(companion: CompanionState, reason: string): string {
  switch (reason) {
    case 'player':
      if (companion.affinity > 50) {
        return `I understand. I'll be here if you need me. *looks sad*`;
      } else if (companion.affinity > 0) {
        return `Fine. I have other things to attend to anyway.`;
      } else {
        return `Good riddance. Maybe you'll think twice about how you treat people.`;
      }
    case 'voluntary':
      return `I can't do this anymore. Our paths must diverge here. Farewell.`;
    case 'hostile':
      return `You've pushed me too far. We are enemies now. Remember that.`;
    default:
      return `...Goodbye.`;
  }
}

export function generateRomanceConfession(companion: CompanionState): string {
  const confessions = [
    `I... I need to tell you something. Being with you has changed me. I think I'm falling for you.`,
    `I've tried to ignore these feelings, but I can't anymore. You mean more to me than just a traveling companion.`,
    `Every time you smile, my heart races. I know this complicates things, but... I love you.`,
    `There's something I've been meaning to say. When I look at you, I see my future. Is that... crazy?`,
    `I don't know how to say this properly. *takes a deep breath* I have feelings for you. Real feelings.`,
  ];
  
  return confessions[Math.floor(Math.random() * confessions.length)];
}

// ============================================================================
// QUIRK DISCOVERY DIALOGUE
// ============================================================================

export function generateQuirkDiscoveryDialogue(companion: CompanionState, quirk: string): string {
  const templates = [
    `*${quirk}* I... don't usually let people see this side of me. But with you, it feels safe.`,
    `You might have noticed... *${quirk}* I know it's strange, but it's part of who I am.`,
    `*${quirk}* ...Sorry. I usually hide this, but I suppose there's no point pretending anymore.`,
    `I've been meaning to tell you... *${quirk}* Not many people know about this.`,
    `*${quirk}* I guess after all we've been through, you deserve to know the real me.`,
    `*seems embarrassed* *${quirk}* I've never shown this to anyone before.`,
    `Between us? *${quirk}* ...Please don't laugh. It means something to me.`,
    `You know what? *${quirk}* There. Now you know one of my secrets.`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

export function generateBondingQuirkRevealDialogue(
  companion: CompanionState, 
  quirk: string, 
  dialogueType: 'vulnerable' | 'grateful' | 'protective' | 'curious'
): string {
  const templates: Record<typeof dialogueType, string[]> = {
    vulnerable: [
      `*${quirk}* ...I've never shown anyone this side of me. But after everything we've been through, it feels right.`,
      `I want to be honest with you. *${quirk}* There. Now you know something real about me.`,
      `Since we're being real with each other... *${quirk}* I don't usually admit that to anyone.`,
    ],
    grateful: [
      `You saved me back there. I think you deserve to know the real me. *${quirk}*`,
      `I owe you my life. The least I can give you is honesty. *${quirk}* ...That's something I usually hide.`,
      `*${quirk}* I guess I trust you enough now to let you see that.`,
    ],
    protective: [
      `I couldn't bear to lose you. Which reminds me... *${quirk}* I've always been like this.`,
      `Keeping you safe matters to me. And since it does... *${quirk}* You should know who I really am.`,
      `*${quirk}* ...If I'm going to protect you, you should know all of me. The strange parts too.`,
    ],
    curious: [
      `I've been wondering about you, and I realized... you barely know me. *${quirk}* There. Something real.`,
      `*${quirk}* ...I figured since I want to know more about you, I should share something too.`,
      `Fair is fair. You've told me things. So... *${quirk}* Now we're even.`,
    ],
  };
  
  const options = templates[dialogueType];
  return options[Math.floor(Math.random() * options.length)];
}

export function generateBondingDialogue(
  companion: CompanionState, 
  dialogueType: 'vulnerable' | 'grateful' | 'protective' | 'curious',
  context?: string
): string {
  const templates: Record<typeof dialogueType, string[]> = {
    vulnerable: [
      `*looks at you thoughtfully* I'm glad you're here. Really.`,
      `...It's been a while since I felt like I could rely on someone.`,
      `*sighs* I don't say this often, but... thank you. For everything.`,
      `Moments like this remind me why I stay.`,
    ],
    grateful: [
      `I won't forget what you did. Not ever.`,
      `*smiles genuinely* You have my gratitude. And my loyalty.`,
      `Thank you. Those words don't feel like enough, but... thank you.`,
      `You could have left me. You didn't. That means something.`,
    ],
    protective: [
      `I'll have your back. No matter what comes.`,
      `*determined expression* If anyone tries to hurt you, they go through me.`,
      `I've decided. Keeping you safe is my priority now.`,
      `*watches over you* Rest easy. I'm here.`,
    ],
    curious: [
      `I've been meaning to ask... who were you before all this?`,
      `*tilts head* There's more to you than meets the eye, isn't there?`,
      `Tell me something. Something real. I want to understand you better.`,
      `What drives you? I've watched you, but I still don't quite get it.`,
    ],
  };
  
  const options = templates[dialogueType];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================================================
// CONFIDING RESPONSE DIALOGUE
// ============================================================================

export function generateResponseToConfiding(
  companion: CompanionState, 
  type: 'honest' | 'emotional' | 'deflect' | 'lie'
): string {
  const responses: Record<typeof type, string[]> = {
    honest: [
      `*nods slowly* Thank you for telling me that. It means a lot that you trust me.`,
      `*listens intently* I appreciate your honesty. I feel like I understand you better now.`,
      `*touched expression* That took courage to share. I won't forget it.`,
      `*smiles warmly* Thank you. For being real with me.`,
    ],
    emotional: [
      `*reaches out gently* I had no idea you carried that with you. I'm here for you.`,
      `*eyes soften* ...Thank you for trusting me with that. It changes how I see you. In a good way.`,
      `*moved silence* I don't know what to say. Except... I'm glad you told me. I'm glad you're here.`,
      `*wipes eye* That's... that's heavy. I'm honored you shared that with me. Truly.`,
    ],
    deflect: [
      `*slight frown* Alright. I understand if you're not ready to talk about it.`,
      `*looks away* I see. Maybe another time, then.`,
      `*nods, slightly disappointed* Fair enough. When you're ready.`,
      `*pauses* ...Okay. The offer stands, if you ever want to talk.`,
    ],
    lie: [
      `*studies your face* ...Right. Sure.`,
      `*tilts head* If you say so. *seems unconvinced*`,
      `*narrows eyes briefly* I'll take your word for it. For now.`,
      `*quiet moment* Hm. Alright then.`,
    ],
  };
  
  const options = responses[type];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================================================
// QUIRK-BASED DIALOGUE
// ============================================================================

const QUIRK_DIALOGUE_TEMPLATES: Record<string, string[]> = {
  'polishes weapon when nervous': [
    `*absently polishes weapon* Something feels off about this place...`,
    `*running cloth over blade edge* Sorry, it helps me think.`,
    `*inspecting weapon for the third time* Old habit. Can't help it.`,
  ],
  'counts coins when idle': [
    `*jingling coins in pouch* Just making sure we're still solvent.`,
    `*stacking coins quietly* Fifty-two... fifty-three... ah, sorry, were you saying something?`,
    `*thumbing through currency* A little inventory never hurt anyone.`,
  ],
  'talks to animals': [
    `*whispering to a nearby bird* Don't mind me, just asking about the local gossip.`,
    `That stray dog says there's trouble ahead. Animals always know.`,
    `*cooing at an insect* Even the smallest creatures have stories to tell.`,
  ],
  'sleeps outside': [
    `I'll take first watch. Besides, I prefer sleeping under the stars anyway.`,
    `*looking at the sky* Nothing like open air. Walls make me feel trapped.`,
    `Don't worry about finding me a bed - I'll be out here where I belong.`,
  ],
  'stares into middle distance': [
    `*gazing at nothing in particular* ...Hmm? Oh, just thinking.`,
    `*distant look in eyes* The patterns of fate are... intricate.`,
    `*lost in thought* ...What? I was contemplating possibilities.`,
  ],
  'mutters incantations': [
    `*whispering arcane words* Just keeping the magic warm.`,
    `*lips moving silently* Old protective ward. Force of habit.`,
    `*mumbling something mystical* ...What? The words must be spoken daily or they lose power.`,
  ],
  'winks too much': [
    `*winks* Trust me on this one.`,
    `*conspiratorial wink* You know what I mean.`,
    `*double wink* I've got a plan. Don't worry about the details.`,
  ],
  'always has an exit planned': [
    `*glancing at doorways* Just noting our options. Never hurts to be prepared.`,
    `If things go south, there's a window on the east wall. Just saying.`,
    `*studying the room layout* Three exits. Two accessible. We're fine.`,
  ],
  'uncomfortable in cities': [
    `*shifting uneasily* Too many people. Too much stone. Can't breathe.`,
    `*flinching at noise* How does anyone live like this?`,
    `Let's finish our business here quickly. Cities aren't good for the soul.`,
  ],
  'never explains fully': [
    `There are... reasons. Best left unsaid.`,
    `You'll understand. Eventually. Or you won't. Either way.`,
    `*cryptic smile* Some knowledge must be earned, not given.`,
  ],
  'always faces the door': [
    `*positioning self by exit* Old training. Never let them surprise you.`,
    `*taking seat facing entrance* Habit. Can't shake it.`,
    `I'll stand here if you don't mind. Better sightlines.`,
  ],
  'never sits with back to entrance': [
    `*moving to different seat* That spot's exposed. This is safer.`,
    `No offense, but I'll take this chair. Call it paranoia.`,
    `*adjusting position* Old soldier's reflex. Saved my life more than once.`,
  ],
};

export function generateQuirkDialogue(companion: CompanionState): string {
  const quirk = companion.personality.quirks[Math.floor(Math.random() * companion.personality.quirks.length)];
  
  // Check if we have specific dialogue for this quirk
  for (const [quirkKey, dialogues] of Object.entries(QUIRK_DIALOGUE_TEMPLATES)) {
    if (quirk.toLowerCase().includes(quirkKey.toLowerCase().split(' ')[0])) {
      return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
  }
  
  // Generic quirk-based dialogue for quirks without specific templates
  const genericQuirkDialogues = [
    `*${quirk}* Sorry, it's just something I do.`,
    `*${quirk}* Don't mind me.`,
    `*${quirk}* Old habit. Can't seem to shake it.`,
    `*${quirk}* It's... a thing. From before.`,
    `*${quirk}* Helps me focus, honestly.`,
  ];
  
  return genericQuirkDialogues[Math.floor(Math.random() * genericQuirkDialogues.length)];
}

// ============================================================================
// AMBIENT COMMENTARY
// ============================================================================

export function generateAmbientComment(companion: CompanionState, situation: string): string {
  // 40% chance to trigger quirk-based dialogue
  if (Math.random() < 0.4 && companion.personality.quirks.length > 0) {
    return generateQuirkDialogue(companion);
  }
  
  // Use personality quirks and catchphrases
  const quirk = companion.personality.quirks[Math.floor(Math.random() * companion.personality.quirks.length)];
  const catchphrase = companion.personality.catchphrases[
    Math.floor(Math.random() * companion.personality.catchphrases.length)
  ];
  
  const comments = [
    `*${quirk}*`,
    catchphrase,
    `This place... it reminds me of something.`,
    `Stay alert. I have a bad feeling.`,
    `*looks around curiously*`,
    `What do you make of all this?`,
  ];
  
  return comments[Math.floor(Math.random() * comments.length)];
}

// ============================================================================
// LOCATION REACTIONS
// ============================================================================

export function generateLocationReaction(companion: CompanionState, location: string): string {
  const locationReactions = [
    `*looks around* ${location}... I've heard stories about this place.`,
    `*inhales deeply* Something about this place feels different.`,
    `*on edge* Stay sharp. Places like this can hide danger.`,
    `*appreciating the view* Not bad. Not bad at all.`,
    `*mutters* I have memories here... or somewhere like it.`,
    `*curious* Have you been here before? There's history in these walls.`,
    `*adjusting gear* Let's see what ${location} has in store for us.`,
  ];
  
  return locationReactions[Math.floor(Math.random() * locationReactions.length)];
}

// ============================================================================
// CURIOSITY DIALOGUE
// ============================================================================

export function generateCuriosityQuestion(
  companion: CompanionState,
  availableQuestions: { question: string; topic: string }[]
): { dialogue: string; topic: ConversationTopic } {
  const questionData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  
  const intros = [
    `*settles in close* I've been wanting to ask you something...`,
    `*looks at you with genuine interest* Can I ask you something personal?`,
    `*quiet moment* I realized I don't know much about you. Not really.`,
    `*thoughtful pause* You know a lot about me now. But I want to know you too.`,
    `*meets your eyes* Tell me something about yourself. The real you.`,
  ];
  
  const intro = intros[Math.floor(Math.random() * intros.length)];
  return { 
    dialogue: `${intro} ${questionData.question}`,
    topic: questionData.topic as ConversationTopic
  };
}

console.log('[CompanionDialogue] Dialogue module loaded');
