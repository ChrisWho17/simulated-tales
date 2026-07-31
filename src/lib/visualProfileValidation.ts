// ============================================================================
// VISUAL PROFILE VALIDATION
// ----------------------------------------------------------------------------
// Runs before a generated illustration is accepted. Its job is to catch
// identity drift (wrong cast, wrong body, stale profile version) and to make
// sure an approved canonical reference is never replaced by a worse image.
// ============================================================================

import type { VisualProfileV2 } from '@/types/visualProfile';
import { chestLabel } from '@/lib/chestScale';

export interface IllustrationCandidate {
  imageUrl: string;
  /** Profile version the job was built from. */
  profileVersion: number;
  /** Campaign/scene/turn the job was started for. */
  campaignId: string;
  sceneId: string;
  turnId: string;
  /** Cast the prompt asked for. */
  castIds: string[];
  /** Attempt index (0 = first try). */
  attempt: number;
}

export interface ValidationTarget {
  campaignId: string;
  sceneId: string;
  turnId: string;
  profiles: VisualProfileV2[];
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  /** Retry once with stricter identity preservation. */
  shouldRetry: boolean;
  /** Extra prompt text for the retry. */
  strictRetryDirective?: string;
}

export function validateIllustration(
  candidate: IllustrationCandidate,
  target: ValidationTarget
): ValidationResult {
  const issues: string[] = [];

  if (!candidate.imageUrl) issues.push('no image produced');

  if (candidate.campaignId !== target.campaignId) {
    issues.push('image belongs to a different campaign');
  }
  if (candidate.sceneId !== target.sceneId || candidate.turnId !== target.turnId) {
    issues.push('image is stale — a newer turn has started');
  }

  const expectedIds = target.profiles.map(p => p.identity.characterId).sort();
  const gotIds = [...candidate.castIds].sort();
  if (expectedIds.join('|') !== gotIds.join('|')) {
    issues.push(`cast mismatch — expected ${expectedIds.join(', ')} got ${gotIds.join(', ')}`);
  }

  const highestVersion = target.profiles.reduce(
    (max, p) => Math.max(max, p.visualProfileVersion),
    0
  );
  if (candidate.profileVersion < highestVersion) {
    issues.push('appearance changed after this job started');
  }

  const valid = issues.length === 0;
  // Only ever one retry, and only when the failure is something a stricter
  // prompt can fix (stale/newer-turn jobs are simply dropped).
  const recoverable = !issues.some(i => i.includes('stale') || i.includes('different campaign'));

  return {
    valid,
    issues,
    shouldRetry: !valid && recoverable && candidate.attempt < 1,
    strictRetryDirective: valid
      ? undefined
      : buildStrictDirective(target.profiles),
  };
}

export function buildStrictDirective(profiles: VisualProfileV2[]): string {
  const lines = profiles.map(p => {
    const bits = [
      `${p.identity.name}: ${p.identity.sex}, ${p.face.eyeColor} eyes, ${p.hair.color} ${p.hair.length} hair, ${p.face.skinTone} skin, ${p.body.build} build, ${p.body.heightBand} height`,
    ];
    if (p.identity.adultOnlyVisualContentEligible) {
      bits.push(`chest ${chestLabel(p.chest.chestSizeValue).toLowerCase()}`);
    }
    if (p.details.bodyScars?.length) bits.push(`scars ${p.details.bodyScars.join('/')}`);
    if (p.details.bodyTattoos?.length) bits.push(`tattoos ${p.details.bodyTattoos.join('/')}`);
    if (p.wardrobe.currentOutfit) bits.push(`wearing ${p.wardrobe.currentOutfit}`);
    return `- ${bits.join('; ')}`;
  });

  return [
    'STRICT IDENTITY PRESERVATION — the previous attempt drifted.',
    'Reproduce these characters exactly, no substitutions, no added or removed people:',
    ...lines,
  ].join('\n');
}

/**
 * Canonical references are only replaced by a validated image. A failed
 * attempt always leaves the existing approved art in place.
 */
export function shouldReplaceCanonical(
  profile: VisualProfileV2,
  result: ValidationResult
): boolean {
  if (!result.valid) return false;
  return !profile.references.canonicalPortraitUrl || profile.references.lastApprovedPortraitId === undefined
    ? true
    : true;
}
