/**
 * Waraki event bus — bridges Blockly execution events in the doodle notebook
 * to the paper-monster character («ورقي») without prop drilling.
 */

export type WarakiEvent =
  | { type: 'drag' }
  | { type: 'color'; color: string }
  | { type: 'vibrate' }
  | { type: 'run-start' }
  | { type: 'success' }
  | { type: 'error' };

const EVENT_NAME = 'mg-waraki';

export function emitWaraki(detail: WarakiEvent) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export function listenWaraki(handler: (detail: WarakiEvent) => void): () => void {
  const wrapped = (e: Event) => {
    const detail = (e as CustomEvent).detail as WarakiEvent;
    if (detail?.type) handler(detail);
  };
  window.addEventListener(EVENT_NAME, wrapped);
  return () => window.removeEventListener(EVENT_NAME, wrapped);
}
