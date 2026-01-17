// Command keyword parser for enhanced text input
// Supports: talking, actions, replies, inventory, terrain manipulation, developer commands

export interface ParsedCommand {
  type: 'talk' | 'say' | 'end_conversation' | 'action' | 'reply' | 'inventory' | 'terrain' | 'look' | 'move' | 'system' | 'checkself' | 'developer';
  verb: string;
  target?: string;
  args: string[];
  raw: string;
}

// Developer commands that open special panels
export const DEVELOPER_COMMANDS = ['/imacheater', '/cheat', '/dev', '/integrity', '/events', '/debug'] as const;
export type DeveloperCommand = typeof DEVELOPER_COMMANDS[number];

// Keyword mappings for different command types
const TALK_KEYWORDS = ['tell', 'greet', 'chat', 'talk'];
const SAY_KEYWORDS = ['say', 'ask', 'shout', 'whisper', 'speak'];
const ACTION_KEYWORDS = ['do', 'use', 'open', 'close', 'push', 'pull', 'hit', 'attack', 'touch', 'grab', 'take', 'drop', 'throw', 'kick', 'break', 'search', 'examine', 'inspect'];
const REPLY_KEYWORDS = ['reply', 'respond', 'answer', 'nod', 'shake', 'agree', 'disagree', 'accept', 'refuse', 'decline'];
const INVENTORY_KEYWORDS = ['inventory', 'inv', 'items', 'bag', 'pocket', 'equip', 'unequip', 'wear', 'remove', 'check'];
const TERRAIN_KEYWORDS = ['dig', 'build', 'place', 'destroy', 'craft', 'make', 'create', 'demolish', 'construct', 'plant', 'harvest', 'climb', 'jump', 'swim', 'hide'];
const LOOK_KEYWORDS = ['look', 'see', 'observe', 'view', 'scan', 'watch', 'peer', 'gaze', 'glance'];
const MOVE_KEYWORDS = ['go', 'walk', 'run', 'move', 'travel', 'head', 'enter', 'exit', 'north', 'south', 'east', 'west', 'n', 's', 'e', 'w'];
const SYSTEM_KEYWORDS = ['help', 'save', 'load', 'status', 'wait', 'rest', 'sleep'];
const END_CONVERSATION_KEYWORDS = ['bye', 'goodbye', 'farewell', 'later', 'cya', 'seeya'];
const CHECKSELF_KEYWORDS = ['/checkself', '/check', 'checkself', '/assess', '/wounds', '/injuries'];

export function parseEnhancedCommand(input: string): ParsedCommand {
  const trimmed = input.trim().toLowerCase();
  const words = trimmed.split(/\s+/);
  const firstWord = words[0] || '';
  const rest = words.slice(1);
  
  // Check for developer commands first
  if (DEVELOPER_COMMANDS.includes(firstWord as DeveloperCommand)) {
    return {
      type: 'developer',
      verb: firstWord,
      target: rest[0],
      args: rest,
      raw: input,
    };
  }
  
  // Check for checkself command first (slash commands)
  if (CHECKSELF_KEYWORDS.includes(firstWord)) {
    // Parse thoroughness from args: /checkself careful, /checkself thorough
    const thoroughness = rest[0] || 'quick';
    return {
      type: 'checkself',
      verb: 'checkself',
      target: thoroughness,
      args: rest,
      raw: input,
    };
  }
  
  // Check each keyword category
  if (TALK_KEYWORDS.includes(firstWord)) {
    return {
      type: 'talk',
      verb: firstWord,
      target: rest[0],
      args: rest,
      raw: input,
    };
  }
  
  // Say command - for ongoing conversations
  if (SAY_KEYWORDS.includes(firstWord)) {
    return {
      type: 'say',
      verb: firstWord,
      target: undefined, // Say doesn't target, it continues conversation
      args: rest,
      raw: input,
    };
  }
  
  // End conversation command
  if (END_CONVERSATION_KEYWORDS.includes(firstWord)) {
    return {
      type: 'end_conversation',
      verb: firstWord,
      target: undefined,
      args: rest,
      raw: input,
    };
  }
  
  if (REPLY_KEYWORDS.includes(firstWord)) {
    return {
      type: 'reply',
      verb: firstWord,
      target: rest[0],
      args: rest,
      raw: input,
    };
  }
  
  if (INVENTORY_KEYWORDS.includes(firstWord)) {
    return {
      type: 'inventory',
      verb: firstWord,
      target: rest[0],
      args: rest,
      raw: input,
    };
  }
  
  if (TERRAIN_KEYWORDS.includes(firstWord)) {
    return {
      type: 'terrain',
      verb: firstWord,
      target: rest[0],
      args: rest,
      raw: input,
    };
  }
  
  if (LOOK_KEYWORDS.includes(firstWord)) {
    return {
      type: 'look',
      verb: firstWord,
      target: rest[0],
      args: rest,
      raw: input,
    };
  }
  
  if (MOVE_KEYWORDS.includes(firstWord)) {
    return {
      type: 'move',
      verb: firstWord,
      target: rest[0],
      args: rest,
      raw: input,
    };
  }
  
  if (SYSTEM_KEYWORDS.includes(firstWord)) {
    return {
      type: 'system',
      verb: firstWord,
      target: rest[0],
      args: rest,
      raw: input,
    };
  }
  
  if (ACTION_KEYWORDS.includes(firstWord)) {
    return {
      type: 'action',
      verb: firstWord,
      target: rest[0],
      args: rest,
      raw: input,
    };
  }
  
  // Default to action if no match
  return {
    type: 'action',
    verb: firstWord,
    target: rest[0],
    args: rest,
    raw: input,
  };
}

// Get command type icon and label for UI hints
export function getCommandTypeInfo(type: ParsedCommand['type']): { icon: string; label: string; color: string } {
  switch (type) {
    case 'talk':
      return { icon: '💬', label: 'Talk', color: 'text-blue-400' };
    case 'say':
      return { icon: '🗣️', label: 'Say', color: 'text-sky-400' };
    case 'end_conversation':
      return { icon: '👋', label: 'Goodbye', color: 'text-amber-400' };
    case 'reply':
      return { icon: '↩️', label: 'Reply', color: 'text-cyan-400' };
    case 'action':
      return { icon: '⚡', label: 'Action', color: 'text-yellow-400' };
    case 'inventory':
      return { icon: '🎒', label: 'Inventory', color: 'text-amber-400' };
    case 'terrain':
      return { icon: '🔨', label: 'Terrain', color: 'text-green-400' };
    case 'look':
      return { icon: '👁️', label: 'Observe', color: 'text-purple-400' };
    case 'move':
      return { icon: '🚶', label: 'Move', color: 'text-orange-400' };
    case 'system':
      return { icon: '⚙️', label: 'System', color: 'text-muted-foreground' };
    case 'developer':
      return { icon: '🔧', label: 'Developer', color: 'text-amber-400' };
    default:
      return { icon: '❓', label: 'Unknown', color: 'text-muted-foreground' };
  }
}

// Get all available keywords for help display
export function getAllKeywords(): Record<string, string[]> {
  return {
    'Talk': TALK_KEYWORDS,
    'Say': SAY_KEYWORDS,
    'End Conversation': END_CONVERSATION_KEYWORDS,
    'Reply': REPLY_KEYWORDS,
    'Action': ACTION_KEYWORDS,
    'Inventory': INVENTORY_KEYWORDS,
    'Terrain': TERRAIN_KEYWORDS,
    'Look': LOOK_KEYWORDS,
    'Move': MOVE_KEYWORDS,
    'System': SYSTEM_KEYWORDS,
  };
}
