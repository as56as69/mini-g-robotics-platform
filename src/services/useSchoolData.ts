import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Classroom, StudentProfile, SchoolSnapshot, SchoolUnit, StudentStatus } from '../types/lms';
import { schoolApi, loadCache, saveCache } from './schoolApi';

export type ServerStatus = 'loading' | 'online' | 'offline';

function emptySnapshot(): SchoolSnapshot {
  return { classes: [], students: [], units: [] };
}

/**
 * Central store for the school hub (classes + students + curriculum units).
 * - Loads an immediate snapshot from localStorage (offline-first).
 * - Then pulls the server (Express + JSON) for the shared real data.
 * - If the server is unreachable every mutation still works locally and is
 *   cached; a light polling loop grabs the server data again when it returns.
 */
export function useSchoolData() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [units, setUnits] = useState<SchoolUnit[]>([]);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('loading');

  const cacheRef = useRef<SchoolSnapshot>(emptySnapshot());
  // Guard concurrent server polls so slow responses never drop new data
  const syncingRef = useRef(false);

  const persist = useCallback((next: SchoolSnapshot) => {
    cacheRef.current = next;
    saveCache(next);
  }, []);

  const applySnapshot = useCallback((snap: SchoolSnapshot) => {
    cacheRef.current = snap;
    setClasses(snap.classes);
    setStudents(snap.students);
    setUnits(snap.units || []);
    saveCache(snap);
  }, []);

  const refresh = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const [cs, sts, us] = await Promise.all([schoolApi.getClasses(), schoolApi.getStudents(), schoolApi.getUnits()]);
      applySnapshot({ classes: cs, students: sts, units: us });
      setServerStatus('online');
    } catch {
      setServerStatus('offline');
    } finally {
      syncingRef.current = false;
    }
  }, [applySnapshot]);

  // Boot: cached data instantly, then server
  useEffect(() => {
    const cached = loadCache();
    if (cached) applySnapshot(cached);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the server comes back, pull the shared truth again
  useEffect(() => {
    if (serverStatus !== 'offline') return;
    const timer = window.setInterval(() => {
      refresh();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [serverStatus, refresh]);

  // ---- Mutations (optimistic locally, best-effort server) ----

  const addClass = useCallback(async (input: { name: string; grade?: string }) => {
    try {
      const cls = await schoolApi.createClass(input);
      setClasses(prev => {
        const next = [...prev, cls];
        persist({ classes: next, students: studentsRef.current, units: unitsRef.current });
        return next;
      });
      setServerStatus('online');
      return cls;
    } catch {
      // Offline: no server-generated id — keep a temporary card until sync
      const temp: Classroom = {
        id: `local_${Date.now()}`,
        name: input.name,
        code: 'ROBO-????',
        grade: input.grade || '',
        joinCode: '····',
        activeLesson: 'أساسيات التحكم المنطقي',
      };
      setClasses(prev => {
        const next = [...prev, temp];
        persist({ classes: next, students: studentsRef.current, units: unitsRef.current });
        return next;
      });
      setServerStatus('offline');
      return temp;
    }
  }, [persist]);

  const updateClass = useCallback(async (id: string, patch: Partial<Classroom>) => {
    try {
      const updated = await schoolApi.updateClass(id, patch);
      setClasses(prev => {
        const next = prev.map(c => (c.id === id ? updated : c));
        persist({ classes: next, students: studentsRef.current, units: unitsRef.current });
        return next;
      });
      setServerStatus('online');
    } catch {
      setClasses(prev => {
        const next = prev.map(c => (c.id === id ? { ...c, ...patch } : c));
        persist({ classes: next, students: studentsRef.current, units: unitsRef.current });
        return next;
      });
      setServerStatus('offline');
    }
  }, [persist]);

  const deleteClass = useCallback(async (id: string) => {
    try {
      await schoolApi.deleteClass(id);
      setClasses(prev => {
        const next = prev.filter(c => c.id !== id);
        persist({
          classes: next,
          students: studentsRef.current.filter(s => s.classId !== id),
          units: unitsRef.current,
        });
        setStudents(studentsRef.current.filter(s => s.classId !== id));
        return next;
      });
      setServerStatus('online');
    } catch {
      setClasses(prev => {
        const next = prev.filter(c => c.id !== id);
        persist({
          classes: next,
          students: studentsRef.current.filter(s => s.classId !== id),
          units: unitsRef.current,
        });
        setStudents(studentsRef.current.filter(s => s.classId !== id));
        return next;
      });
      setServerStatus('offline');
    }
  }, [persist]);

  const addStudent = useCallback(async (input: { classId: string; name: string; robot?: string }) => {
    try {
      const st = await schoolApi.createStudent(input);
      setStudents(prev => {
        const next = [...prev, st];
        persist({ classes: classesRef.current, students: next, units: unitsRef.current });
        return next;
      });
      setServerStatus('online');
      return st;
    } catch {
      const temp: StudentProfile = {
        id: `local_${Date.now()}`,
        name: input.name,
        classId: input.classId,
        loginCode: 'MG-####',
        secretEmojis: ['🤖', '🚀', '⭐'],
        assignedRobot: input.robot || 'Mini G-M (رفيق المكتب)',
        stationId: 'Station-??',
        status: 'active',
        progress: 'لم يبدأ بعد',
        stars: 0,
        xp: 0,
        streakDays: 0,
        completedQuests: [],
        activeModel: 'mini_gm',
        lastActivity: null,
      };
      setStudents(prev => {
        const next = [...prev, temp];
        persist({ classes: classesRef.current, students: next, units: unitsRef.current });
        return next;
      });
      setServerStatus('offline');
      return temp;
    }
  }, [persist]);

  const updateStudent = useCallback(async (id: string, patch: Partial<StudentProfile>) => {
    try {
      const updated = await schoolApi.updateStudent(id, patch);
      setStudents(prev => {
        const next = prev.map(s => (s.id === id ? updated : s));
        persist({ classes: classesRef.current, students: next, units: unitsRef.current });
        return next;
      });
      setServerStatus('online');
    } catch {
      setStudents(prev => {
        const next = prev.map(s => (s.id === id ? { ...s, ...patch } : s));
        persist({ classes: classesRef.current, students: next, units: unitsRef.current });
        return next;
      });
      setServerStatus('offline');
    }
  }, [persist]);

  const deleteStudent = useCallback(async (id: string) => {
    try {
      await schoolApi.deleteStudent(id);
    } catch { /* offline — still remove locally */ }
    setStudents(prev => {
      const next = prev.filter(s => s.id !== id);
      persist({ classes: classesRef.current, students: next, units: unitsRef.current });
      return next;
    });
  }, [persist]);

  // ---- Curriculum units ----

  const addUnit = useCallback(async (input: Partial<SchoolUnit>) => {
    try {
      const unit = await schoolApi.createUnit(input);
      setUnits(prev => {
        const next = [unit, ...prev];
        persist({ classes: classesRef.current, students: studentsRef.current, units: next });
        return next;
      });
      setServerStatus('online');
      return unit;
    } catch {
      const temp: SchoolUnit = {
        id: `local_${Date.now()}`,
        titleAr: input.titleAr || '',
        descriptionAr: input.descriptionAr || '',
        model: input.model || 'mini_gm',
        difficulty: input.difficulty || 'مبتدئ',
        xpReward: input.xpReward || 150,
        starsCount: input.starsCount || 3,
        initialXml: input.initialXml,
        targetCriteria: input.targetCriteria || { descriptionAr: '', targetEvent: 'CUSTOM_EVENT' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUnits(prev => {
        const next = [temp, ...prev];
        persist({ classes: classesRef.current, students: studentsRef.current, units: next });
        return next;
      });
      setServerStatus('offline');
      return temp;
    }
  }, [persist]);

  const updateUnit = useCallback(async (id: string, patch: Partial<SchoolUnit>) => {
    try {
      const updated = await schoolApi.updateUnit(id, patch);
      setUnits(prev => {
        const next = prev.map(u => (u.id === id ? updated : u));
        persist({ classes: classesRef.current, students: studentsRef.current, units: next });
        return next;
      });
      setServerStatus('online');
    } catch {
      setUnits(prev => {
        const next = prev.map(u => (u.id === id ? { ...u, ...patch } : u));
        persist({ classes: classesRef.current, students: studentsRef.current, units: next });
        return next;
      });
      setServerStatus('offline');
    }
  }, [persist]);

  const deleteUnit = useCallback(async (id: string) => {
    try {
      await schoolApi.deleteUnit(id);
    } catch { /* offline — still remove locally */ }
    setUnits(prev => {
      const next = prev.filter(u => u.id !== id);
      persist({ classes: classesRef.current, students: studentsRef.current, units: next });
      return next;
    });
  }, [persist]);

  /** Activate a unit on a section: stores both the reference id and the title */
  const activateUnit = useCallback((classId: string, unit: SchoolUnit) => {
    void updateClass(classId, { activeLesson: unit.titleAr, activeLessonId: unit.id });
  }, [updateClass]);

  const exportJson = useCallback((): string => {
    return JSON.stringify(cacheRef.current, null, 2);
  }, []);

  const importJson = useCallback(async (raw: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(raw) as SchoolSnapshot;
      if (!Array.isArray(parsed?.classes) || !Array.isArray(parsed?.students)) return false;
      if (!Array.isArray(parsed?.units)) parsed.units = [];
      try {
        const server = await schoolApi.importAll(parsed);
        applySnapshot(server);
        setServerStatus('online');
      } catch {
        applySnapshot(parsed);
        setServerStatus('offline');
      }
      return true;
    } catch {
      return false;
    }
  }, [applySnapshot]);

  // keep refs in sync for stable callbacks
  const classesRef = useRef(classes);
  const studentsRef = useRef(students);
  const unitsRef = useRef(units);
  useEffect(() => { classesRef.current = classes; }, [classes]);
  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => { unitsRef.current = units; }, [units]);

  const setStudentStatus = useCallback((id: string, status: StudentStatus, progress?: string) => {
    void updateStudent(id, {
      status,
      ...(progress !== undefined ? { progress } : {}),
      lastActivity: new Date().toISOString(),
    });
  }, [updateStudent]);

  return {
    classes,
    students,
    units,
    serverStatus,
    refresh,
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    updateStudent,
    deleteStudent,
    setStudentStatus,
    addUnit,
    updateUnit,
    deleteUnit,
    activateUnit,
    exportJson,
    importJson,
  };
}