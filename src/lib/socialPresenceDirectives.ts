/**
 * Director + game settings → how NPCs and companions behave around the player.
 * Realistic people: agendas, emotion, boundaries — not cardboard mirrors.
 */

import type { DirectorSettings } from '@/game/directorModeSystem';
import type { NarrativeInDepthSettings, NarrativeRequestSettings } from '@/lib/buildNarrativeRequestBody';

export interface SocialPresenceDirectives {
  /** Short block for the adventure system prompt */
  npcCompanionGuidance: string;
  /** Bullet directives for quality / gameplay merge */
  directives: string[];
  emotionalRange: string;
  speechRegister: string;
  agencyLevel: string;
}

function directorPersonaLine(d: DirectorSettings | null | undefined): string {
  if (!d?.enabled) {
    return 'Narrator is balanced; NPCs keep ordinary human stakes and manners.';
  }
  const type = d.directorType || 'cinematic';
  const map: Record<string, string> = {
    cinematic: 'Cinematic director: NPCs speak with literary clarity; companions react with measured loyalty.',
    tight_editor: 'Tight editor: NPCs waste no words; companions cut to the bone.',
    slow_burn: 'Slow burn: NPCs reveal themselves gradually; companions simmer rather than explode.',
    sandbox: 'Sandbox director: NPCs keep their own errands; companions escalate only when bonds demand it.',
    yes_and: 'Yes-and director: NPCs play along then twist; companions riff with the player.',
    old_school: 'Old-school: NPCs are dangerous and fair; companions expect competence.',
    survival_warden: 'Survival warden: NPCs hoard and bargain; companions watch supplies and wounds.',
    mystery_keeper: 'Mystery keeper: NPCs speak in half-truths; companions notice clues the player misses.',
    romance_writer: 'Romance writer: NPCs carry charged subtext; companions feel jealousy, longing, loyalty.',
    drama_producer: 'Drama producer: NPCs escalate conflict; companions take sides.',
    horror_curator: 'Horror curator: NPCs fracture under dread; companions cling or break.',
    comedic_goblin: 'Comedic goblin: NPCs needle and undercut; companions roast with affection.',
    poet_narrator: 'Poet narrator: NPCs speak in image and metaphor; companions answer in kind.',
    noir_narrator: 'Noir director: NPCs speak sideways; companions withhold, test trust, notice tells.',
  };
  return map[type] || `Director "${type}": NPCs and companions must match this voice in speech and agency.`;
}

export function buildSocialPresenceDirectives(
  settings: NarrativeRequestSettings,
  directorSettings?: DirectorSettings | null
): SocialPresenceDirectives {
  const d = settings.directorSettings || directorSettings || null;
  const depth: NarrativeInDepthSettings = settings.inDepthSettings || {};
  const directives: string[] = [];

  const persona = directorPersonaLine(d);
  directives.push(persona);

  // Emotional range from director knobs (enum levels)
  let emotionalRange = 'human-scale: irritation, warmth, fear, pride, fatigue';
  if (d?.enabled) {
    if (d.cruelty === 'brutal') {
      emotionalRange = 'harsh: contempt, panic, cold calculation; kindness is rare and costly';
      directives.push('NPCs and companions rarely soothe; mercy must be earned.');
    } else if (d.cruelty === 'soft') {
      emotionalRange = 'gentler: worry, hope, affection surface more easily';
    }
    if (d.weirdness === 'spicy' || d.weirdness === 'unhinged') {
      directives.push('NPCs may hold uncanny beliefs; companions notice the strange before the player does.');
    }
    if (d.rawGame) {
      directives.push('Raw mode: companions and NPCs use blunt speech; they do not sanitize their feelings.');
    }
  }

  let speechRegister = 'natural dialogue with subtext';
  if (depth.worldTone === 'brutal') {
    speechRegister = 'clipped, wary dialogue; people protect themselves';
    directives.push('Social scenes carry threat under politeness.');
  } else if (depth.worldTone === 'cozy') {
    speechRegister = 'open, earnest dialogue; people risk sincerity';
  }

  let agencyLevel = 'NPCs pursue their own errands; companions may disagree aloud';
  if ((depth.socialWeight || 'balanced') === 'heavy') {
    agencyLevel = 'Social pressure is high: NPCs remember slights; companions confront avoidant players';
    directives.push('Relationships change visibly after hard choices.');
  }
  if ((depth.consequenceIntensity || 'balanced') === 'harsh') {
    directives.push('Companion and NPC reactions to failure are lasting, not cosmetic.');
  }

  if (settings.adultContent) {
    directives.push(
      'Adult content allowed: intimacy and desire may appear for NPCs/companions with consenting tone; never graphic without player lead.'
    );
  } else {
    directives.push('Keep NPC/companion intimacy fade-to-black or emotional only; no explicit sexual content.');
  }

  if (settings.enableWoundSystem || depth.enableInjuryDetail) {
    directives.push('If the player is wounded, companions react with fear, triage instinct, or grim humor — not indifference.');
  }
  if (depth.enableHunger || depth.enableFatigue) {
    directives.push('Hunger and fatigue fray tempers: NPCs get shorter; companions complain or caretake based on affinity.');
  }
  if (settings.enableLanguageBarrier) {
    directives.push(
      'Language barrier ON: some NPCs speak partial tongues, gesture, or mistranslate; companions may translate imperfectly.'
    );
  }
  if (settings.enableAdrenalineSystem) {
    directives.push('Under adrenaline, companions bark clipped commands; NPC bystanders panic or freeze realistically.');
  }
  if (depth.gunNutDepth === 'gunnut' || depth.gunNutDepth === 'gunnut_plus') {
    directives.push('Armed NPCs and companions speak about gear with practical specificity when relevant.');
  }

  directives.push(
    'People are not mirrors of the player mood. They have agendas, secrets, and bad days. Companions may refuse or hesitate.'
  );

  const npcCompanionGuidance = [
    '=== SOCIAL PRESENCE (NPCs & COMPANIONS) ===',
    persona,
    `Emotional range: ${emotionalRange}`,
    `Speech: ${speechRegister}`,
    `Agency: ${agencyLevel}`,
    ...directives.slice(1, 8).map(d => `- ${d}`),
  ].join('\n');

  return {
    npcCompanionGuidance,
    directives,
    emotionalRange,
    speechRegister,
    agencyLevel,
  };
}
