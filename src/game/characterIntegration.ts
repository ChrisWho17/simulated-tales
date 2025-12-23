import { CharacterData, BACKGROUND_EFFECTS, SPAWN_POINTS, SpawnPointType } from '@/types/characterCreation';
import { LifeSimPlayerState, BodyType, HairLength, HousingType } from '@/types/lifeSim';
import { initializeLifeSimState } from './lifeSimIntegration';

// Map spawn point to starting location ID
export function getSpawnLocationId(spawnPoint: SpawnPointType): string {
  switch (spawnPoint) {
    case 'college':
      return 'university_district';
    case 'home':
      return 'family_home';
    case 'homeless':
      return 'underbridge';
    default:
      return 'town_square';
  }
}

// Map character creation values to life sim values
function mapHeight(height: string): number {
  switch (height) {
    case 'short': return 155 + Math.random() * 10;
    case 'average': return 165 + Math.random() * 15;
    case 'tall': return 180 + Math.random() * 15;
    default: return 170;
  }
}

function mapHairLength(length: string): HairLength {
  switch (length) {
    case 'short': return 'short';
    case 'medium': return 'medium';
    case 'long': return 'long';
    default: return 'medium';
  }
}

function mapBodyType(type: string): BodyType {
  const validTypes: BodyType[] = ['slim', 'average', 'athletic', 'curvy', 'heavy'];
  return validTypes.includes(type as BodyType) ? type as BodyType : 'average';
}

// Calculate starting skill bonuses based on background
function calculateSkillBonuses(skills: string[]): Record<string, number> {
  const bonuses: Record<string, number> = {};
  
  for (const skill of skills) {
    switch (skill.toLowerCase()) {
      case 'basic education':
        bonuses['practical.domestic'] = 10;
        bonuses['social.charm'] = 5;
        break;
      case 'social etiquette':
        bonuses['social.charm'] = 15;
        bonuses['social.persuasion'] = 10;
        break;
      case 'street smarts':
        bonuses['social.deception'] = 15;
        bonuses['practical.survival'] = 10;
        break;
      case 'resilience':
        bonuses['physical.fitness'] = 10;
        bonuses['intimate.stamina'] = 10;
        break;
      case 'academic knowledge':
        bonuses['practical.medicine'] = 10;
        bonuses['practical.crafting'] = 10;
        break;
      case 'creativity':
        bonuses['social.charm'] = 10;
        bonuses['physical.dance'] = 15;
        break;
      case 'scavenging':
        bonuses['practical.survival'] = 20;
        break;
      case 'negotiation':
        bonuses['social.persuasion'] = 15;
        bonuses['social.deception'] = 10;
        break;
      case 'stealth':
        bonuses['physical.athletics'] = 15;
        break;
    }
  }
  
  return bonuses;
}

// Apply skill bonuses to the life sim state
function applySkillBonuses(state: LifeSimPlayerState, bonuses: Record<string, number>): LifeSimPlayerState {
  const newState = { ...state };
  newState.skills = {
    physical: { ...state.skills.physical },
    social: { ...state.skills.social },
    practical: { ...state.skills.practical },
    intimate: { ...state.skills.intimate },
  };
  
  for (const [path, bonus] of Object.entries(bonuses)) {
    const [category, skill] = path.split('.');
    if (category === 'physical' && skill in newState.skills.physical) {
      (newState.skills.physical as any)[skill] = Math.min(100, (newState.skills.physical as any)[skill] + bonus);
    } else if (category === 'social' && skill in newState.skills.social) {
      (newState.skills.social as any)[skill] = Math.min(100, (newState.skills.social as any)[skill] + bonus);
    } else if (category === 'practical' && skill in newState.skills.practical) {
      (newState.skills.practical as any)[skill] = Math.min(100, (newState.skills.practical as any)[skill] + bonus);
    } else if (category === 'intimate' && skill in newState.skills.intimate) {
      (newState.skills.intimate as any)[skill] = Math.min(100, (newState.skills.intimate as any)[skill] + bonus);
    }
  }
  
  return newState;
}

// Calculate attractiveness modifiers based on personality
function calculateAttractivenessModifier(personality: CharacterData['personality']): number {
  let modifier = 0;
  
  if (personality.socialStyle === 'Charming') modifier += 10;
  if (personality.socialStyle === 'Reserved') modifier -= 5;
  if (personality.disposition === 'Bold') modifier += 5;
  
  return modifier;
}

