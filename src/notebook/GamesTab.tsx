import React, { useState } from 'react';
import { BAGHDADI_WORDS } from './data';
import { useNotebook } from './notebookContext';
import { shuffle } from './utils';
import { HarfooshTab } from './HarfooshTab';

/* كود ماجيك بالتفت — تبويب الألعاب (3 ألعاب + بوابة حرفوش)
 * ============================================================
 */

interface Props {
  letters: string[];
}

export const GamesTab: React.FC<Props> = ({ letters }) => {
  const { addStars, addCompleted } = useNotebook();
  const [view, setView] = useState<'games' | 'harfoosh'>('games');
  const list = letters.length > 0 ? letters : ['أ', 'ب', 'ت'];

  // لعبة 1: مطابقة الحرف مع الكلمة
  const [matchLetter, setMatchLetter] = useState<string | null>(null);
  const [matchOptions, setMatchOptions] = useState<string[]>([]);
  const [matchMsg, setMatchMsg] = useState('اختر الكلمة المناسبة للحرف!');
  const [matchColor, setMatchColor] = useState('#636e72');

  const startMatch = () => {
    const char = list[Math.floor(Math.random() * list.length)];
    const word = BAGHDADI_WORDS[char];
    if (!word) { setMatchMsg('لا توجد كلمة لهذا الحرف!'); setMatchColor('#ff6b6b'); return; }
    setMatchLetter(char);
    const all = Object.values(BAGHDADI_WORDS).map((w) => w.word).filter((w) => w !== word.word);
    const opts = shuffle([word.word, all[0] ?? 'بغداد', all[1] ?? 'نخلة']);
    setMatchOptions(opts);
    setMatchMsg('اختر الكلمة المناسبة للحرف!');
    setMatchColor('#636e72');
  };

  const pickMatch = (opt: string) => {
    if (!matchLetter) return;
    const word = BAGHDADI_WORDS[matchLetter];
    if (opt === word.word) {
      setMatchMsg('✅ صحيح! أحسنت!'); setMatchColor('#00b894');
      addStars(1); addCompleted(`game_match_${matchLetter}`);
      showCelebration(matchLetter);
    } else {
      setMatchMsg('❌ حاول مرة أخرى!'); setMatchColor('#ff6b6b');
    }
  };

  // لعبة 2: البحث عن الحرف
  const [findWord, setFindWord] = useState('بغداد');
  const [findTarget, setFindTarget] = useState('ب');
  const [findOptions, setFindOptions] = useState<string[]>([]);
  const [findMsg, setFindMsg] = useState('اختر الحرف الصحيح!');
  const [findColor, setFindColor] = useState('#636e72');

  const startFind = () => {
    const wordKeys = Object.keys(BAGHDADI_WORDS);
    const base = list.length >= 3 ? list : ['أ', 'ب', 'ت', 'د'];
    const available = wordKeys.filter((k) => base.includes(k));
    if (available.length === 0) { setFindMsg('لا توجد كلمات!'); setFindColor('#ff6b6b'); return; }
    const key = available[Math.floor(Math.random() * available.length)];
    const wd = BAGHDADI_WORDS[key];
    const chars = wd.word.split('');
    const target = chars[Math.floor(Math.random() * chars.length)];
    setFindWord(wd.word);
    setFindTarget(target);
    const others = base.filter((c) => c !== target).slice(0, 3);
    setFindOptions(shuffle([target, ...others]));
    setFindMsg('اختر الحرف الصحيح!');
    setFindColor('#636e72');
  };

  const pickFind = (opt: string) => {
    if (opt === findTarget) {
      setFindMsg(`✅ صحيح! الحرف ${findTarget} موجود في كلمة "${findWord}"!`); setFindColor('#00b894');
      addStars(1); addCompleted(`game_find_${findTarget}`);
      showCelebration(findTarget);
    } else {
      setFindMsg('❌ ليس هذا الحرف!'); setFindColor('#ff6b6b');
    }
  };

  // لعبة 3: قطار الحروف
  const [trainSelected, setTrainSelected] = useState<string[]>([]);
  const [trainDisplay, setTrainDisplay] = useState<string[]>([]);
  const [trainIdx, setTrainIdx] = useState(0);
  const [trainMsg, setTrainMsg] = useState('رتب الحروف بالترتيب الصحيح!');
  const [trainColor, setTrainColor] = useState('#636e72');

  const startTrain = () => {
    const count = Math.min(4, list.length);
    const selected = shuffle(list).slice(0, count);
    setTrainSelected(selected);
    setTrainDisplay(shuffle(selected));
    setTrainIdx(0);
    setTrainMsg('رتب الحروف بالترتيب الصحيح!');
    setTrainColor('#636e72');
  };

  const pickTrain = (ch: string, origIdx: number) => {
    if (trainDisplay[origIdx] === undefined) return;
    const expected = trainSelected[trainIdx];
    if (ch === expected) {
      setTrainDisplay((prev) => prev.map((p, i) => (i === origIdx ? '' : p)));
      const next = trainIdx + 1;
      setTrainIdx(next);
      if (next >= trainSelected.length) {
        setTrainMsg('🎉 رائع! رتبت القطار بالكامل!'); setTrainColor('#00b894');
        addStars(2); addCompleted(`game_train_${trainSelected.join('')}`);
        showCelebration('🚂');
      } else {
        setTrainMsg(`👍 أحسنت! اختر التالي (${next + 1}/${trainSelected.length})`); setTrainColor('#fdcb6e');
      }
    } else {
      setTrainMsg('❌ ليس هذا الحرف!'); setTrainColor('#ff6b6b');
    }
  };

  const showCelebration = (_ch: string) => {
    // (الاحتفال البصري يتم عبر شريط النجوم/الميداليات المحدث فوراً)
  };

  return view === 'harfoosh' ? (
    <HarfooshTab onBack={() => setView('games')} />
  ) : (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      {/* لعبة 1 */}
      <div className="bg-white rounded-[18px_5px_18px_5px] border-[3px] border-dashed border-[#d4b8a0] p-4 shadow-[5px_5px_0_rgba(0,0,0,0.06)]">
        <h3 className="font-bold text-lg text-[#2d3436] mb-2">🧩 مطابقة الحرف مع الكلمة</h3>
        <div className="flex flex-wrap items-center justify-center gap-3 min-h-[70px]">
          <span className="text-4xl font-bold text-[#6c5ce7]">{matchLetter ?? '?'}</span>
          <div className="flex flex-wrap gap-2 justify-center">
            {matchOptions.map((o) => (
              <button key={o} onClick={() => pickMatch(o)} className="font-bold text-lg px-4 py-2 bg-[#f8f4f0] text-[#2d3436] border-[3px] border-[#d4b8a0] shadow-[3px_3px_0_#e6d6c2] rounded-[30px_8px_30px_8px] hover:border-[#6c5ce7] transition">{o}</button>
            ))}
          </div>
        </div>
        <div className="text-center text-sm font-bold my-2" style={{ color: matchColor }}>{matchMsg}</div>
        <div className="text-center"><button onClick={startMatch} className="font-bold px-5 py-2 bg-[#6c5ce7] text-white rounded-[30px_8px_30px_8px] shadow-[4px_4px_0_#4a3f8a]">🔄 لعبة جديدة</button></div>
      </div>

      {/* لعبة 2 */}
      <div className="bg-white rounded-[18px_5px_18px_5px] border-[3px] border-dashed border-[#d4b8a0] p-4 shadow-[5px_5px_0_rgba(0,0,0,0.06)]">
        <h3 className="font-bold text-lg text-[#2d3436] mb-2">🔍 ابحث عن الحرف</h3>
        <div className="flex flex-wrap items-center justify-center gap-3 min-h-[70px]">
          <span className="text-3xl font-bold text-[#2d3436]">{findWord}</span>
          <span className="text-sm text-[#636e72]">ابحث عن: <span className="text-2xl font-bold text-[#6c5ce7]">{findTarget}</span></span>
          <div className="flex flex-wrap gap-2 justify-center">
            {findOptions.map((o) => (
              <button key={o} onClick={() => pickFind(o)} className="font-bold text-lg px-4 py-2 bg-[#f8f4f0] text-[#2d3436] border-[3px] border-[#d4b8a0] shadow-[3px_3px_0_#e6d6c2] rounded-[30px_8px_30px_8px] hover:border-[#6c5ce7] transition">{o}</button>
            ))}
          </div>
        </div>
        <div className="text-center text-sm font-bold my-2" style={{ color: findColor }}>{findMsg}</div>
        <div className="text-center"><button onClick={startFind} className="font-bold px-5 py-2 bg-[#6c5ce7] text-white rounded-[30px_8px_30px_8px] shadow-[4px_4px_0_#4a3f8a]">🔄 لعبة جديدة</button></div>
      </div>

      {/* لعبة 3 */}
      <div className="bg-white rounded-[18px_5px_18px_5px] border-[3px] border-dashed border-[#d4b8a0] p-4 shadow-[5px_5px_0_rgba(0,0,0,0.06)]">
        <h3 className="font-bold text-lg text-[#2d3436] mb-2">🚂 قطار الحروف</h3>
        <div className="flex flex-wrap items-center justify-center gap-2 min-h-[70px]">
          {trainDisplay.map((ch, i) =>
            ch ? <button key={`${ch}-${i}`} onClick={() => pickTrain(ch, i)} className="font-bold text-xl w-12 h-12 bg-[#f8f4f0] text-[#2d3436] border-[3px] border-[#d4b8a0] shadow-[3px_3px_0_#e6d6c2] rounded-[50%_25%_50%_25%] hover:border-[#6c5ce7] transition">{ch}</button>
              : <span key={i} className="w-12 h-12 flex items-center justify-center text-green-600 text-xl">✅</span>
          )}
        </div>
        <div className="text-center text-sm font-bold my-2" style={{ color: trainColor }}>{trainMsg}</div>
        <div className="text-center"><button onClick={startTrain} className="font-bold px-5 py-2 bg-[#6c5ce7] text-white rounded-[30px_8px_30px_8px] shadow-[4px_4px_0_#4a3f8a]">🔄 لعبة جديدة</button></div>
      </div>

      {/* بوابة حرفوش وحش الحروف */}
      <button
        onClick={() => setView('harfoosh')}
        className="group w-full bg-gradient-to-b from-[#6c5ce7] to-[#4a3f8a] text-white rounded-[24px_8px_24px_8px] border-[4px] border-double border-[#fdcb6e] p-5 shadow-[6px_6px_0_rgba(74,63,138,0.5)] hover:scale-[1.02] transition flex items-center justify-center gap-4"
      >
        <span className="text-5xl drop-shadow group-hover:animate-bounce">🐲</span>
        <div className="text-right">
          <div className="font-bold text-2xl leading-tight mb-1">حرفوش وحش الحروف</div>
          <div className="text-sm text-[#f0e6ff]">ادخل لعالم حرفوش السحري وأطعمه الحروف وابنِ الكلمات! ✨</div>
        </div>
        <span className="text-3xl group-hover:translate-x-1 transition">⬅️</span>
      </button>
    </div>
  );
};
