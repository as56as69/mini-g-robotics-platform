/**
 * Pixel face store — a single source of truth for hand-drawn 8x8 faces.
 * Backed by localStorage so designs survive tab switches and page reloads.
 *
 * - Library: named faces (max MAX_FACES), consumed by the designer UI and
 *   the Blockly "send pixel face" block dropdown (built dynamically).
 * - Current face: autosaved on every board change, restored on reopen.
 */

export interface SavedFace {
  name: string;
  bytes: number[];
}

const LIB_KEY = 'mg_pixel_faces';
const CURRENT_KEY = 'mg_pixel_face_current';
export const MAX_FACES = 10;

/** Library of named faces: { [name]: 8 row-bytes } */
export function loadFaceLibrary(): Record<string, number[]> {
  try {
    const raw = localStorage.getItem(LIB_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number[]>;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch { /* corrupt — start empty */ }
  return {};
}

function writeLibrary(lib: Record<string, number[]>) {
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(lib));
  } catch { /* storage full / private mode */ }
}

export type SaveResult = 'ok' | 'exists' | 'full' | 'invalid';

export function saveFace(name: string, bytes: number[]): SaveResult {
  const clean = String(name || '').trim();
  if (!clean) return 'invalid';
  const lib = loadFaceLibrary();
  if (lib[clean]) return 'exists';
  if (Object.keys(lib).length >= MAX_FACES) return 'full';
  lib[clean] = bytes.slice(0, 8);
  writeLibrary(lib);
  return 'ok';
}

export function deleteFace(name: string) {
  const lib = loadFaceLibrary();
  delete lib[name];
  writeLibrary(lib);
}

/** Row-bytes of the design currently on the studio board (autosaved) */
export function getCurrentFace(): number[] | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (!raw) return null;
    const bytes = JSON.parse(raw) as number[];
    if (Array.isArray(bytes) && bytes.length === 8) return bytes;
  } catch { /* noop */ }
  return null;
}

/** Autosave the design currently on the board (called on every pixel change) */
export function setCurrentFace(bytes: number[]) {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(bytes.slice(0, 8)));
  } catch { /* noop */ }
}

/** Last drawn face (or null if nothing saved yet) */
export function loadCurrentFace(): number[] | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (!raw) return null;
    const bytes = JSON.parse(raw) as number[];
    if (Array.isArray(bytes) && bytes.length === 8) return bytes;
  } catch { /* noop */ }
  return null;
}
