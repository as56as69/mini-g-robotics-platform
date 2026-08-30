import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, X, LogIn, ArrowRight } from 'lucide-react';
import type { StudentProfile } from '../types/lms';
import { schoolApi } from '../services/schoolApi';

interface Props {
  onLinked: (student: StudentProfile, className: string) => void;
  onClose: () => void;
}

export const StudentLoginModal: React.FC<Props> = ({ onLinked, onClose }) => {
  const [joinCode, setJoinCode] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!joinCode.trim() || !loginCode.trim()) {
      setError('أدخل رقم الشعبة ورمز الدخول من بطاقتك');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { student, className } = await schoolApi.login(joinCode.trim(), loginCode.trim());
      const session = { student, className, at: Date.now() };
      try {
        localStorage.setItem('mg_student_session', JSON.stringify(session));
      } catch { /* storage unavailable — session is in-memory only */ }
      onLinked(student, className);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر التحقق من الرمز');
      setLoading(false);
    }
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[2147483000] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 p-5 relative select-text"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">دخول المهندس الصغير 🎫</h3>
              <p className="text-[11px] text-slate-400">لِتُحسب لك نجومك ونقاطك في سجلك المشترك</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 transition" title="إغلاق" type="button">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">رقم الشعبة (4 أرقام على لوحة الفصل)</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              dir="ltr"
              value={joinCode}
              onChange={e => { e.stopPropagation(); setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
              onKeyDown={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              placeholder="2048"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-center font-mono text-lg text-slate-100 focus:outline-none focus:border-amber-400 select-text"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">رمز الدخول من بطاقتك (MG-####)</label>
            <input
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              dir="ltr"
              value={loginCode}
              onChange={e => { e.stopPropagation(); setLoginCode(e.target.value.toUpperCase().slice(0, 9)); }}
              onKeyDown={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              placeholder="MG-1723"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-center font-mono text-lg text-amber-300 focus:outline-none focus:border-amber-400 select-text"
            />
          </div>

          <div className="text-[10px] text-slate-500 leading-relaxed rounded-xl bg-slate-950 border border-slate-800 p-2.5">
            💡 الرمزان مطبوعان على بطاقة المهندس الصغير: رقم الشعبة في أعلاها، ورمز الدخول بجانب الإيموجيات السرية. اطلب مساعدة المدرب إن لم تجدهما.
          </div>

          {error && (
            <div className="text-[11px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 disabled:opacity-60 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                جارِ التحقق…
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                دخول إلى سجلي المشترك
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};