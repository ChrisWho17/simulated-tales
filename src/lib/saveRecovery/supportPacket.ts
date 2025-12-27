// ============================================================================
// AI SUPPORT PACKET
// Generate minimal context for AI to propose fixes
// ============================================================================

import {
  SupportPacket,
  SchemaExcerpt,
  FailureSnapshot,
  MigrationReport,
  FixProposal,
  RecoveryOp,
  RecoveryStage,
  ProposalRisk,
} from './types';
import { getAtPath } from './operations';

// ============================================================================
// PACKET GENERATION
// ============================================================================

export function generateSupportPacket(
  snapshot: FailureSnapshot,
  lastMigrationReport: MigrationReport | null,
  includeFullSave = false
): SupportPacket {
  const save = JSON.parse(snapshot.originalSave);
  
  return {
    id: `packet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    
    // Failure context
    failureSignature: snapshot.signature,
    brokenPaths: snapshot.brokenPaths,
    errorCode: snapshot.errorCode,
    errorMessage: snapshot.errorMessage,
    
    // Migration context
    lastMigrationReport,
    saveVersion: snapshot.saveVersion,
    subsystemVersions: snapshot.subsystemVersions,
    
    // Schema excerpt
    schemaExcerpt: generateSchemaExcerpt(save),
    
    // Full save (only if opted in)
    includeFullSave,
    fullSave: includeFullSave ? snapshot.originalSave : undefined,
  };
}

function generateSchemaExcerpt(save: unknown): SchemaExcerpt {
  const gd = (save as Record<string, unknown>).gameData as Record<string, unknown> | undefined;
  
  const narrativeHistory = gd?.narrativeHistory as unknown[] | undefined;
  const eventHistory = gd?.eventHistory as unknown[] | undefined;
  const relationships = gd?.relationships as { edges?: unknown[] } | undefined;
  const inventory = gd?.inventory as unknown[] | undefined;
  
  return {
    hasPlayer: !!gd?.player,
    hasNeeds: !!gd?.needs,
    hasRelationships: !!gd?.relationships,
    hasKnowledge: !!gd?.knowledge || !!gd?.knowledgeTuples,
    hasInventory: !!gd?.inventory,
    hasNarrativeHistory: Array.isArray(narrativeHistory),
    hasEventHistory: Array.isArray(eventHistory),
    hasCheckpoints: Array.isArray(gd?.checkpoints),
    
    narrativeHistoryLength: narrativeHistory?.length ?? 0,
    eventHistoryLength: eventHistory?.length ?? 0,
    relationshipEdgesCount: relationships?.edges?.length ?? 0,
    inventoryCount: inventory?.length ?? 0,
  };
}

// ============================================================================
// PACKET SERIALIZATION (for sending to AI)
// ============================================================================

export function serializeSupportPacket(packet: SupportPacket): string {
  const sanitized = {
    ...packet,
    // Don't include full save in serialization unless explicitly requested
    fullSave: packet.includeFullSave ? '[FULL_SAVE_INCLUDED]' : undefined,
  };
  
  return JSON.stringify(sanitized, null, 2);
}

export function generatePromptContext(packet: SupportPacket): string {
  const lines: string[] = [
    '## Save Recovery Support Request',
    '',
    `**Error Code**: ${packet.errorCode}`,
    `**Error Message**: ${packet.errorMessage}`,
    `**Signature**: ${packet.failureSignature}`,
    `**Save Version**: ${packet.saveVersion}`,
    '',
    '### Broken Paths',
    ...packet.brokenPaths.map(p => `- ${p}`),
    '',
    '### Schema Status',
    `- Player: ${packet.schemaExcerpt.hasPlayer ? '✓' : '✗'}`,
    `- Needs: ${packet.schemaExcerpt.hasNeeds ? '✓' : '✗'}`,
    `- Relationships: ${packet.schemaExcerpt.hasRelationships ? '✓' : '✗'} (${packet.schemaExcerpt.relationshipEdgesCount} edges)`,
    `- Knowledge: ${packet.schemaExcerpt.hasKnowledge ? '✓' : '✗'}`,
    `- Inventory: ${packet.schemaExcerpt.hasInventory ? '✓' : '✗'} (${packet.schemaExcerpt.inventoryCount} items)`,
    `- Narrative History: ${packet.schemaExcerpt.hasNarrativeHistory ? '✓' : '✗'} (${packet.schemaExcerpt.narrativeHistoryLength} entries)`,
    `- Event History: ${packet.schemaExcerpt.hasEventHistory ? '✓' : '✗'} (${packet.schemaExcerpt.eventHistoryLength} entries)`,
    `- Checkpoints: ${packet.schemaExcerpt.hasCheckpoints ? '✓' : '✗'}`,
    '',
  ];
  
  if (packet.lastMigrationReport) {
    lines.push(
      '### Last Migration',
      `- From v${packet.lastMigrationReport.fromVersion} to v${packet.lastMigrationReport.toVersion}`,
      `- Applied ${packet.lastMigrationReport.appliedOpsCount} operations`,
      `- Lossy: ${packet.lastMigrationReport.lossyOps ? 'Yes' : 'No'}`,
      ''
    );
  }
  
  lines.push(
    '### Instructions',
    'Please analyze the broken paths and propose a FixProposal with:',
    '- Only allowlisted operations (set, delete, rename, coerce, truncate, filterArray, mapArray, ensureDefault, rebuildIndex)',
    '- Appropriate stage (A=safe auto, B=needs confirmation, C=lossy)',
    '- Risk assessment (low/medium/high)',
    '- Brief reasoning summary',
    '',
    'Return your proposal in the exact FixProposal JSON format.',
  );
  
  return lines.join('\n');
}

// ============================================================================
// PROPOSAL PARSING (from AI response)
// ============================================================================

export interface ParseResult {
  success: boolean;
  proposal: FixProposal | null;
  errors: string[];
}

export function parseAIProposal(response: string, signature: string): ParseResult {
  const errors: string[] = [];
  
  // Try to extract JSON from response
  let jsonStr = response;
  
  // Look for JSON block
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    // Try to find raw JSON object
    const objMatch = response.match(/\{[\s\S]*\}/);
    if (objMatch) {
      jsonStr = objMatch[0];
    }
  }
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    errors.push('Failed to parse JSON from response');
    return { success: false, proposal: null, errors };
  }
  
  // Validate structure
  const obj = parsed as Record<string, unknown>;
  
  if (!obj.ops || !Array.isArray(obj.ops)) {
    errors.push('Missing or invalid ops array');
  }
  
  if (!['A', 'B', 'C'].includes(obj.stage as string)) {
    errors.push('Invalid stage (must be A, B, or C)');
  }
  
  if (!['low', 'medium', 'high'].includes(obj.risk as string)) {
    errors.push('Invalid risk (must be low, medium, or high)');
  }
  
  if (!obj.reasoningSummary || typeof obj.reasoningSummary !== 'string') {
    errors.push('Missing reasoningSummary');
  }
  
  if (errors.length > 0) {
    return { success: false, proposal: null, errors };
  }
  
  // Build proposal
  const proposal: FixProposal = {
    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    signature,
    stage: obj.stage as RecoveryStage,
    ops: obj.ops as RecoveryOp[],
    expectedOutcome: (obj.expectedOutcome as string[]) ?? [],
    risk: obj.risk as ProposalRisk,
    reasoningSummary: (obj.reasoningSummary as string).slice(0, 500),
    createdAt: Date.now(),
    source: 'ai',
  };
  
  return { success: true, proposal, errors: [] };
}

// ============================================================================
// MANUAL PROPOSAL CREATION
// ============================================================================

export function createManualProposal(
  signature: string,
  stage: RecoveryStage,
  ops: RecoveryOp[],
  risk: ProposalRisk,
  reasoning: string
): FixProposal {
  return {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    signature,
    stage,
    ops,
    expectedOutcome: ops.map(op => `Fix ${op.path}`),
    risk,
    reasoningSummary: reasoning.slice(0, 500),
    createdAt: Date.now(),
    source: 'user',
  };
}

export function createSystemProposal(
  signature: string,
  stage: RecoveryStage,
  ops: RecoveryOp[],
  reasoning: string
): FixProposal {
  const hasLossy = ops.some(op => op.type === 'delete' || op.type === 'truncate');
  
  return {
    id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    signature,
    stage,
    ops,
    expectedOutcome: ops.map(op => `Fix ${op.path}`),
    risk: hasLossy ? 'high' : stage === 'A' ? 'low' : 'medium',
    reasoningSummary: reasoning.slice(0, 500),
    createdAt: Date.now(),
    source: 'system',
  };
}
