import React from 'react';
import { RobotModelType } from '../types/robot';
import { pinoutManager, MODEL_PIN_SIDES, type PinoutMap } from '../ble/PinoutManager';

interface Props {
  model: RobotModelType;
}

const PIN_META: Record<keyof PinoutMap, { icon: string; label: string; sub: string; color: string }> = {
  pinLed: { icon: '🔴', label: 'ليد RGB', sub: 'WS2812B Data', color: '#f472b6' },
  pinHaptic: { icon: '📳', label: 'الهزاز', sub: 'Haptic Motor', color: '#fbbf24' },
  pinTouch: { icon: '👆', label: 'حساس لمس', sub: 'Touch Pad', color: '#34d399' },
  pinServo: { icon: '🤖', label: 'سيرفو الرأس', sub: 'PWM', color: '#a78bfa' },
  pinBuzzer: { icon: '🎵', label: 'مكبر الصوت', sub: 'Buzzer', color: '#fb923c' },
  pinMotorL: { icon: '🚗', label: 'محرك يسار', sub: 'L298N', color: '#60a5fa' },
  pinMotorR: { icon: '🚗', label: 'محرك يمين', sub: 'L298N', color: '#3b82f6' },
  pinArmL: { icon: '🦾', label: 'ذراع يسار', sub: 'Servo', color: '#c084fc' },
  pinArmR: { icon: '🦾', label: 'ذراع يمين', sub: 'Servo', color: '#8b5cf6' },
};

/**
 * Interactive ESP32 wiring schematic — GPIO labels are LIVE from
 * pinoutManager, so any change in the "المنافذ" tab is reflected instantly.
 * Duplicated pins get a red conflict badge.
 */
export const PinoutSchematic: React.FC<Props> = ({ model }) => {
  const pins = pinoutManager.get(model);
  const list = MODEL_PIN_SIDES[model];

  // Detect duplicate pin values among this model's active fields
  const seen = new Map<string, string[]>();
  for (const p of list) {
    const v = String(pins[p.field] || '').trim();
    if (!v) continue;
    seen.set(v, [...(seen.get(v) || []), p.field]);
  }
  const conflicts = [...seen.entries()].filter(([, fs]) => fs.length > 1);
  const conflictSet = new Set(conflicts.flatMap(([, fs]) => fs));

  const chipX = 140;
  const chipY = 20;
  const chipW = 80;
  const rowH = 46;
  const chipH = 30 + list.length * rowH;
  const H = chipY + chipH + (conflicts.length ? 44 : 14);

  const chipName = model === 'mini_gf' ? 'ESP32-C3' : model === 'mini_gm' ? 'WROOM-32' : 'ESP32-S3';

  return (
    <div className="w-full flex flex-col items-center gap-1">
      <svg viewBox={`0 0 360 ${H}`} className="w-full max-w-md h-auto">
        {/* chip body */}
        <rect x={chipX} y={chipY} width={chipW} height={chipH} rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <text x={chipX + chipW / 2} y={chipY + 16} textAnchor="middle" fontSize="10" fill="#38bdf8" fontFamily="monospace" fontWeight="bold">
          {chipName}
        </text>

        {list.map((p, i) => {
          const y = chipY + 34 + i * rowH;
          const meta = PIN_META[p.field];
          const value = String(pins[p.field] || '').trim() || '?';
          const isConflict = conflictSet.has(p.field);
          const left = p.side === 'left';
          const stubX1 = left ? chipX - 14 : chipX + chipW;
          const stubX2 = left ? chipX : chipX + chipW + 14;
          const labelX = left ? 10 : 350;
          const labelAnchor = left ? 'start' : 'end';
          return (
            <g key={p.field}>
              {/* pin stub */}
              <line
                x1={stubX1}
                y1={y}
                x2={stubX2}
                y2={y}
                stroke={meta?.color || '#475569'}
                strokeWidth="2.5"
              />
              {/* wire to component label */}
              <line
                x1={stubX2}
                y1={y}
                x2={labelX}
                y2={y}
                stroke={meta?.color || '#475569'}
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity="0.7"
              />
              {/* GPIO number near the chip */}
              <text
                x={left ? chipX - 18 : chipX + chipW + 18}
                y={y + 4}
                textAnchor={left ? 'end' : 'start'}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                fill={isConflict ? '#fb7185' : '#38bdf8'}
              >
                GPIO {value}
              </text>
              {/* component label */}
              <text
                x={labelX}
                y={y + 4}
                textAnchor={left ? 'start' : 'end'}
                fontSize="10"
                fill="#cbd5e1"
              >
                {meta?.icon} {meta?.label}
              </text>
            </g>
          );
        })}
      </svg>

      {conflicts.length > 0 && (
        <div className="text-[10px] text-rose-300 font-bold bg-rose-500/10 border border-rose-500/40 rounded-lg px-2 py-1">
          ⚠ تعارض: المنفذ {conflicts.map(([v]) => v).join(' و ')} مستخدَم أكثر من مرة!
        </div>
      )}
    </div>
  );
};
