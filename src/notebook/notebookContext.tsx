import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Student, NotebookProgress, loadProgress, saveProgress, loadStudents, saveStudents } from './utils';

/* كود ماجيك بالتفت — سياق دفتر بغداد (نجوم، مكتملات، طلاب)
 * ============================================================
 */

interface NotebookCtx {
  stars: number;
  completed: Set<string>;
  students: Student[];
  currentStudent: Student | null;
  setCurrentStudent: (s: Student | null) => void;
  addStars: (n: number) => void;
  addCompleted: (key: string) => void;
  addStudent: (name: string) => void;
  deleteStudent: (index: number) => void;
  resetProgress: () => void;
}

const Ctx = createContext<NotebookCtx | null>(null);

export const NotebookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<NotebookProgress>(() => loadProgress());
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => loadStudents()[0] ?? null);

  const stars = progress.stars;
  const completed = useMemo(() => new Set(progress.completed), [progress.completed]);

  useEffect(() => { saveProgress(progress); }, [progress]);
  useEffect(() => { saveStudents(students); }, [students]);

  const addStars = useCallback((n: number) => {
    setProgress((p) => ({ ...p, stars: p.stars + n }));
    // تحديث نجمة الطالب الحالي إن وُجد
    setStudents((ss) => currentStudent
      ? ss.map((s) => (s.name === currentStudent.name ? { ...s, stars: s.stars + n } : s))
      : ss);
  }, [currentStudent]);

  const addCompleted = useCallback((key: string) => {
    setProgress((p) => {
      if (p.completed.includes(key)) return p;
      const completedLetter = key.split('_').slice(1).join('_');
      setStudents((ss) => currentStudent
        ? ss.map((s) => (s.name === currentStudent.name && !s.completedLetters.includes(completedLetter)
          ? { ...s, completedLetters: [...s.completedLetters, completedLetter] } : s))
        : ss);
      return { ...p, completed: [...p.completed, key] };
    });
  }, [currentStudent]);

  const addStudent = useCallback((name: string) => {
    const st: Student = {
      name,
      stars: 0,
      completedLetters: [],
      created: new Date().toISOString(),
    };
    setStudents((ss) => {
      // استبدال الغلاف بالنسخة الجديدة (كتابة مباشرة)
      const next = [...ss, st];
      setCurrentStudent(next[next.length - 1]);
      return next;
    });
  }, []);

  const deleteStudent = useCallback((index: number) => {
    setStudents((ss) => {
      const next = ss.filter((_, i) => i !== index);
      setCurrentStudent((cur) => (cur && !next.includes(cur) ? (next[0] ?? null) : cur));
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({ completed: [], stars: 0 });
  }, []);

  const value = useMemo(
    () => ({
      stars,
      completed,
      students,
      currentStudent,
      setCurrentStudent,
      addStars,
      addCompleted,
      addStudent,
      deleteStudent,
      resetProgress,
    }),
    [stars, completed, students, currentStudent, setCurrentStudent, addStars, addCompleted, addStudent, deleteStudent, resetProgress],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useNotebook(): NotebookCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotebook must be used within NotebookProvider');
  return ctx;
}
