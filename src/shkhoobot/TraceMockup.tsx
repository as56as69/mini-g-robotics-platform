import React from 'react';
import { INK } from '../design/tokens';
import { ScribbleItem } from './ScribbleRenderer';

/* ============================================================
 * كود ماجيك — «شخبط وياي» ✏️ (عرض تصميمي ثابت — Mockup)
 *
 * الوضع الحالي: المعاينة التصميمية فقط. لُعبت التفاعلية السابقة
 * (Canvas 2D + نقاط الفحص) أُزيلت مؤقتًا بسبب فشل المحاولات،
 * وسيُعاد تطويرها لاحقًا. هنا نعرض شكل المنتج النهائي المطلوب:
 *   1) دليل الخطوط المنقط لنفس strokes العنصر المختار.
 *   2) شريط رسالة علوي يشجّع التتبع (تصميم فقط).
 * بلا كانفس، بلا أحداث لمس/مؤشر، بلا نسبة، بلا زر — كله pointer-events-none.
 * ============================================================
 */

const VIEW = 200;
const GUIDE_COLOR = '#a0aec0';
const GUIDE_WIDTH = 4;

interface Props {
  item: ScribbleItem;
  className?: string;
}

export const TraceMockup: React.FC<Props> = ({ item, className = '' }) => (
  <div className={className} dir="ltr" aria-label={`معاينة تصميم «${item.labelAr}»`}>
    {/* دليل الخطوط المنقط — خلفية بلا تفاعل (تصميم فقط) */}
    <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 1 }}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        aria-hidden="true"
      >
        <g
          fill="none"
          stroke={GUIDE_COLOR}
          strokeWidth={GUIDE_WIDTH}
          strokeDasharray="7 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {item.strokes.map((d, i) => {
            if (d.startsWith('circle:')) {
              return d.split(' ').map((seg, j) => {
                const [cx, cy, r] = seg.slice(7).split(',').map(Number);
                return <circle key={`g${i}-${j}`} cx={cx} cy={cy} r={r} />;
              });
            }
            return <path key={`g${i}`} d={d} />;
          })}
        </g>
      </svg>
    </div>

    {/* رسالة الحالة العلوية — تصميم فقط */}
    <div
      className="absolute top-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none doodle-title text-xs font-bold px-2 py-0.5 bg-[#ffecc2] border-2"
      style={{
        color: INK,
        borderRadius: '10px 14px 10px 14px',
        borderColor: INK,
        boxShadow: '2px 3px 0 rgba(43,42,51,0.2)',
      }}
      aria-hidden="true"
    >
      اتّبع الخطوط المنقطة بقلمك 🖍️
    </div>
  </div>
);