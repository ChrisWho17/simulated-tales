/**
 * Character AI Enhancement System
 * 
 * Provides AI-powered features for character creation and development:
 * - Name generation based on genre/origin
 * - Voice/dialogue style preview
 * - Dynamic arc detection during gameplay
 * - Psychological character analysis
 * - Inner monologue generation
 */

import { GameGenre } from '@/types/genreData';
import { Backstory, PersonalityTrait, CharacterFlaw, Origin, Motivation } from './characterDevelopmentSystem';

// =============== NAME GENERATION ===============

export interface NameGenerationRequest {
  genre: GameGenre;
  gender?: string;
  origin?: Origin;
  culturalInfluence?: string;
  nameStyle?: 'classic' | 'exotic' | 'mysterious' | 'humble' | 'noble';
  count?: number;
}

export interface GeneratedName {
  name: string;
  meaning?: string;
  origin?: string;
  suitedFor?: string;
}

// =============== VOICE/DIALOGUE PREVIEW ===============

export interface VoiceStyleRequest {
  characterName: string;
  traits: PersonalityTrait[];
  flaws: CharacterFlaw[];
  origin?: Origin;
  motivation?: Motivation;
  genre: GameGenre;
  emotionalState?: 'calm' | 'stressed' | 'excited' | 'fearful' | 'angry';
}

export interface VoiceStylePreview {
  speakingStyle: string;
  sampleDialogues: string[];
  verbalTics?: string[];
  favoriteExpressions?: string[];
  tonalQualities: string[];
}

// =============== ARC DETECTION ===============

export interface ArcDetectionContext {
  characterName: string;
  backstory?: Backstory;
  traits: PersonalityTrait[];
  flaws: CharacterFlaw[];
  recentEvents: string[];
  currentSituation: string;
  emotionalState?: string;
  relationshipsChanged?: string[];
  majorChoicesMade?: string[];
}

export interface ArcMoment {
  type: 'growth' | 'setback' | 'revelation' | 'turning_point' | 'redemption' | 'corruption';
  title: string;
  description: string;
  significance: 'minor' | 'moderate' | 'major' | 'pivotal';
  suggestedMilestone?: string;
  emotionalImpact: string;
  futureImplications?: string;
}

// =============== CHARACTER ANALYSIS ===============

export interface CharacterAnalysisRequest {
  characterName: string;
  backstory?: Backstory;
  traits: PersonalityTrait[];
  flaws: CharacterFlaw[];
  significantChoices?: string[];
  relationships?: Array<{ name: string; type: string; quality: string }>;
  majorEvents?: string[];
}

export interface CharacterAnalysis {
  personalityProfile: {
    coreIdentity: string;
    primaryMotivators: string[];
    deepFears: string[];
    copingMechanisms: string[];
  };
  psychologicalInsights: {
    attachmentStyle: string;
    conflictApproach: string;
    stressResponse: string;
    moralFramework: string;
  };
  arcPotential: {
    likelyGrowthAreas: string[];
    vulnerabilities: string[];
    potentialArcs: Array<{ name: string; description: string; trigger: string }>;
  };
  narrativeHooks: string[];
}

// =============== INNER MONOLOGUE ===============

export interface InnerMonologueRequest {
  characterName: string;
  traits: PersonalityTrait[];
  flaws: CharacterFlaw[];
  backstory?: Backstory;
  currentSituation: string;
  emotionalState: string;
  recentEvent?: string;
  internalConflict?: string;
}

export interface InnerMonologue {
  thought: string;
  subtext?: string;
  relatedTrait?: string;
  relatedFlaw?: string;
  emotionalTone: string;
}

// =============== PROMPT BUILDERS ===============

export function buildNameGenerationPrompt(request: NameGenerationRequest): string {
  const count = request.count || 5;
  const genderText = request.gender ? ` for a ${request.gender} character` : '';
  const originText = request.origin ? ` from ${request.origin.name} background` : '';
  const styleText = request.nameStyle ? ` with a ${request.nameStyle} feel` : '';
  const cultureText = request.culturalInfluence ? ` influenced by ${request.culturalInfluence} culture` : '';

  return `Generate ${count} unique character names${genderText}${originText}${styleText}${cultureText} for a ${request.genre} setting.

For each name, provide:
1. The name itself
2. A brief meaning or etymology (1 sentence)
3. What type of character this name suits

Return as JSON array with objects containing: name, meaning, suitedFor`;
}

