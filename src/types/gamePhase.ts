/** Adventure bootstrap / play surface phases (extracted from AdventureGame). */
export type GamePhase =
  | 'loading'
  | 'recovery'
  | 'scenario'
  | 'color'
  | 'character'
  | 'narrator'
  | 'playing';
