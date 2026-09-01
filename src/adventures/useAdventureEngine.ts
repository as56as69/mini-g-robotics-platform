import { useCallback, useRef, useState } from 'react';
import { AdventureCommand, EngineState } from '../types/warakiAdventure';
import { AdventureChapter } from '../types/warakiAdventure';

export interface UseAdventureEngineResult {
  state: EngineState;
  reset: () => void;
  run: (commands: AdventureCommand[]) => Promise<void>;
}

/** One «خطوة» of a walk card covers this many stage units (out of 100). */
const STEP_UNITS = 6;
/** One «خطوة» of a run card — the sprint magic (chapter 2+). */
const RUN_UNITS = 10;
/** Jump arc distance (single) — clears obstacles under the arc. */
const JUMP_UNITS = 8;
/** Double jump arc — longer (unlocked after chapter 3). */
const JUMP2_UNITS = 12;
/** Fight strike succeeds only within this distance of the monster. */
const FIGHT_RANGE = 5;
/** Distance treated as "touching" (obstacle body / monster catch). */
const TOUCH_DISTANCE = 2;

/**
 * Adventure engine — CLEAR GAME RULES:
 *
 * Axis (unified `left%`): waraki starts high-X (right) and moves toward
 * Abbas at low-X (left). The view renders every element with `left: pct%`.
 *
 * • WALK/RUN  — ground moves. Landing on or crossing an obstacle CRASHES.
 *   The monster (if alive) BLOCKS the path: walking within TOUCH_DISTANCE
 *   of it loses — you cannot slip past without fighting.
 * • JUMP      — arc of 8 units. Everything under the arc is cleared
 *   (obstacles AND the monster are flown over, no ground collision).
 * • JUMP2     — same, 12 units (unlocked after chapter 3).
 * • FIGHT     — only works when the monster is within 5 units; it then
 *   comically shatters. Fighting from far = lose (educational message).
 */