export function buildVoiceStylePrompt(request: VoiceStyleRequest): string {
  const traitsText = request.traits.map(t => t.name).join(', ') || 'none specified';
  const flawsText = request.flaws.map(f => f.name).join(', ') || 'none specified';
  const emotionText = request.emotionalState || 'neutral';

  return `Analyze how ${request.characterName} would speak based on their personality.

CHARACTER PROFILE:
- Genre: ${request.genre}
- Personality Traits: ${traitsText}
- Character Flaws: ${flawsText}
${request.origin ? `- Background: ${request.origin.name} - ${request.origin.description}` : ''}
${request.motivation ? `- Core Motivation: ${request.motivation.name} - "${request.motivation.drivingQuestion}"` : ''}
- Current Emotional State: ${emotionText}

Generate:
1. A brief description of their speaking style (2-3 sentences)
2. 3 sample dialogue lines showing how they'd speak in different situations
3. 2-3 verbal tics or speech patterns they might use
4. 2-3 expressions or phrases they'd favor
5. Key tonal qualities of their voice

Return as JSON with: speakingStyle, sampleDialogues[], verbalTics[], favoriteExpressions[], tonalQualities[]`;
}

export function buildArcDetectionPrompt(context: ArcDetectionContext): string {
  const traitsText = context.traits.map(t => t.name).join(', ') || 'none';
  const flawsText = context.flaws.map(f => f.name).join(', ') || 'none';
  const eventsText = context.recentEvents.join('\n- ') || 'none';

  return `Analyze if ${context.characterName} is experiencing a significant character development moment.

CHARACTER BASELINE:
- Traits: ${traitsText}
- Flaws: ${flawsText}
${context.backstory?.origin ? `- Origin: ${context.backstory.origin.name}` : ''}
${context.backstory?.motivation ? `- Core Drive: ${context.backstory.motivation.name}` : ''}

RECENT EVENTS:
- ${eventsText}

CURRENT SITUATION:
${context.currentSituation}

${context.emotionalState ? `EMOTIONAL STATE: ${context.emotionalState}` : ''}
${context.relationshipsChanged?.length ? `RELATIONSHIP CHANGES: ${context.relationshipsChanged.join(', ')}` : ''}
${context.majorChoicesMade?.length ? `MAJOR CHOICES: ${context.majorChoicesMade.join(', ')}` : ''}

Determine if this represents a CHARACTER ARC MOMENT. If yes, identify:
1. Type (growth, setback, revelation, turning_point, redemption, corruption)
2. A short title for this moment
3. What makes this significant
4. The emotional impact on the character
5. How this might affect their future

Return JSON: { isArcMoment: boolean, moment?: { type, title, description, significance, emotionalImpact, futureImplications } }`;
}

export function buildCharacterAnalysisPrompt(request: CharacterAnalysisRequest): string {
  const traitsText = request.traits.map(t => `${t.name}: ${t.description}`).join('\n');
  const flawsText = request.flaws.map(f => `${f.name}: ${f.description}`).join('\n');

  return `Provide a deep psychological analysis of ${request.characterName}.

CHARACTER DATA:
${request.backstory?.origin ? `ORIGIN: ${request.backstory.origin.name} - ${request.backstory.origin.description}` : ''}
${request.backstory?.motivation ? `CORE MOTIVATION: ${request.backstory.motivation.name} - "${request.backstory.motivation.drivingQuestion}"` : ''}

PERSONALITY TRAITS:
${traitsText || 'Not specified'}

CHARACTER FLAWS:
${flawsText || 'Not specified'}

${request.significantChoices?.length ? `SIGNIFICANT CHOICES MADE:\n- ${request.significantChoices.join('\n- ')}` : ''}
${request.relationships?.length ? `KEY RELATIONSHIPS:\n${request.relationships.map(r => `- ${r.name} (${r.type}): ${r.quality}`).join('\n')}` : ''}
${request.majorEvents?.length ? `MAJOR LIFE EVENTS:\n- ${request.majorEvents.join('\n- ')}` : ''}

Provide a comprehensive psychological profile including:
1. Core identity and what defines them
2. Primary motivators and deep fears
3. Attachment style and conflict approach
4. Moral framework and stress responses
5. Likely growth areas and vulnerabilities
6. Potential character arcs with triggers
7. Narrative hooks for storytelling

Return as detailed JSON matching the CharacterAnalysis structure.`;
}

