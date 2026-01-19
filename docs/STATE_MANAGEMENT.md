# State Management Architecture

This document details how state is managed and synchronized across the application.

## Overview

The application uses a hybrid state management approach:

1. **React Context** for global state (GameContext, CampaignContext)
2. **StateSyncBus** for cross-context communication
3. **localStorage** for persistence (via centralized STORAGE_KEYS)
4. **PlayerStateManager** for gameplay state

## StateSyncBus

The central pub/sub system for cross-context communication.

### Location
`src/services/stateSyncBus.ts`

### Event Types

```typescript
type SyncEventType = 
  | 'campaign:loaded'
  | 'campaign:saved'
  | 'campaign:deleted'
  | 'settings:director-updated'
  | 'settings:game-updated'
  | 'error:save-failed'
  | 'error:load-failed';
```

### Payload Types

```typescript
interface SyncEventPayloads {
  'campaign:loaded': { campaignId: string; campaignName: string };
  'campaign:saved': { campaignId: string; timestamp: number; checksum: string };
  'campaign:deleted': { campaignId: string };
  'settings:director-updated': { directorSettings: DirectorSettings };
  'settings:game-updated': { settings: Partial<GameSettings> };
  'error:save-failed': { campaignId: string; error: string; recoverable: boolean };
  'error:load-failed': { campaignId: string; error: string; canRetry: boolean };
}
```

### Usage

```typescript
import { StateSyncBus } from '@/services/stateSyncBus';

// Emit an event
StateSyncBus.emit('campaign:loaded', {
  campaignId: 'abc123',
  campaignName: 'My Adventure',
});

// Subscribe to events
const unsubscribe = StateSyncBus.subscribe('campaign:loaded', (event) => {
  console.log('Campaign loaded:', event.payload.campaignName);
});

// React hook for subscriptions
import { useStateSyncSubscription } from '@/services/stateSyncBus';

function MyComponent() {
  useStateSyncSubscription('campaign:saved', (event) => {
    toast.success('Game saved!');
  });
}
```

### Event Flow Diagram

```
┌─────────────────┐    emit()    ┌─────────────────┐
│  CampaignContext│──────────────│   StateSyncBus  │
│  (load campaign)│              │                 │
└─────────────────┘              └────────┬────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
           ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
           │  GameContext   │    │ AdventureGame  │    │  UI Components │
           │ (sync settings)│    │ (restore state)│    │ (show toasts)  │
           └────────────────┘    └────────────────┘    └────────────────┘
```

## GameContext

Global game state not specific to individual campaigns.

### Location
`src/contexts/GameContext.tsx`

### State Includes
- Campaign memory system
- World bible
- Pressure clock system
- NPC motivation system
- Memory bite system
- Dice mode
- Global settings

### Listens To
- `settings:director-updated` - Updates director settings
- `campaign:loaded` - Syncs with new campaign

## CampaignContext

Active campaign state with auto-save functionality.

### Location
`src/contexts/CampaignContext.tsx`

### State Includes
- Active campaign data
- Campaign metadata
- Player character
- Narrative history
- Weather/time state
- Checkpoints

### Emits
- `campaign:loaded` - After loading a campaign
- `campaign:saved` - After successful save
- `campaign:deleted` - After deleting a campaign
- `settings:director-updated` - When director settings change

## PlayerStateManager

Singleton for gameplay state (HP, XP, currency, inventory).

### Location
`src/game/playerStateManager.ts`

### Integration

```typescript
import { playerStateManager } from '@/game/playerStateManager';

// Subscribe to HP changes
playerStateManager.subscribe('hp', (data) => {
  console.log('HP changed:', data.newValue);
});

// Update HP
playerStateManager.applyDamage(10);
playerStateManager.applyHeal(5);
```

### Sync with React State

The `usePlayerStateSync` hook bridges PlayerStateManager with React:

