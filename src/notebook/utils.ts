

/* كود ماجيك بالتفت — أدوات حفظ/استرجاع دفتر بغداد
 * ============================================================
 */

export interface NotebookProgress {
  completed: string[];
  stars: number;
}

export interface Student {
  name: string;
  stars: number;
  completedLetters: string[];
  created: string;
}

const PROGRESS_KEY = 'mg_notebook_progress';
const STUDENTS_KEY = 'mg_notebook_students';

export function loadProgress(): NotebookProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        completed: Array.isArray(data.completed) ? data.completed : [],
        stars: typeof data.stars === 'number' ? data.stars : 0,
      };
    }
  } catch { /* noop */ }
  return { completed: [], stars: 0 };
}

export function saveProgress(p: NotebookProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch { /* noop */ }
}

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

export function saveStudents(students: Student[]) {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  } catch { /* noop */ }
}

export function letterKey(lang: string, mode: string, char: string): string {
  return `${lang}_${mode}_${char}`;
}

export function sessionLetters(
  lang: string,
  mode: string,
  arabic: string[],
  english: string[],
  arabicNums: string[],
  englishNums: string[],
): string[] {
  const list = mode === 'numbers'
    ? (lang === 'arabic' ? arabicNums : englishNums)
    : (lang === 'arabic' ? arabic : english);
  return list;
}

/** فرز الطلاب حسب الاسم حرفياً */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