export function buildInnerMonologuePrompt(request: InnerMonologueRequest): string {
  const traitsText = request.traits.map(t => t.name).join(', ');
  const flawsText = request.flaws.map(f => f.name).join(', ');

  return `Generate an inner monologue for ${request.characterName}.

CHARACTER VOICE:
- Personality: ${traitsText || 'undefined'}
- Flaws: ${flawsText || 'none acknowledged'}
${request.backstory?.origin ? `- Origin: ${request.backstory.origin.name}` : ''}
${request.backstory?.motivation ? `- Driving Question: "${request.backstory.motivation.drivingQuestion}"` : ''}

CURRENT CONTEXT:
- Situation: ${request.currentSituation}
- Emotional State: ${request.emotionalState}
${request.recentEvent ? `- Just Happened: ${request.recentEvent}` : ''}
${request.internalConflict ? `- Internal Conflict: ${request.internalConflict}` : ''}

Write a brief internal thought (1-3 sentences) that:
1. Reflects their personality and flaws
2. Shows their emotional processing
3. Feels authentic to their character voice
4. May hint at their deeper motivations or fears

Return JSON: { thought, subtext?, relatedTrait?, relatedFlaw?, emotionalTone }`;
}

// =============== API CALL HELPERS ===============

export async function callCharacterAI(
  type: 'name' | 'voice' | 'arc' | 'analysis' | 'monologue',
  prompt: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<any> {
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-adventure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      type: `character_${type}`,
      prompt,
      expectJSON: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Character AI request failed: ${response.status}`);
  }

  return response.json();
}

// =============== HIGH-LEVEL API FUNCTIONS ===============

export async function generateCharacterNames(
  request: NameGenerationRequest
): Promise<GeneratedName[]> {
  const prompt = buildNameGenerationPrompt(request);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  try {
    const result = await callCharacterAI('name', prompt, supabaseUrl, supabaseKey);
    return result.names || result || [];
  } catch (error) {
    console.error('Name generation failed:', error);
    // Fallback names
    return [
      { name: 'Morgan', meaning: 'Sea defender', suitedFor: 'Versatile protagonist' },
      { name: 'Ash', meaning: 'From the ash tree', suitedFor: 'Resilient survivor' },
      { name: 'River', meaning: 'Flowing water', suitedFor: 'Adaptable wanderer' },
    ];
  }
}

export async function generateVoicePreview(
  request: VoiceStyleRequest
): Promise<VoiceStylePreview> {
  const prompt = buildVoiceStylePrompt(request);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  try {
    const result = await callCharacterAI('voice', prompt, supabaseUrl, supabaseKey);
    return result;
  } catch (error) {
    console.error('Voice preview failed:', error);
    return {
      speakingStyle: 'Speaks with measured confidence, choosing words carefully.',
      sampleDialogues: [
        '"Let me think about that for a moment."',
        '"I understand your concern, but consider this..."',
        '"We should proceed, but cautiously."',
      ],
      tonalQualities: ['thoughtful', 'deliberate', 'calm'],
    };
  }
}

export async function detectArcMoment(
  context: ArcDetectionContext
): Promise<ArcMoment | null> {
  const prompt = buildArcDetectionPrompt(context);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  try {
    const result = await callCharacterAI('arc', prompt, supabaseUrl, supabaseKey);
    if (result.isArcMoment && result.moment) {
      return result.moment;
    }
    return null;
  } catch (error) {
    console.error('Arc detection failed:', error);
    return null;
  }
}

export async function analyzeCharacter(
  request: CharacterAnalysisRequest
): Promise<CharacterAnalysis | null> {
  const prompt = buildCharacterAnalysisPrompt(request);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  try {
    const result = await callCharacterAI('analysis', prompt, supabaseUrl, supabaseKey);
    return result;
  } catch (error) {
    console.error('Character analysis failed:', error);
    return null;
  }
}

export async function generateInnerMonologue(
  request: InnerMonologueRequest
): Promise<InnerMonologue | null> {
  const prompt = buildInnerMonologuePrompt(request);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  try {
    const result = await callCharacterAI('monologue', prompt, supabaseUrl, supabaseKey);
    return result;
  } catch (error) {
    console.error('Inner monologue failed:', error);
    return null;
  }
}
