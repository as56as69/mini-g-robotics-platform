import React, { useMemo, useState } from 'react';
import { BAGHDADI_WORDS } from './data';
import { shuffle } from './utils';

/* كود ماجيك بالتفت — صفحة حرفوش وحش الحروف (داخلية داخل الألعاب)
 * ============================================================
 * صفحة سحرية دوّنها اللغة العربية فقط، بلا اتصال بالنجوم/الميداليات.
 * - نشاط 1: 🍽️ أطعم حرفوش (إكمال الكلمة الناقصة)
 * - نشاط 2: 📚 حرفوش يبني الكلمات (تجميع الحروف بالترتيب)
 */

interface Props {
  onBack: () => void;
}

/* حروف الكلمات العربية المستخدمة */
const ARABIC_LETTERS = Object.keys(BAGHDADI_WORDS);

const reactions = {
  idle: 'جائع! أطعموني حرفًا لذيذًا!',
  hungry: 'هممم... ما أكلت حرفًا اليوم!',
  chew: 'يم يم يم... لذيذ جدًا! 🎉',
  happy: 'رائع! شكرًا يا بطل! 🕺',
  sad: 'أوتش! هذا ليس صحيحًا... جرّب ثانية!',
};

const keyframes = `
@keyframes hf-jump { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-14px) rotate(-6deg)} }
@keyframes hf-wiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-10deg)} 75%{transform:rotate(10deg)} }
@keyframes hf-earl { 0%,100%{transform:rotate(-12deg)} 25%{transform:rotate(-28deg)} 75%{transform:rotate(12deg)} }
@keyframes hf-earr { 0%,100%{transform:rotate(12deg)} 25%{transform:rotate(28deg)} 75%{transform:rotate(-12deg)} }
`;
const jumpAnim = { animation: 'hf-jump 0.6s ease' };
const wiggleAnim = { animation: 'hf-wiggle 0.6s ease' };
const earLAnim = { animation: 'hf-earl 0.5s ease' };
const earRAnim = { animation: 'hf-earr 0.5s ease' };

