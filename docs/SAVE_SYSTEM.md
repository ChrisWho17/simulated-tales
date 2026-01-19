# Save System Architecture

This document details the campaign save system, including data flow, schema management, error handling, and recovery mechanisms.

## Overview

The save system supports up to 20 isolated campaigns with:
- Auto-save every 60 seconds
- Manual checkpoints (up to 5 per campaign)
- JSON import/export
- Campaign duplication
- Legacy save migration

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Save Operations                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Auto-Save  │  │  Manual     │  │   Export    │  │   Import   │ │
│  │   Timer     │  │  Checkpoint │  │   JSON      │  │   JSON     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │               │         │
│         └────────────────┼────────────────┼───────────────┘         │
│                          ▼                ▼                         │
│                 ┌─────────────────────────────────┐                 │
│                 │      UnifiedSaveArchitecture    │                 │
│                 └─────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Save Transaction                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Quota     │  │   Write     │  │   Verify    │  │  StateBus  │ │
│  │   Check     │  │   Execute   │  │   Read-back │  │   Emit     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         localStorage                                 │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  lwe_campaign_index  │  lwe_campaign_{id}  │  lwe_inventory_{id}││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Key Components

### UnifiedSaveArchitecture (`src/services/unifiedSaveArchitecture.ts`)

Central coordinator for all save operations:

```typescript
interface UnifiedSaveArchitecture {
  saveCampaign(campaign: CampaignData): Promise<SaveResult>;
  loadCampaign(campaignId: string): Promise<CampaignData | null>;
  createCheckpoint(campaignId: string, name: string): Promise<void>;
  exportCampaign(campaignId: string): Promise<string>; // JSON
  importCampaign(jsonData: string): Promise<CampaignData>;
}
```

### SaveSchemaManager (`src/lib/saveSchemaManager.ts`)

Handles schema versioning and data normalization:

```typescript
interface SaveSchemaManager {
  currentVersion: number; // Currently 4
  normalizeCampaign(data: unknown): CampaignData;
  validateCampaign(data: unknown): ValidationResult;
  createMinimalCampaign(params: CreateParams): CampaignData;
  normalizeCheckpoint(data: unknown): CampaignCheckpoint;
}
```

**Key Feature: Automatic Backfilling**

When loading older saves, missing fields are automatically populated:

```typescript
// Example: Old save missing 'worldBible' field
const normalizedCampaign = normalizeCampaign(oldSave);
// normalizedCampaign.worldBible is now DEFAULT_WORLD_BIBLE
```

### SaveTransaction (`src/services/saveTransaction.ts`)

Provides atomic save operations with verification:

```typescript
interface SaveTransaction {
  id: string;
  state: 'pending' | 'executing' | 'completed' | 'failed' | 'verified';
  checksum: string;
  verificationPassed: boolean;
  retryCount: number;
}
```

**Verification Process:**
1. Execute write to localStorage
2. Re-read the written data
3. Compare checksums
4. Verify data integrity (parseability)
5. Confirm size matches
6. Emit success/failure event

### DataIntegrityService (`src/services/dataIntegrityService.ts`)

Validates and repairs campaign data:

```typescript
interface DataIntegrityService {
  runFullIntegrityScan(): Promise<IntegrityScanResult>;
  repairCampaign(campaignId: string): Promise<RepairResult>;
  validateCampaignData(data: unknown): ValidationResult;
}
```

## Storage Keys

All save-related keys are centralized:

| Key | Purpose |
|-----|---------|
| `lwe_campaign_index` | Array of campaign metadata |
| `lwe_campaign_{id}` | Full campaign data |
| `lwe_inventory_{id}` | Campaign inventory |
| `lwe_gamestate_{id}` | Campaign game state |
| `lwe_active_campaign_id` | Currently active campaign |

## Auto-Save Flow

```
Every 60 seconds (configurable)
       │
       ▼
CampaignContext.autoSave()
       │
       ├──► Sync latest narrative history
       │
       ├──► Sync player state
       │
       ├──► checkAndCleanupStorage()
       │
       ├──► SaveTransaction.execute()
       │
       ├──► verifyWrite()
       │
       └──► StateSyncBus.emit('campaign:saved')
```

## Error Handling

### Quota Exceeded

When localStorage is full:

1. `checkAndCleanupStorage()` is called
2. Low-priority data is pruned (in order):
   - Portrait caches
   - Scene illustrations
   - NPC portrait caches
   - Old autosave snapshots
3. Retry the save operation
4. If still failing, show `SaveFailedModal`

### Corruption Detection

The system detects corrupted saves via:

- Checksum mismatches
- JSON parse failures
- Schema validation errors
- Missing required fields

Recovery options:
- Load from backup
- Import from exported JSON
- Delete corrupted campaign
- Start fresh

## Checkpoint System

Users can create up to 5 manual checkpoints per campaign:

```typescript
interface CampaignCheckpoint {
  id: string;
  name: string;
  createdAt: string;
  tick: number;
  narrativeLength: number;
  playerSnapshot: RPGCharacter;
  worldSnapshot: WorldBible;
}
```

**Restoring a Checkpoint:**
1. Load checkpoint data
2. Sync tick and state to campaign
3. StateSyncBus detects tick decrease
4. Components re-sync from campaign (rollback)

## Import/Export

### Export Format

Campaigns export as JSON with:
- Full campaign data
- Schema version
- Checksum for validation
- Export timestamp

### Import Validation

Imported campaigns are:
1. Parsed and validated
2. Normalized to current schema
3. Assigned new unique ID
4. Added to campaign index
5. Available for loading

## Testing

See `src/lib/__tests__/saveSchemaManager.test.ts` for comprehensive tests covering:
- Schema normalization
- Field backfilling
- Validation logic
- Checkpoint handling
- Migration from old formats
