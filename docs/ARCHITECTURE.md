# System Architecture

This document provides a high-level overview of the application architecture, key subsystems, and their interactions.

## Overview

The Living World Engine is a text-based RPG engine built with React, TypeScript, and Supabase (via Lovable Cloud). The architecture follows a **simulation-first** design where the world runs independently of player actions—NPCs have autonomy, schedules, memories, and relationships that evolve even when the player isn't watching.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Application Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │    Pages    │  │  Components │  │    Hooks    │  │   Modals   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           State Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │GameContext  │  │ Campaign-   │  │ StateSyncBus│  │  Player    │ │
│  │             │  │ Context     │  │  (Pub/Sub)  │  │  State Mgr │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Game Engine Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Living World│  │   NPC       │  │  Weather/   │  │  Director  │ │
│  │   Engine    │  │  Registry   │  │  Time Sys   │  │   Mode     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Ripple    │  │  Unreliable │  │  Player     │  │ Companion  │ │
│  │  Effects    │  │  Info Sys   │  │ Corrections │  │   System   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Persistence Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Unified     │  │   Save      │  │   Data      │  │ localStorage│
│  │ Save Arch   │  │ Transaction │  │ Integrity   │  │ (via Keys) │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend Layer                                │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Lovable Cloud (Supabase)                     ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐││
│  │  │ Database │  │  Auth    │  │ Storage  │  │  Edge Functions  │││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Key Subsystems

### 1. State Management

| System | Purpose | Location |
|--------|---------|----------|
| **GameContext** | Global game state (campaign memory, world bible, pressure clocks) | `src/contexts/GameContext.tsx` |
| **CampaignContext** | Active campaign data, auto-save, checkpoints | `src/contexts/CampaignContext.tsx` |
| **StateSyncBus** | Cross-context pub/sub communication | `src/services/stateSyncBus.ts` |
| **PlayerStateManager** | HP, XP, currency, inventory | `src/game/playerStateManager.ts` |

### 2. Living World Engine

The core simulation systems that make the world feel alive:

| System | Purpose | Location |
|--------|---------|----------|
| **World Object Registry** | Item permanence and single-ownership | `src/game/worldObjectRegistry.ts` |
| **NPC Identity Registry** | Locks family/biological identities | `src/game/npcIdentityRegistry.ts` |
| **Player Correction System** | Meta-corrections to game canon | `src/game/playerCorrectionSystem.ts` |
| **Ripple Effect System** | Action consequences over time | `src/game/rippleEffectSystem.ts` |
| **Unreliable Information** | NPC lies, rumors, knowledge bases | `src/game/unreliableInformationSystem.ts` |

### 3. Save System

See [SAVE_SYSTEM.md](./SAVE_SYSTEM.md) for detailed documentation.

### 4. State Synchronization

See [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) for detailed documentation.

## Component Decomposition

The main game component (`AdventureGame.tsx`) has been decomposed into specialized hooks:

| Hook | Responsibility |
|------|----------------|
| `useWeatherTimeSystem` | Weather and time state with campaign sync |
| `useDirectorSettings` | DM/narrator settings via StateSyncBus |
| `useCampaignSync` | Bidirectional story/character sync |
| `usePlayerStateSync` | HP/XP/Currency sync with PlayerStateManager |
| `useSceneIllustration` | Context-aware image generation |

## Data Flow

### Campaign Loading Flow
```
User clicks "Load Story"
       │
       ▼
CampaignContext.loadCampaign()
       │
       ├──► SaveSchemaManager.normalizeCampaign()  (backfill missing fields)
       │
       ├──► StateSyncBus.emit('campaign:loaded')
       │
       ├──► GameContext receives event, updates state
       │
       └──► AdventureGame receives campaign, updates UI
```

### Save Transaction Flow
```
Auto-save or manual save triggered
       │
       ▼
SaveTransaction.execute()
       │
       ├──► checkAndCleanupStorage()  (proactive quota management)
       │
       ├──► localStorage.setItem()
       │
       ├──► verifyWrite()  (re-read and checksum compare)
       │
       ├──► StateSyncBus.emit('campaign:saved')
       │
       └──► UI shows save indicator
```

## Error Recovery

The application implements tiered error recovery:

| Component | Purpose |
|-----------|---------|
| `RecoveryBoundary` | React error boundary with recovery options |
| `SaveFailedModal` | Handle save failures with retry/export |
| `LoadFailedModal` | Handle load failures with backup options |

## Storage Key Management

All localStorage keys are centralized in `src/lib/storageKeys.ts`. See that file for the complete registry.

**Never use raw strings for localStorage keys.**

```typescript
// ❌ Wrong
localStorage.getItem('my-custom-key');

// ✅ Correct
import { STORAGE_KEYS } from '@/lib/storageKeys';
localStorage.getItem(STORAGE_KEYS.CAMPAIGN_INDEX);
```

## Testing

Critical systems have test coverage:

- `src/lib/__tests__/saveSchemaManager.test.ts` - Schema normalization
- `src/services/__tests__/stateSyncBus.test.ts` - Event bus
- `src/lib/__tests__/storageKeys.test.ts` - Key management