```typescript
function AdventureGame() {
  const [character, setCharacter] = useState<RPGCharacter | null>(null);
  
  usePlayerStateSync({
    character,
    isPlaying: phase === 'playing',
    setCharacter,
  });
}
```

## Custom Hooks

### useDirectorSettings

Manages director/narrator settings with StateSyncBus integration.

```typescript
const { directorSettings, setDirectorSettings } = useDirectorSettings({
  isPlaying: phase === 'playing',
});
```

**Syncs from:**
- Initial campaign settings
- `settings:director-updated` events
- Campaign ID changes

### useWeatherTimeSystem

Manages weather and time with campaign persistence.

```typescript
const { weatherState, setWeatherState, timeState, setTimeState } = useWeatherTimeSystem({
  isPlaying: phase === 'playing',
});
```

**Syncs to:**
- Campaign context on every change
- Detects campaign restore and syncs back

### useCampaignSync

Bidirectional sync for story and character.

```typescript
const { syncStoryToCampaign, syncCharacterToCampaign } = useCampaignSync({
  isPlaying: phase === 'playing',
  story,
  character,
  setStory,
  setCharacter,
});
```

**Detects:**
- Tick decrease (checkpoint restore)
- Campaign ID changes
- Story/character updates

### useSceneIllustration

Manages scene illustration generation.

```typescript
const {
  sceneImageUrl,
  isGeneratingScene,
  generateSceneIllustration,
  checkSceneTriggers,
  closeSceneImage,
} = useSceneIllustration({
  genre,
  characterVisualProfile,
  story,
  weatherState,
  timeState,
  sceneIllustrationsEnabled,
});
```

## Storage Keys

All localStorage keys are centralized in `src/lib/storageKeys.ts`.

### Categories

| Category | Example Keys |
|----------|--------------|
| Campaign System | `lwe_campaign_index`, `lwe_campaign_{id}` |
| Game Settings | `untold-game-settings`, `untold-dice-mode` |
| World State | `untold-world-bible`, `untold-pressure-state` |
| Companion System | `companion-appearances`, `companion-introductions` |
| Session & Health | `lwe_session_id`, `lwe_storage_health` |
| Cache | `portrait-cache-*`, `scene-illustration-*` |

### Helper Functions

```typescript
import { 
  STORAGE_KEYS,
  getCampaignKey,
  getInventoryKey,
  isCacheKey,
  getAllCacheKeys,
} from '@/lib/storageKeys';

// Get campaign-specific key
const key = getCampaignKey('abc123'); // 'lwe_campaign_abc123'

// Check if key is low-priority cache
const isCache = isCacheKey('portrait-cache-xyz'); // true

// Get all cache keys for cleanup
const cacheKeys = getAllCacheKeys();
```

## Sync Patterns

### Campaign Load Sync

```
CampaignContext.loadCampaign()
       │
       ├──► Update activeCampaign state
       │
       ├──► Restore director settings to localStorage
       │
       ├──► StateSyncBus.emit('campaign:loaded')
       │
       └──► GameContext.onCampaignLoaded()
              │
              └──► Sync director settings to local state
```

### Director Settings Sync

```
User changes narrator settings
       │
       ▼
SettingsPanel.updateDirectorSettings()
       │
       ├──► Save to localStorage
       │
       ├──► Update campaign.settings.directorSettings
       │
       └──► StateSyncBus.emit('settings:director-updated')
              │
              ├──► GameContext updates settings
              │
              └──► useDirectorSettings hook updates
```

### Checkpoint Restore Sync

```
User restores checkpoint
       │
       ▼
CampaignContext.restoreCheckpoint()
       │
       ├──► Roll back campaign tick
       │
       ├──► Restore narrative history
       │
       └──► useCampaignSync detects tick < lastSyncedTick
              │
              └──► Sync story and character from campaign
```

## Testing

See `src/services/__tests__/stateSyncBus.test.ts` for comprehensive tests covering:
- Event emission and subscription
- Event history
- Deduplication
- Error handling
- React hook integration
