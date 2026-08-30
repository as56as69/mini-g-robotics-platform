export type RobotModelType = 'mini_gf' | 'mini_gm' | 'mini_g';

export interface RobotModelInfo {
  id: RobotModelType;
  name: string;
  nameAr: string;
  tagline: string;
  taglineAr: string;
  price: string;
  category: string;
  categoryAr: string;
  badgeColor: string;
  descriptionAr: string;
  featuresAr: string[];
}

export const ROBOT_MODELS: Record<RobotModelType, RobotModelInfo> = {
  mini_gf: {
    id: 'mini_gf',
    name: 'Mini G-F',
    nameAr: 'ميني جي إف',
    tagline: 'The Keychain Explorer',
    taglineAr: 'ميدالية الاستكشاف والورش التمهيدية',
    price: '$10 - $15',
    category: 'Starter / Workshop Gift',
    categoryAr: 'اقتصادي / هدايا الورش التفاعلية',
    badgeColor: 'from-amber-400 to-orange-500',
    descriptionAr: 'روبوت ميدالية ذكي مصمم لورش نهاية الأسبوع، يتفاعل مع اللمس والهز ويضيء بليدات ملونة ويهتز بمحرك هابتيك صغير.',
    featuresAr: ['ليدات RGB متعددة الألوان', 'محرك اهتزاز تفاعلي (Haptic)', 'مستشعر لمس كهروسكوني', 'اقتران BLE فوري']
  },
  mini_gm: {
    id: 'mini_gm',
    name: 'Mini G-M',
    nameAr: 'ميني جي إم',
    tagline: 'Desktop Companion & Study Buddy',
    taglineAr: 'رفيق المكتب التفاعلي والدراسة',
    price: '$50',
    category: 'Mid-Tier / Desktop Companion',
    categoryAr: 'متوسط / رفيق المذاكرة والمكتب',
    badgeColor: 'from-cyan-400 to-blue-600',
    descriptionAr: 'رفيق مكتب ذكي برأس متحرك وعنق سيرفو، شاشة عيون كرتونية معبرة، ومكبر صوت نغمات، مع إكمال جسده افتراضياً داخل التطبيق!',
    featuresAr: ['شاشة عيون وتعبيرات حية', 'محرك سيرفو لحركة الرأس والعنق', 'مكبر صوت للنغمات التعبيرية', 'مستشعر حركة ولمس مكتبي', 'توأم رقمي يكمل الجسد افتراضياً']
  },
  mini_g: {
    id: 'mini_g',
    name: 'Mini G',
    nameAr: 'ميني جي (الروبوت الكامل)',
    tagline: 'Smart Humanoid AI Assistant',
    taglineAr: 'الروبوت الإنساني الذكي ومساعد الفصل',
    price: '$500',
    category: 'Flagship / School AI Lab',
    categoryAr: 'متقدم / مختبرات المدارس الذكية',
    badgeColor: 'from-purple-500 to-pink-600',
    descriptionAr: 'روبوت تعليمي متكامل بارتفاع نصف متر، قاعدة عجلات، أذرع بمفاصل حركية، شاشة وجوه ناطقة تدعم شخصيات الذكاء الاصطناعي التوليدي والتعرف الصوتي.',
    featuresAr: ['قاعدة عجلات ومحركات قيادة', 'أذرع ومفاصل سيرفو متعددة', 'شاشة وجوه ناطقة مع Lip-sync', 'تكامل ذكاء اصطناعي وتغيير شخصيات', 'رؤية ذكية وحوار صوتي']
  }
};

export type AppMode = 'kid_home' | 'school_lms';

export interface CommandPacket {
  robotType: RobotModelType;
  commandId: number;
  data: number[];
}

export interface RobotState {
  connected: boolean;
  model: RobotModelType;
  batteryLevel: number;
  rssi: number;
  // Mini G-F State
  gf_ledColor: string;
  gf_vibrating: boolean;
  // Mini G-M State
  gm_expression: string;
  gm_customFace?: number[] | null;
  gm_headAngle: number;
  gm_isPlayingSound: boolean;
  // Avatar customization
  costumeSkinColor: string;
  // Mini G State
  g_wheelSpeedL: number;
  g_wheelSpeedR: number;
  g_armLeftAngle: number;
  g_armRightAngle: number;
  g_activePersona: string;
  g_isTalking: boolean;
  g_speechText: string;
}
