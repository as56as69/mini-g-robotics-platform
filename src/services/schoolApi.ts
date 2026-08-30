import type { Classroom, StudentProfile, SchoolSnapshot, SchoolUnit, StudentStatus } from '../types/lms';
const BASE = (import.meta.env.VITE_API_URL as string) || '';

const CACHE_KEY = 'mg_school_cache_v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = `خطأ (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* non-JSON body */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const schoolApi = {
  getClasses: () => request<Classroom[]>('/api/classes'),
  createClass: (body: { name: string; grade?: string }) =>
    request<Classroom>('/api/classes', { method: 'POST', body: JSON.stringify(body) }),
  updateClass: (id: string, patch: Partial<Classroom>) =>
    request<Classroom>(`/api/classes/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteClass: (id: string) =>
    request<{ ok: boolean }>(`/api/classes/${id}`, { method: 'DELETE' }),

  getUnits: () => request<SchoolUnit[]>('/api/units'),
  createUnit: (body: Partial<SchoolUnit>) =>
    request<SchoolUnit>('/api/units', { method: 'POST', body: JSON.stringify(body) }),
  updateUnit: (id: string, patch: Partial<SchoolUnit>) =>
    request<SchoolUnit>(`/api/units/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteUnit: (id: string) =>
    request<{ ok: boolean }>(`/api/units/${id}`, { method: 'DELETE' }),

  generateWorksheet: (unitId: string, count: number) =>
    request<{ questions: { q: string; options: string[]; correctIndex: number }[]; source: string }>('/api/worksheets/generate', {
      method: 'POST',
      body: JSON.stringify({ unitId, count }),
    }),

  login: (joinCode: string, loginCode: string) =>
    request<{ student: StudentProfile; className: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ joinCode, loginCode }),
    }),

  getStudents: (classId?: string) =>
    request<StudentProfile[]>(classId ? `/api/classes/${classId}/students` : '/api/students'),
  getStudent: (id: string) => request<StudentProfile>(`/api/students/${id}`),
  createStudent: (body: { classId: string; name: string; robot?: string }) =>
    request<StudentProfile>('/api/students', { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (id: string, patch: Partial<StudentProfile>) =>
    request<StudentProfile>(`/api/students/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  issueCertificate: (id: string, body: { courseName: string; coachName?: string; level: string; unitId?: string }) =>
    request<StudentProfile>(`/api/students/${id}/certificates`, { method: 'POST', body: JSON.stringify(body) }),
  deleteStudent: (id: string) =>
    request<{ ok: boolean }>(`/api/students/${id}`, { method: 'DELETE' }),

  exportAll: () => request<SchoolSnapshot>('/api/export'),
  importAll: (snapshot: SchoolSnapshot) =>
    request<SchoolSnapshot>('/api/import', { method: 'POST', body: JSON.stringify(snapshot) }),
};

/* ---------------- Local offline cache ---------------- */

export function loadCache(): SchoolSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SchoolSnapshot;
    if (!Array.isArray(parsed?.classes) || !Array.isArray(parsed?.students)) return null;
    if (!Array.isArray(parsed?.units)) parsed.units = [];
    return parsed;
  } catch {
    return null;
  }
}

export function saveCache(snapshot: SchoolSnapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch { /* storage full / private mode */ }
}

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch { /* noop */ }
}

export type { Classroom, StudentProfile, SchoolUnit, SchoolSnapshot };