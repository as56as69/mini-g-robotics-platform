import type { RobotModelType } from './robot';

export interface LessonChallenge {
  id: string;
  titleAr: string;
  descriptionAr: string;
  model: 'mini_gf' | 'mini_gm' | 'mini_g';
  difficulty: 'مبتدئ' | 'متوسط' | 'بطل';
  xpReward: number;
  starsCount: number;
  initialXml?: string;
  targetCriteria: {
    descriptionAr: string;
    targetEvent: string;
  };
  /** Lab mission card — hardware GPIO pin map (manual, optional) */
  hardwarePins?: string;
  /** Lab mission card — Blockly block hints shown to the student (manual, optional) */
  blocksHint?: string[];
  /** Lab mission card — protocol code e.g. LAB-PROTOCOL-01 (auto-generated on create) */
  protocolCode?: string;
  /** Worksheet questions (multiple-choice) auto-generated or manually attached to a unit */
  worksheetQuestions?: { q: string; options: string[]; correctIndex: number }[];
}

/** A curriculum unit persisted in the shared school store */
export interface SchoolUnit extends LessonChallenge {
  createdAt: string;
  updatedAt: string;
}

export type StudentStatus = 'active' | 'done' | 'help';

export interface StudentProfile {
  id: string;
  name: string;
  /** Class / section the student is enrolled in */
  classId: string;
  /** Unique login code shown on the badge card (MG-####) */
  loginCode: string;
  /** Secret emojis a young kid uses as a passphrase, printed on the card */
  secretEmojis: string[];
  /** Assigned robot for this student's station */
  assignedRobot: string;
  /** Auto-assigned station id (Station-##) */
  stationId: string;
  /** Live status in the teacher's roster */
  status: StudentStatus;
  /** Short textual progress snapshot */
  progress: string;
  avatar?: string;
  stars: number;
  xp: number;
  streakDays: number;
  completedQuests: string[];
  activeModel: RobotModelType;
  lastActivity: string | null;
  /** Issued certificates (persisted in the shared student profile) */
  certificates?: {
    id: string;
    certNumber: string;
    unitId?: string;
    courseName: string;
    coachName?: string;
    level: string;
    issuedAt: string;
  }[];
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  /** e.g. المرحلة الابتدائية العليا */
  grade: string;
  /** Numeric code pupils can quote to locate this section (unique) */
  joinCode: string;
  /** Currently active lesson/unit shown on the section (title for compatibility) */
  activeLesson: string;
  /** Reference to the activated unit id in the shared curriculum store */
  activeLessonId?: string;
}

/** Full server snapshot used by /api/export and /api/import */
export interface SchoolSnapshot {
  classes: Classroom[];
  students: StudentProfile[];
  units: SchoolUnit[];
}