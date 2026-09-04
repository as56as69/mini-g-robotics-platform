import React, { useEffect, useMemo, useRef, useState } from 'react';
import rough from 'roughjs';
import { BAGHDADI_WORDS } from './data';
import { shuffle } from './utils';

/* كود ماجيك بالتفت — صفحة حرفوش وحش الحروف (داخلية داخل الألعاب)
 * ============================================================
 * صفحة سحرية دوّنها اللغة العربية فقط، بلا اتصال بالنجوم/الميداليات.
 * - نشاط 1: 🍽️ أطعم حرفوش (إكمال الكلمة الناقصة)
 * - نشاط 2: 📚 حرفوش يبني الكلمات (تجميع الحروف بالترتيب)
 * الشخصية: وحش خربشاتي "مستر شخبوط" بأسلوب كود ماجيك + تعزيز rough.js
 *           وعيناه تتبعان المؤشر/الإصبع.
 */

interface Props {
  onBack: () => void;
}

/* حروف الكلمات العربية المستخدمة */
const ARABIC_LETTERS = Object.keys(BAGHDADI_WORDS);

/* ── هيلبرز الرسم اليدوي (ببذرة ثابتة = شكل خربشة ثابت) ── */
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** جسم blob غير منتظم (خربشة عضوية كـ"مستر شخبوط") — مسار مغلق قابل للتعبئة */
function makeBlobPath(seed: number, cx: number, cy: number, radius: number, n = 10): string {
  const rnd = seededRandom(seed);
  const pts: Array<[number, number]> = [];
  let angle = rnd() * Math.PI * 2;
  let rad = radius * (0.5 + rnd() * 0.5);
  const step = (Math.PI * 2) / n;
  for (let i = 0; i < n; i++) {
    angle += (rnd() - 0.5) * 2.4 + step;
    rad = Math.max(radius * 0.28, Math.min(radius, rad + (rnd() - 0.45) * 26));
    pts.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;
    d += ` Q${p0[0].toFixed(1)} ${p0[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  d += ' Z';
  return d;
}

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
`;
const jumpAnim = { animation: 'hf-jump 0.6s ease' };
const wiggleAnim = { animation: 'hf-wiggle 0.6s ease' };

/* ── ألوان الهوية (لصق من كود ماجيك + حرفوش) ── */
const INK = '#2b2a33';
const BODY = '#6c5ce7';
const EAR = '#a78bfa';
const CRAYON = '#ffd93d';
const PAPER = '#fffdf7';

/* ── شخصية حرفوش: وحش خربشاتي SVG (blob ببذرة) + rough.js + عينان تتبعان ── */
const HarfooshFigure: React.FC<{ mood: string }> = ({ mood }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const roughRef = useRef<SVGGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pupilL, setPupilL] = useState({ x: -3, y: 2 });
  const [pupilR, setPupilR] = useState({ x: 3, y: 2 });

  // عينا الشخصية (مركزاهما داخل viewBox)
  const eyeL = { x: 62, y: 63, r: 13 };
  const eyeR = { x: 98, y: 63, r: 13 };

  // رسم الجسم/الخربشة مرة واحدة بـ rough.js (ببذرة ثابتة = ثبات الشكل)
  useEffect(() => {
    const svg = svgRef.current;
    const anchor = roughRef.current;
    if (!svg || !anchor) return;
    const rc = rough.svg(svg);
    const bodyPath = makeBlobPath(234567, 80, 86, 52);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const opt = (o: Record<string, unknown>) => ({ seed: 987654, roughness: 1.5, bowing: 1.1, ...o });

    // الأذنان (خلف الجسم)
    group.appendChild(rc.ellipse(42, 30, 20, 34, opt({ fill: EAR, fillStyle: 'cross-hatch', stroke: INK, strokeWidth: 3 })));
    group.appendChild(rc.ellipse(118, 30, 20, 34, opt({ fill: EAR, fillStyle: 'cross-hatch', stroke: INK, strokeWidth: 3, seed: 34567 })));
    // القرن الشمعي
    group.appendChild(rc.path('M72 26 L80 4 L90 28 Z', opt({ fill: CRAYON, fillStyle: 'hachure', stroke: INK, strokeWidth: 2.6, seed: 111 })));
    // الجسم blob
    group.appendChild(rc.path(bodyPath, opt({ fill: BODY, fillStyle: 'hachure', stroke: INK, strokeWidth: 3.2, seed: 222 })));
    // بياض العينين (خربشة)
    group.appendChild(rc.ellipse(eyeL.x, eyeL.y, eyeL.r * 2, eyeL.r * 2, opt({ fill: PAPER, fillStyle: 'solid', stroke: INK, strokeWidth: 2.6, seed: 333 })));
    group.appendChild(rc.ellipse(eyeR.x, eyeR.y, eyeR.r * 2, eyeR.r * 2, opt({ fill: PAPER, fillStyle: 'solid', stroke: INK, strokeWidth: 2.6, seed: 444 })));
    // وردتان خدّ
    group.appendChild(rc.circle(42, 86, 9, opt({ fill: '#ff8fab80', fillStyle: 'zigzag', stroke: INK, strokeWidth: 1.6, seed: 555 })));
    group.appendChild(rc.circle(118, 86, 9, opt({ fill: '#ff8fab80', fillStyle: 'zigzag', stroke: INK, strokeWidth: 1.6, seed: 666 })));
    // الفم الواسع "للأكل"
    group.appendChild(rc.path('M56 96 Q80 122 104 96 Q92 106 80 106 Q68 106 56 96 Z', opt({ fill: '#4a3f8a', fillStyle: 'solid', stroke: INK, strokeWidth: 2.8, seed: 777 })));
    // أسنان بسيطة
    group.appendChild(rc.line(72, 100, 72, 108, opt({ stroke: PAPER, strokeWidth: 2.4, seed: 888 })));
    group.appendChild(rc.line(80, 102, 80, 110, opt({ stroke: PAPER, strokeWidth: 2.4, seed: 999 })));
    group.appendChild(rc.line(88, 100, 88, 108, opt({ stroke: PAPER, strokeWidth: 2.4, seed: 1234 })));

    anchor.appendChild(group);
    return () => { anchor.removeChild(group); };
  }, []);

  // تتبع المؤشر/الإصبع — البؤبؤان يتحركان داخل العينين
  const handlePointer = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap) return;
    const rect = svg.getBoundingClientRect();
    const VW = 160, VH = 150;
    const px = ((e.clientX - rect.left) / rect.width) * VW;
    const py = ((e.clientY - rect.top) / rect.height) * VH;
    const shift = (cx: number, cy: number) => {
      const dx = px - cx, dy = py - cy;
      const dist = Math.hypot(dx, dy);
      const max = eyeL.r - 5;
      const k = dist > max ? max / (dist || 1) : 1;
      return { x: dx * k, y: dy * k };
    };
    setPupilL(shift(eyeL.x, eyeL.y));
    setPupilR(shift(eyeR.x, eyeR.y));
  };

  const bodyAnim = mood === 'sad' ? wiggleAnim : mood === 'chew' || mood === 'happy' ? jumpAnim : undefined;

  return (
    <div ref={wrapRef} onPointerMove={handlePointer} className="relative inline-block w-40 h-auto select-none" style={{ touchAction: 'pan-y' }}>
      <svg ref={svgRef} viewBox="0 0 160 150" className="w-full h-auto drop-shadow-sm" style={bodyAnim}>
        {/* تُلحق أشكال rough.js هنا (خلف البؤبؤين) */}
        <g ref={roughRef} />
        {/* البؤبؤان (فوق كل شيء) */}
        <circle cx={eyeL.x + pupilL.x} cy={eyeL.y + pupilL.y} r="4.6" fill={INK} />
        <circle cx={eyeR.x + pupilR.x} cy={eyeR.y + pupilR.y} r="4.6" fill={INK} />
        <circle cx={eyeL.x + pupilL.x - 1.4} cy={eyeL.y + pupilL.y - 1.4} r="1.6" fill="#ffffff" />
        <circle cx={eyeR.x + pupilR.x - 1.4} cy={eyeR.y + pupilR.y - 1.4} r="1.6" fill="#ffffff" />
      </svg>
      <span className="absolute -top-2 -right-3 text-xl" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>🎒</span>
    </div>
  );
};

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

      {/* بطاقة الشخصية — ورقي/خربشاتي */}
      <div
        className="bg-[#fffdf7] rounded-[30px_12px_32px_10px/18px_8px_20px_12px] border-[3px] border-dashed border-[#6c5ce7] p-5 shadow-[6px_6px_0_rgba(0,0,0,0.06)] flex flex-col items-center gap-3 text-center"
        style={{ transform: 'rotate(-1deg)' }}
      >
        {/* هالة شمعية خلف الشخصية */}
        <div className="relative w-44 h-auto">
          <div className="absolute -inset-3 bg-[#ffd93d]/40 rounded-[60%_50%_55%_45%/50%_60%_45%_55%] -rotate-6" aria-hidden />
          <HarfooshFigure mood={mood} />
        </div>

        <div className="font-black text-2xl text-[#6c5ce7]" style={{ fontFamily: "'Cairo Play', Cairo, sans-serif" }}>حرفوش وحش الحروف 🐲</div>
        <p className="text-sm text-[#636e72] max-w-md leading-relaxed">
          حرفوش وحش لطيف مرسوم بالخربشة، يعيش في حديقة الحروف السحرية قرب نهر دجلة.
          هو لا يأكل الطعام العادي، بل <b className="text-[#2d3436]">يأكل الحروف والكلمات!</b> أطعمه حرفًا
          صحيحًا فيفرح ويرقص 🕺، وإن أخطأت يهزّ أذنيه بلطف ويقول: "جرّب ثانية!"
        </p>
        <div className="text-2xl">🥳 <span className="text-2xl">🕺</span> <span className="text-2xl">🎈</span></div>
        <div className="text-[11px] text-[#a78bfa] font-bold">👀 حرّك إصبعك فوق حرفوش — عيناه تتّبعانك!</div>
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
