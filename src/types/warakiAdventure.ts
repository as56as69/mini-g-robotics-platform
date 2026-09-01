/**
 * Waraki Adventures — «مغامرات ورقي»
 * A full-page story game opened from Magic Code (doodle mode). The child
 * programs Waraki's moves (walk/run/jump/fight) either via big arrow buttons
 * (young kids — one tap per command) or light paper cards (older kids).
 * Both feed one command queue executed step-by-step by the engine.
 */

export type AdventureAction = 'walk' | 'run' | 'jump' | 'jump2' | 'fight' | 'stop';

export interface AdventureCommand {
  id: string;
  action: AdventureAction;
  /** walk/run: steps to take (1..5) */
  steps: number;
}

export type AdventurePhase = 'narration' | 'ready' | 'running' | 'won';

export interface StageObstacle {
  /** position along the stage (abstract units, 0..stage.length) */
  at: number;
  kind: 'cubes';
}

export interface ChapterNarrationLine {
  speaker: 'waraki' | 'abbas' | 'hassan' | 'narrator';
  text: string;
}

export interface AdventureChapter {
  id: string;
  titleAr: string;
  icon: string;
  narration: ChapterNarrationLine[];
  stage: {
    /** stage length in abstract units */
    length: number;
    warakiStart: number;
    abbasAt: number;
    obstacles: StageObstacle[];
  };
  /** optional chasing paper-scrap villain (auto-crawls every engine beat) */
  monster?: {
    start: number;
    /** units crawled per engine beat — slow but relentless */
    speed: number;
    labelAr: string;
  };
  availableActions: AdventureAction[];
  winCondition: 'reach-abbas';
  /** Magic-code lesson unlocked on completion */
  reward: {
    titleAr: string;
    bodyAr: string;
    icon: string;
  };
  /** حسن's gift (season end only) — opens Waraki Jump free-play game */
  gift?: {
    titleAr: string;
    bodyAr: string;
  };
}

export interface EngineState {
  /** positions in abstract stage units */
  warakiX: number;
  monsterX?: number;
  activeIndex: number;
  status: 'idle' | 'running' | 'won' | 'lost';
  message: string | null;
  /** comic victory: the monster tears apart into flying paper bits */
  monsterShattered?: boolean;
  /** waraki is mid-jump (arc animation) */
  jumping?: boolean;
  /** fight strike landed — brief flash on the stage */
  striking?: boolean;
}
