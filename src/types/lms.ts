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
}

export interface StudentProfile {
  id: string;
  name: string;
  avatar: string;
  stars: number;
  xp: number;
  streakDays: number;
  completedQuests: string[];
  activeModel: 'mini_gf' | 'mini_gm' | 'mini_g';
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  grade: string;
  studentsCount: number;
  activeLesson: string;
  completionRate: number;
}
