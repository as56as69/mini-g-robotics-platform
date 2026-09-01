import { AdventureChapter } from '../types/warakiAdventure';

/**
 * «مغامرات ورقي» — story data.
 *
 * Canon (from the user): حسن the older brother crafted Waraki from the magic
 * notebook to protect his little brother عباس while he is at school. Every
 * chapter teaches one Magic-Code lesson — Waraki grows stronger and Abbas
 * becomes a stronger programmer.
 */

export const CHAPTER_1: AdventureChapter = {
  id: 'ch1-birth',
  titleAr: 'الفصل الأول: الولادة',
  icon: '🍼',
  narration: [
    {
      speaker: 'narrator',
      text: 'حسن الأخ الأكبر يذهب إلى المدرسة، ويبقى عباس الأصغر وحده — متعلقاً بأخيه وخائفاً من الظلام.',
    },
    {
      speaker: 'hassan',
      text: 'لن أتركك وحيداً يا عباس… صنعت لك من الدفتر السحري صديقاً يحميك حتى أعود!',
    },
    {
      speaker: 'waraki',
      text: 'هلا! أنا «ورقي» — وُلدت من ورقة ممزقة في الدفتر السحري لِأَحميَك من كل الوحوش!',
    },
    {
      speaker: 'abbas',
      text: 'أهلاً ورقي! أنا في الطرف الآخر من الغرفة… اعبر الغرفة وصولاً إليّ!',
    },
  ],
  stage: {
    length: 100,
    warakiStart: 88,
    abbasAt: 8,
    obstacles: [],
  },
  availableActions: ['walk', 'stop'],
  winCondition: 'reach-abbas',
  reward: {
    icon: '🚶',
    titleAr: 'معلومة سحرية جديدة!',
    bodyAr: 'أنت تعلمت كود المشي! بلوك «امشِ» أصبح سلاحك الدائم — ورقي صار أقوى وعباس أصبح مبرمجاً أقوى!',
  },
};

export const CHAPTER_2: AdventureChapter = {
  id: 'ch2-oath',
  titleAr: 'الفصل الثاني: الاتفاق السحري',
  icon: '🤝',
  narration: [
    {
      speaker: 'narrator',
      text: 'بعد لقاء عباس وورقي، وُلد «الاتفاق السحري» بينهما في عالم ماجيك كود.',
    },
    {
      speaker: 'abbas',
      text: 'اتفقنا يا ورقي: أنا أكتب الكود وأنت تنفذه — وأنا أحمي ظهرك بالأكواد السحرية!',
    },
    {
      speaker: 'waraki',
      text: 'وعدٌ سحري بيننا! لكن… ما هذا الصوت الخلفي؟! ورقة شريرة تزحف نحوي!',
    },
    {
      speaker: 'abbas',
      text: 'وحش ورقي! اركض يا ورقي وصولاً إليّ بسرعة — أنا أحمي ظهرك بالكود!',
    },
  ],
  stage: {
    length: 100,
    warakiStart: 62,
    abbasAt: 8,
    obstacles: [],
  },
  monster: {
    start: 88,
    /** units crawled per engine beat — slow but relentless */
    speed: 1.4,
    labelAr: 'ورقة شريرة',
  },
  availableActions: ['run', 'stop'],
  winCondition: 'reach-abbas',
  reward: {
    icon: '🏃',
    titleAr: 'معلومة سحرية جديدة!',
    bodyAr: 'أنت تعلمت كود الركض! بلوك «اركض» أصبح سلاحك — السرعة تهزم الوحوش! ورقي أسرع وعباس مبرمج أقوى!',
  },
};