export function useAdventureEngine(
  chapter: AdventureChapter,
  onWin?: () => void
) {
  const { stage, monster } = chapter;

  const [state, setState] = useState<EngineState>({
    warakiX: stage.warakiStart,
    monsterX: monster?.start,
    activeIndex: -1,
    status: 'idle',
    message: null,
    monsterShattered: false,
    jumping: false,
    striking: false,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const reset = useCallback(() => {
    setState({
      warakiX: stage.warakiStart,
      monsterX: monster?.start,
      activeIndex: -1,
      status: 'idle',
      message: null,
      monsterShattered: false,
      jumping: false,
      striking: false,
    });
  }, [stage.warakiStart, monster?.start]);

  const run = useCallback(
    async (commands: AdventureCommand[]) => {
      if (stateRef.current.status === 'running') return;

      let x = stage.warakiStart;
      let mx = monster?.start;
      setState({
        warakiX: x,
        monsterX: mx,
        activeIndex: 0,
        status: 'running',
        message: null,
        monsterShattered: false,
        jumping: false,
        striking: false,
      });

      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        setState((s) => ({ ...s, activeIndex: i }));
        await new Promise((r) => setTimeout(r, 280)); // highlight beat per card

        // ===== STOP — dangerous pause: the monster keeps crawling =====
        if (cmd.action === 'stop') {
          if (monster && mx !== undefined) {
            mx = mx + (x > mx ? monster.speed * 1.6 : -monster.speed);
            if (Math.abs(mx - x) <= TOUCH_DISTANCE) {
              setState({ warakiX: x, monsterX: mx, activeIndex: i, status: 'lost', message: 'قبض عليّ! كود أسرع يا عباس! 😱' });
              return;
            }
            setState((s) => ({ ...s, monsterX: mx }));
          }
          await new Promise((r) => setTimeout(r, 420));
          continue;
        }

        // ===== FIGHT — strike lands only within FIGHT_RANGE =====
        if (cmd.action === 'fight') {
          if (mx !== undefined && Math.abs(mx - x) <= FIGHT_RANGE) {
            setState((s) => ({ ...s, striking: true }));
            await new Promise((r) => setTimeout(r, 450)); // lunge flash
            setState((s) => ({ ...s, monsterShattered: true, striking: false }));
            mx = undefined;
            await new Promise((r) => setTimeout(r, 800));
            continue;
          }
          setState((s) => ({
            ...s,
            striking: false,
            status: 'lost',
            message: mx !== undefined
              ? 'بعيد جداً! اقترب من الوحش حتى تلمس حلقة القتال ثم اقاتل! ⚔️'
              : 'لا وحش هنا… لا حاجة للقتال!',
          }));
          return;
        }

        // ===== JUMP / JUMP2 — flies over everything under the arc =====
        if (cmd.action === 'jump' || cmd.action === 'jump2') {
          const arcUnits = cmd.action === 'jump2' ? JUMP2_UNITS : JUMP_UNITS;
          const next = Math.max(stage.abbasAt, Math.min(stage.length, x - arcUnits));

          // monster crawls during the jump too
          if (monster && mx !== undefined) {
            mx = mx + (mx < x ? monster.speed : -monster.speed);
          }

          setState((s) => ({ ...s, warakiX: next, monsterX: mx, status: 'running', jumping: true }));
          await new Promise((r) => setTimeout(r, 640)); // arc duration
          setState((s) => ({ ...s, jumping: false }));
          x = next;

          if (next <= stage.abbasAt + 2) {
            setState({ warakiX: next, monsterX: mx, activeIndex: i, status: 'won', message: null, monsterShattered: !!monster });
            return;
          }
          // the monster can still grab a low-flying hero at the edges
          if (mx !== undefined && Math.abs(mx - next) <= TOUCH_DISTANCE) {
            setState({ warakiX: next, monsterX: mx, activeIndex: i, status: 'lost', message: 'قبض عليّ! كود أسرع يا عباس! 😱' });
            return;
          }
          continue;
        }

        // ===== WALK / RUN — ground steps; obstacles & monster BLOCK the way =====
        const units = cmd.action === 'run' ? RUN_UNITS : STEP_UNITS;
        for (let step = 0; step < cmd.steps; step++) {
          const target = Math.max(stage.abbasAt, Math.min(stage.length, x - units));

          // monster crawls first — it moves as waraki moves
          if (monster && mx !== undefined) {
            mx = mx + (mx < x ? monster.speed : -monster.speed);
          }

          // CRASH: landing on OR crossing an obstacle without a jump
          const landedOn = stage.obstacles.some((o) => Math.abs(target - o.at) <= TOUCH_DISTANCE);
          const crossed = stage.obstacles.some((o) => (x - o.at) * (target - o.at) < 0);
          if (landedOn || crossed) {
            // stop right before the obstacle, then crash
            const blockAt = nearestObstacleBefore(x, stage.obstacles);
            x = stopAtObstacleSafe(x, blockAt);
            setState({ warakiX: x, monsterX: mx, activeIndex: i, status: 'lost', message: 'بووم! مكعبات ورقية! اقفز فوقها 🦘' });
            return;
          }

          setState((s) => ({ ...s, warakiX: target, monsterX: mx, status: 'running' }));
          await new Promise((r) => setTimeout(r, cmd.action === 'run' ? 185 : 240));
          x = target;

          // the monster BLOCKS the path — walking into it loses; fight is mandatory
          if (mx !== undefined && Math.abs(mx - target) <= TOUCH_DISTANCE) {
            setState({
              warakiX: target,
              monsterX: mx,
              activeIndex: i,
              status: 'lost',
              message: 'الوحش يحجب الطريق! اقترب منه ثم اقاتل يا عباس! ⚔️',
            });
            return;
          }

          // reached abbas — only reachable when the path is genuinely clear
          if (target <= stage.abbasAt + 2) {
            setState({ warakiX: target, monsterX: mx, activeIndex: i, status: 'won', message: null, monsterShattered: !!monster });
            return;
          }
        }
      }

      setState((s) => ({ ...s, status: 'lost', message: 'لم أصل بعد… جرّب كوداً آخر يا عباس! 🤔' }));
    },
    [stage, monster]
  );

  return { state, reset, run };
}

/** stops waraki just before the obstacle */
function nearestObstacleBefore(x: number, obstacles: { at: number }[]): number | null {
  const ahead = obstacles.filter((o) => o.at < x).sort((a, b) => b.at - a.at);
  return ahead[0]?.at ?? null;
}

function stopAtObstacleSafe(x: number, blockAt: number | null): number {
  if (blockAt === null) return x;
  return Math.min(x, blockAt + 3);
}

function obstacleCrash(proposed: number, from: number, obstacles: { at: number }[]): boolean {
  return obstacles.some(
    (o) =>
      Math.abs(proposed - o.at) <= TOUCH_DISTANCE ||
      ((from - o.at) * (proposed - o.at) < 0)
  );
}