// Create initial life sim state from character data
export function createLifeSimFromCharacter(character: CharacterData): LifeSimPlayerState {
  const baseState = initializeLifeSimState();
  const backgroundEffect = BACKGROUND_EFFECTS[character.background.origin];
  const spawnPoint = SPAWN_POINTS[character.background.spawnPoint];
  
  // Apply character appearance to body
  baseState.body = {
    ...baseState.body,
    height: mapHeight(character.appearance.height),
    bodyType: mapBodyType(character.appearance.bodyType),
    hairColor: character.appearance.hairColor,
    hairLength: mapHairLength(character.appearance.hairLength),
    eyeColor: character.appearance.eyeColor,
    skinTone: character.appearance.skinTone,
    attractiveness: 50 + calculateAttractivenessModifier(character.personality),
  };
  
  // Apply spawn point effects first (base values)
  if (spawnPoint) {
    baseState.economy.money = spawnPoint.money;
    baseState.needs.psychological.stress = spawnPoint.stress;
    
    // Set housing based on spawn point
    if (spawnPoint.id === 'homeless') {
      baseState.economy.housing = 'homeless' as HousingType;
      baseState.home = null;
    } else if (spawnPoint.id === 'college') {
      baseState.economy.housing = 'renting_room' as HousingType;
    } else {
      baseState.economy.housing = 'renting_apartment' as HousingType;
    }
  }
  
  // Apply background effects on top (additive bonuses)
  if (backgroundEffect) {
    // Add stress from background
    baseState.needs.psychological.stress += backgroundEffect.startingStress;
    
    // Add money from background
    baseState.economy.money += backgroundEffect.startingMoney;
    
    // Apply skill bonuses
    const skillBonuses = calculateSkillBonuses(backgroundEffect.skills);
    Object.assign(baseState, applySkillBonuses(baseState, skillBonuses));
  }
  
  // Personality affects social skills
  if (character.personality.socialStyle === 'Charming') {
    baseState.skills.social.charm = Math.min(100, baseState.skills.social.charm + 20);
    baseState.skills.social.seduction = Math.min(100, baseState.skills.social.seduction + 10);
  } else if (character.personality.socialStyle === 'Reserved') {
    baseState.skills.social.charm = Math.max(0, baseState.skills.social.charm - 10);
    baseState.skills.intimate.attentiveness = Math.min(100, baseState.skills.intimate.attentiveness + 15);
  } else if (character.personality.socialStyle === 'Blunt') {
    baseState.skills.social.intimidation = Math.min(100, baseState.skills.social.intimidation + 20);
    baseState.skills.social.deception = Math.max(0, baseState.skills.social.deception - 10);
  }
  
  // Disposition affects other skills
  if (character.personality.disposition === 'Bold') {
    baseState.skills.physical.combat = Math.min(100, baseState.skills.physical.combat + 10);
    baseState.skills.social.intimidation = Math.min(100, baseState.skills.social.intimidation + 10);
  } else if (character.personality.disposition === 'Cautious') {
    baseState.skills.practical.survival = Math.min(100, baseState.skills.practical.survival + 15);
    baseState.skills.social.deception = Math.min(100, baseState.skills.social.deception + 10);
  }
  
  return baseState;
}

// Generate initial narrative description
export function generateCharacterIntroNarrative(character: CharacterData): string {
  const { basicInfo, appearance, background, personality } = character;
  const backgroundEffect = BACKGROUND_EFFECTS[background.origin];
  const spawnPoint = SPAWN_POINTS[background.spawnPoint];
  
  const heightDesc = appearance.height === 'short' ? 'of modest stature' : 
                     appearance.height === 'tall' ? 'tall and striking' : 'of average height';
  
  const buildDesc = appearance.bodyType === 'slim' ? 'lean' :
                    appearance.bodyType === 'athletic' ? 'well-toned' :
                    appearance.bodyType === 'curvy' ? 'shapely' :
                    appearance.bodyType === 'heavy' ? 'sturdy' : 'unremarkable';
  
  const dispositionDesc = personality.disposition === 'Bold' ? 'with a daring gleam in your eyes' :
                          personality.disposition === 'Cautious' ? 'with a watchful awareness' :
                          'with an adaptable demeanor';
  
  let narrative = `You are **${basicInfo.name}**, a ${basicInfo.age}-year-old ${basicInfo.gender || 'soul'} ${heightDesc} with a ${buildDesc} frame. `;
  narrative += `Your ${appearance.hairLength} ${appearance.hairColor} hair frames ${appearance.eyeColor} eyes ${dispositionDesc}.\n\n`;
  
  // Spawn point flavor
  if (spawnPoint) {
    switch (spawnPoint.id) {
      case 'college':
        narrative += `You find yourself in the **${spawnPoint.startingLocation}**, surrounded by the bustle of academic life. `;
        narrative += `Your ${spawnPoint.housing} is cramped but serviceable. ${spawnPoint.narrativeHook}.\n\n`;
        break;
      case 'home':
        narrative += `You're back in the **${spawnPoint.startingLocation}**, the familiar surroundings of home both comforting and constraining. `;
        narrative += `${spawnPoint.narrativeHook}.\n\n`;
        break;
      case 'homeless':
        narrative += `The **${spawnPoint.startingLocation}** stretches before you—a harsh landscape of concrete and survival. `;
        narrative += `Your ${spawnPoint.housing} offers little protection. ${spawnPoint.narrativeHook}.\n\n`;
        break;
    }
  }
  
  // Background flavor
  switch (background.origin) {
    case 'Stable upbringing':
      narrative += `Life has treated you fairly, granting you the basics of education and social grace.`;
      break;
    case 'Turbulent past':
      narrative += `The past clings to you like shadow. Trust comes hard, earned through trials that left you street-smart but wary.`;
      break;
    case 'Sheltered life':
      narrative += `Books and safety were your companions. The world beyond your walls is new and strange, but you possess knowledge others lack.`;
      break;
    case 'Street survivor':
      narrative += `Every meal was earned, every night survived. The streets taught you lessons no academy offers.`;
      break;
  }
  
  if (backgroundEffect?.traumaSeeds.length > 0) {
    narrative += `\n\n*Something whispers at the edges of your mind... old wounds that never fully healed.*`;
  }
  
  return narrative;
}