export const HarfooshTab: React.FC<Props> = ({ onBack }) => {
  // ===== نشاط 1: أطعم حرفوش (إكمال الكلمة) =====
  const [feedWord, setFeedWord] = useState<string>('');
  const [feedEmoji, setFeedEmoji] = useState('🦁');
  const [feedMissing, setFeedMissing] = useState(0);
  const [feedOptions, setFeedOptions] = useState<string[]>([]);
  const [feedMsg, setFeedMsg] = useState('اختر الحرف الناقص ليطمّ حرفوش بطنو!');
  const [feedColor, setFeedColor] = useState('#636e72');
  const [feedSolved, setFeedSolved] = useState(false);

  const startFeed = () => {
    setMood('idle');
    const key = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
    const w = BAGHDADI_WORDS[key];
    const chars = w.word.split('');
    const idx = Math.floor(Math.random() * chars.length);
    const missing = chars[idx];
    setFeedWord(w.word);
    setFeedEmoji(w.emoji);
    setFeedMissing(idx);
    setFeedSolved(false);
    const others = ARABIC_LETTERS.filter((c) => c !== missing).slice(0, 3);
    setFeedOptions(shuffle([missing, ...others]));
    setFeedMsg(`ما هو الحرف الناقص في كلمة "${w.word.replace(missing, '؟')}"؟`);
    setFeedColor('#636e72');
  };

  const pickFeed = (opt: string): string => {
    if (feedSolved) return 'chew';
    const missing = feedWord.charAt(feedMissing);
    if (opt === missing) {
      setFeedSolved(true);
      setFeedMsg(`🍽️ صحيح! أكل حرفوش حرف "${missing}" وارتاح! الكلمة: ${feedWord} ${feedEmoji}`);
      setFeedColor('#00b894');
      return 'happy';
    } else {
      setFeedMsg(`😋 لا... حرفوش هزّ أذنيه! جرّب حرفًا آخر!`);
      setFeedColor('#ff6b6b');
      return 'sad';
    }
  };

  // ===== نشاط 2: حرفوش يبني الكلمات =====
  const [buildWord, setBuildWord] = useState<string>('');
  const [buildEmoji, setBuildEmoji] = useState('🦁');
  const [buildDisplay, setBuildDisplay] = useState<string[]>([]);
  const [buildTarget, setBuildTarget] = useState<string[]>([]);
  const [buildIdx, setBuildIdx] = useState(0);
  const [buildMsg, setBuildMsg] = useState('لمّس الحروف بالترتيب الصحيح ليأكلها حرفوش!');
  const [buildColor, setBuildColor] = useState('#636e72');
  const [buildSolved, setBuildSolved] = useState(false);

  const startBuild = () => {
    setMood('idle');
    const key = ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)];
    const w = BAGHDADI_WORDS[key];
    const chars = w.word.split('');
    setBuildWord(w.word);
    setBuildEmoji(w.emoji);
    setBuildTarget(chars);
    setBuildDisplay(shuffle([...chars]));
    setBuildIdx(0);
    setBuildSolved(false);
    setBuildMsg(`رتّب الحروف لبناء كلمة "${w.word}" ${w.emoji}`);
    setBuildColor('#636e72');
  };

  const pickBuild = (ch: string, origIdx: number): string => {
    if (buildSolved) return 'chew';
    if (buildDisplay[origIdx] === undefined) return 'chew';
    const expected = buildTarget[buildIdx];
    if (ch === expected) {
      setBuildDisplay((prev) => prev.map((p, i) => (i === origIdx ? '' : p)));
      const next = buildIdx + 1;
      setBuildIdx(next);
      if (next >= buildTarget.length) {
        setBuildSolved(true);
        setBuildMsg(`🎉 رائع! بنيت كلمة "${buildWord}" ${buildEmoji} وأكلها حرفوش!`);
        setBuildColor('#00b894');
        return 'happy';
      } else {
        setBuildMsg(`👍 أحسنت! اختر التالي (${next + 1}/${buildTarget.length})`);
        setBuildColor('#fdcb6e');
        return 'chew';
      }
    } else {
      setBuildMsg('😋 لا، هذا ليس الحرف التالي!');
      setBuildColor('#ff6b6b');
      return 'sad';
    }
  };

  // ===== تفاعل الشخصية =====
  const [mood, setMood] = useState<string>('idle');
  const currentMood = useMemo(() => {
    if (mood === 'chew' || mood === 'happy') return mood === 'happy' ? reactions.happy : reactions.chew;
    if (mood === 'sad') return reactions.sad;
    if (mood === 'hungry') return reactions.hungry;
    return reactions.idle;
  }, [mood]);

  const handleFeedGood = (opt: string) => {
    setMood(pickFeed(opt)); // الصحيحة: happy، الخطأ: sad
  };

  const handleBuildGood = (ch: string, i: number) => {
    setMood(pickBuild(ch, i)); // الصحيحة: happy/chew، الخطأ: sad
  };

  const charAnim = mood === 'sad' ? wiggleAnim : mood === 'chew' || mood === 'happy' ? jumpAnim : undefined;
  const earLeft = mood === 'sad' ? earLAnim : undefined;
  const earRight = mood === 'sad' ? earRAnim : undefined;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <style>{keyframes}</style>
      {/* شريط علوي: رجوع + عنوان */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="font-bold px-4 py-2 bg-white text-[#6c5ce7] rounded-[30px_8px_30px_8px] border-[3px] border-[#6c5ce7]/40 hover:bg-[#6c5ce7]/10 transition"
        >
          ↩️ رجوع للألعاب
        </button>
        <h2 className="font-bold text-xl text-[#6c5ce7]">🐲 عالم حرفوش السحري</h2>
      </div>

      {/* بطاقة الشخصية */}
      <div className="bg-white rounded-[24px_8px_24px_8px] border-[3px] border-dashed border-[#6c5ce7] p-5 shadow-[5px_5px_0_rgba(0,0,0,0.06)] flex flex-col items-center gap-3 text-center">
        {/* جسم حرفوش (CSS + Emoji) */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32" style={charAnim}>
          {/* الأذنان */}
          <div className="absolute -top-1 -left-2 w-10 h-14 bg-[#a29bfe] rounded-[100%_20%_50%_50%/100%_80%_40%_40%] -rotate-12 border-[3px] border-[#6c5ce7]" style={earLeft} />
          <div className="absolute -top-1 -right-2 w-10 h-14 bg-[#a29bfe] rounded-[20%_100%_50%_50%/80%_100%_40%_40%] rotate-12 border-[3px] border-[#6c5ce7]" style={earRight} />
          {/* القرن */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#fdcb6e] rounded-full border-[3px] border-[#6c5ce7] flex items-center justify-center">⭐</div>
          {/* الجسم */}
          <div className="absolute inset-2 bg-[#6c5ce7] rounded-[48%_48%_45%_45%/50%_50%_45%_45%] border-[3px] border-[#4a3f8a] shadow-[inset_0_-8px_0_rgba(0,0,0,0.15)] flex items-center justify-center">
            {/* العينان */}
            <div className="absolute top-[28%] left-[22%] w-5 h-6 bg-white rounded-full border-2 border-[#2d3436] flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#2d3436] rounded-full" />
            </div>
            <div className="absolute top-[28%] right-[22%] w-5 h-6 bg-white rounded-full border-2 border-[#2d3436] flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#2d3436] rounded-full" />
            </div>
            {/* الفم المفتوح (جاهز للأكل) */}
            <div className="absolute bottom-[14%] w-9 h-5 bg-[#4a3f8a] rounded-b-[100%] border-2 border-[#2d3436] flex items-center justify-center">
              <span className="text-[10px]">🦷</span>
            </div>
          </div>
          {/* الحقيبة */}
          <div className="absolute -bottom-3 -right-3 text-3xl drop-shadow" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>🎒</div>
        </div>

        <div className="font-bold text-2xl text-[#6c5ce7]">حرفوش وحش الحروف 🐲</div>
        <p className="text-sm text-[#636e72] max-w-md leading-relaxed">
          حرفوش وحش لطيف يعيش في حديقة الحروف السحرية قرب نهر دجلة. هو لا يأكل الطعام العادي،
          بل <b className="text-[#2d3436]">يأكل الحروف والكلمات!</b> أطعمه حرفًا صحيحًا فيفرح ويرقص 🕺،
          وإن أخطأت يهزّ أذنيه بلطف ويقول: "جرّب ثانية!"
        </p>
        <div className="text-2xl">🥳 <span className="text-2xl">🕺</span> <span className="text-2xl">🎈</span></div>
      </div>

      {/* معرف الحالة */}
      <div className="bg-[#f0e6ff] border-2 border-dashed border-[#6c5ce7]/50 rounded-[20px_6px_20px_6px] px-4 py-3 text-center font-bold text-[#6c5ce7]">
        {currentMood}
      </div>

      {/* ====== نشاط 1: أطعم حرفوش ====== */}
      <div className="bg-white rounded-[18px_5px_18px_5px] border-[3px] border-dashed border-[#d4b8a0] p-4 shadow-[5px_5px_0_rgba(0,0,0,0.06)]">
        <h3 className="font-bold text-lg text-[#2d3436] mb-2">🍽️ أطعم حرفوش</h3>
        <div className="flex flex-wrap items-center justify-center gap-3 min-h-[70px]">
          <span className="text-5xl">{feedEmoji}</span>
          <span className="text-4xl font-bold text-[#6c5ce7]" dir="rtl">
            {feedWord.split('').map((c, i) =>
              i === feedMissing ? (
                <span key={i} className="w-8 inline-block border-b-4 border-dotted border-[#6c5ce7] mx-1 text-center">{feedSolved ? c : '؟'}</span>
              ) : (
                <span key={i}>{c}</span>
              )
            )}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-3">
          {feedOptions.map((o) => (
            <button
              key={o}
              onClick={() => handleFeedGood(o)}
              className="font-bold text-xl px-5 py-2 bg-[#f8f4f0] text-[#2d3436] border-[3px] border-[#d4b8a0] shadow-[3px_3px_0_#e6d6c2] rounded-[30px_8px_30px_8px] hover:border-[#6c5ce7] transition"
            >
              {o}
            </button>
          ))}
        </div>
        <div className="text-center text-sm font-bold my-2" style={{ color: feedColor }}>{feedMsg}</div>
        <div className="text-center">
          <button onClick={startFeed} className="font-bold px-5 py-2 bg-[#6c5ce7] text-white rounded-[30px_8px_30px_8px] shadow-[4px_4px_0_#4a3f8a]">🔄 لعبة جديدة</button>
        </div>
      </div>

      {/* ====== نشاط 2: حرفوش يبني الكلمات ====== */}
      <div className="bg-white rounded-[18px_5px_18px_5px] border-[3px] border-dashed border-[#d4b8a0] p-4 shadow-[5px_5px_0_rgba(0,0,0,0.06)]">
        <h3 className="font-bold text-lg text-[#2d3436] mb-2">📚 حرفوش يبني الكلمات</h3>
        <div className="flex flex-wrap items-center justify-center gap-3 min-h-[70px]">
          <span className="text-5xl">{buildEmoji}</span>
          <div className="flex flex-wrap gap-2 justify-center">
            {buildDisplay.map((ch, i) =>
              ch ? (
                <button key={`${ch}-${i}`} onClick={() => handleBuildGood(ch, i)} className="font-bold text-xl w-11 h-11 bg-[#f8f4f0] text-[#2d3436] border-[3px] border-[#d4b8a0] shadow-[3px_3px_0_#e6d6c2] rounded-[50%_25%_50%_25%] hover:border-[#6c5ce7] transition">
                  {ch}
                </button>
              ) : (
                <span key={i} className="w-11 h-11 flex items-center justify-center text-green-600 text-xl">✅</span>
              )
            )}
          </div>
        </div>
        {/* الكلمة المبنية */}
        <div className="flex flex-wrap justify-center gap-1 mt-3 min-h-[40px]">
          {buildTarget.map((c, i) => (
            <span key={i} className="font-bold text-3xl text-[#00b894]" style={{ display: i < buildIdx ? 'inline' : 'none' }}>{c}</span>
          ))}
        </div>
        <div className="text-center text-sm font-bold my-2" style={{ color: buildColor }}>{buildMsg}</div>
        <div className="text-center">
          <button onClick={startBuild} className="font-bold px-5 py-2 bg-[#6c5ce7] text-white rounded-[30px_8px_30px_8px] shadow-[4px_4px_0_#4a3f8a]">🔄 لعبة جديدة</button>
        </div>
      </div>
    </div>
  );
};