export const CHAPTER_3: AdventureChapter = {
  id: 'ch3-shelves',
  titleAr: 'الفصل الثالث: عبور الرفوف',
  icon: '📚',
  narration: [
    {
      speaker: 'narrator',
      text: 'ورقي يتعلم كل يوم — وكل أمر يكتبه عباس يتحول لكود سحري في الدفتر.',
    },
    {
      speaker: 'abbas',
      text: 'كنزي فوق الرف! المكعبات الورقية تحجب الطريق نحوي…',
    },
    {
      speaker: 'waraki',
      text: 'سأقفز فوقها! علّمني كود القفز يا عباس!',
    },
    {
      speaker: 'abbas',
      text: 'اتفقنا — لكن حسب قوة القفز! القفزة القليلة تصطدم بالعائق، والقفزة فوق العائق تعبِر!',
    },
  ],
  stage: {
    length: 100,
    warakiStart: 88,
    abbasAt: 8,
    obstacles: [
      { at: 25, kind: 'cubes' },
      { at: 50, kind: 'cubes' },
      { at: 75, kind: 'cubes' },
    ],
  },
  availableActions: ['walk', 'jump', 'stop'],
  winCondition: 'reach-abbas',
  reward: {
    icon: '🦘',
    titleAr: 'معلومة سحرية + كود مفتوح!',
    bodyAr: 'أنت تعلمت كود القفز! بلوك «اقفز» أصبح سلاحك — وتفتح لك الآن القفزة المزدوجة 🦘🦘 (قوس أعلى وأبعد)! ورقي أعلى وعباس مبرمج أقوى!',
  },
};

export const CHAPTER_4: AdventureChapter = {
  id: 'ch4-battle',
  titleAr: 'الفصل الرابع: أول معركة',
  icon: '⚔️',
  narration: [
    {
      speaker: 'narrator',
      text: 'في ظلام الغرفة، وحوش الظل الورقية تطارد الظلال…',
    },
    {
      speaker: 'waraki',
      text: 'وحش الظل قادم! لا يمكن الهروب هذه المرة…',
    },
    {
      speaker: 'abbas',
      text: 'اقترب منه ثم اقاتل! ضربتك السحرية تنجح فقط عند القرب — لكن احذر ألا يلمسك!',
    },
    {
      speaker: 'waraki',
      text: 'لأول مرة أقاتل! عباس، اكتب لي كود القتال!',
    },
  ],
  stage: {
    length: 100,
    warakiStart: 88,
    abbasAt: 8,
    obstacles: [],
  },
  monster: {
    start: 60,
    speed: 1.2,
    labelAr: 'وحش الظل',
  },
  availableActions: ['walk', 'run', 'jump', 'fight', 'stop'],
  winCondition: 'reach-abbas',
  reward: {
    icon: '⚔️',
    titleAr: 'معلومة سحرية جديدة!',
    bodyAr: 'أنت تعلمت كود القتال! بلوك «اقاتل» أصبح سلاحك — الشجاعة مع الكود تهزم الظلام!',
  },
};

export const CHAPTER_5: AdventureChapter = {
  id: 'ch5-return',
  titleAr: 'الفصل الختامي: عودة حسن',
  icon: '🏠',
  narration: [
    {
      speaker: 'narrator',
      text: 'وأخيراً… باب الغرفة انفتح! حسن عاد من المدرسة!',
    },
    {
      speaker: 'hassan',
      text: 'عباس! ما هذه الأصوات؟ من هذا الوحش الورقي اللطيف؟',
    },
    {
      speaker: 'abbas',
      text: 'هذا ورقي يا أخي! صديقي وحارسني — برمجته بنفسي بأكواد ماجيك كود!',
    },
    {
      speaker: 'waraki',
      text: 'وعدنا السحري اكتمل — عباس مبرمج أقوى، وأنا حارسه الدائم حتى نهاية كل مغامرة!',
    },
  ],
  stage: {
    length: 100,
    warakiStart: 70,
    abbasAt: 8,
    obstacles: [],
  },
  availableActions: ['walk', 'run', 'jump', 'jump2', 'stop'],
  winCondition: 'reach-abbas',
  reward: {
    icon: '🏆',
    titleAr: 'أُنجز الموسم الأول!',
    bodyAr: 'عاد حسن ووجد عباس مبرمجاً حقيقياً — ورقي أصبح «حارس عباس» الرسمي! اكتمل الاتفاق السحري… ومغامرة جديدة تنتظر!',
  },
};

export const WARAKI_CHAPTERS: AdventureChapter[] = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5];

export function getChapter(id: string): AdventureChapter | undefined {
  return WARAKI_CHAPTERS.find((c) => c.id === id);
}
