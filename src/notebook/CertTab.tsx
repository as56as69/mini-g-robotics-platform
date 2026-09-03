import React from 'react';
import { useNotebook } from './notebookContext';

/* كود ماجيك بالتفت — تبويب الشهادات
 * ============================================================
 */

export const CertTab: React.FC = () => {
  const { students, currentStudent, stars, completed } = useNotebook();
  const name = currentStudent?.name ?? 'الطفل البطل';
  const letters = completed.size;
  const total = 28;

  const starsDisplay = '⭐'.repeat(Math.min(stars, 20)) + (stars > 20 ? '...' : '');

  const printCert = () => window.print();

  const shareCert = async () => {
    const text = `🏛️ شهادة إنجاز من دفتر بغداد التفاعلي\n\n👶 ${name}\n📚 أتقن ${letters} حرفاً\n⭐ حصل على ${stars} نجمة\n\n🎉 ألف مبروك! استمر في التعلم!`;
    if (navigator.share) {
      try { await navigator.share({ title: 'شهادة إنجاز من دفتر بغداد', text }); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('📋 تم نسخ الشهادة! يمكنك مشاركتها');
      } catch {
        alert('📱 شارك الشهادة مع عائلتك!');
      }
    }
  };

  const downloadCert = () => {
    alert('⬇️ جاري تحميل الشهادة... (قريباً)');
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
      <div className="w-full bg-white rounded-[18px_5px_18px_5px] border-[6px] border-double border-[#6c5ce7] p-6 text-center shadow-[8px_8px_0_rgba(0,0,0,0.06)]">
        <div className="text-5xl mb-2">🏛️</div>
        <div className="text-3xl font-bold text-[#6c5ce7]">شهادة إنجاز</div>
        <div className="text-2xl font-bold text-[#2d3436] my-3 border-b-[3px] border-dashed border-[#fdcb6e] pb-2">{name}</div>
        <div className="text-sm text-[#636e72] leading-relaxed">
          أتم بنجاح تعلم <span className="font-bold text-[#2d3436]">{letters}</span> حرفاً<br />
          وحصل على <span className="font-bold text-[#2d3436]">{stars}</span> نجمة ⭐
        </div>
        <div className="text-2xl my-3 tracking-widest">{starsDisplay || '⭐'}</div>
        <div className="text-xs text-[#636e72] mt-3">🏛️ دفتر بغداد التفاعلي — بيئة تعليمية للروضة والأول الابتدائي</div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={printCert} className="font-bold px-5 py-2.5 bg-[#00b894] text-white rounded-[30px_8px_30px_8px] shadow-[4px_4px_0_#00917b]">🖨️ طباعة الشهادة</button>
        <button onClick={shareCert} className="font-bold px-5 py-2.5 bg-[#fdcb6e] text-[#6c5200] rounded-[30px_8px_30px_8px] shadow-[4px_4px_0_#f0a500]">📱 مشاركة</button>
        <button onClick={downloadCert} className="font-bold px-5 py-2.5 bg-[#74b9ff] text-white rounded-[30px_8px_30px_8px] shadow-[4px_4px_0_#4a8fd4]">⬇️ تحميل</button>
      </div>

      {students.length === 0 && (
        <div className="text-sm text-[#636e72]">💡 أضف طالباً في تبويب المعلم ليظهر اسمه في الشهادة</div>
      )}
    </div>
  );
};
