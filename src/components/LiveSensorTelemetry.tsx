import React, { useState, useEffect } from 'react';
import { RobotModelType, RobotState } from '../types/robot';
import { Activity, Gauge, Eye, Zap, Radio, Thermometer } from 'lucide-react';

interface Props {
  model: RobotModelType;
  state: RobotState;
}

export const LiveSensorTelemetry: React.FC<Props> = ({ model, state }) => {
  const [history, setHistory] = useState<number[]>([40, 45, 52, 60, 58, 65, 70, 75, 72, 80]);
  const [distance, setDistance] = useState(25);
  const [batteryVolt, setBatteryVolt] = useState(4.12);
  const [rssiVal, setRssiVal] = useState(-62);

  useEffect(() => {
    const interval = setInterval(() => {
      // Generate realistic fluctuation for demonstration
      const nextVal = Math.floor(30 + Math.random() * 60);
      setHistory(prev => [...prev.slice(-15), nextVal]);
      setDistance(Math.floor(15 + Math.random() * 40));
      setBatteryVolt(Number((4.05 + Math.random() * 0.15).toFixed(2)));
      setRssiVal(-60 - Math.floor(Math.random() * 10));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold text-xs md:text-sm text-slate-200">
            لوحة المستشعرات وقراءات الـ Telemetry الحية
          </span>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
          LIVE STREAM 📡
        </span>
      </div>

      {/* Sensor Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Sensor 1: Distance / Obstacle */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>حساس المسافة ToF</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-black text-cyan-300 mt-1">{distance} <span className="text-[10px] font-normal text-slate-400">سم</span></div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${Math.min(100, distance * 2)}%` }} />
          </div>
        </div>

        {/* Sensor 2: Battery Voltage */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>جهد البطارية LiPo</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-300 mt-1">{batteryVolt} <span className="text-[10px] font-normal text-slate-400">V</span></div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: `${((batteryVolt - 3.3) / 0.9) * 100}%` }} />
          </div>
        </div>

        {/* Sensor 3: BLE Signal RSSI */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>قوة الإشارة RSSI</span>
            <Radio className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-black text-purple-300 mt-1">{rssiVal} <span className="text-[10px] font-normal text-slate-400">dBm</span></div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
            <div className="bg-purple-400 h-full rounded-full" style={{ width: `${Math.max(10, 100 + rssiVal)}%` }} />
          </div>
        </div>

        {/* Sensor 4: ESP32 Chip Temp */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>حرارة المعالج</span>
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-black text-rose-300 mt-1">38.4 <span className="text-[10px] font-normal text-slate-400">°C</span></div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
            <div className="bg-rose-400 h-full rounded-full" style={{ width: '45%' }} />
          </div>
        </div>
      </div>

      {/* Real-time mini SVG Sparkline */}
      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>مخطط نشاط الحساسات الزمني اللحظي (Sparkline):</span>
          <span className="font-mono text-emerald-400">{history[history.length - 1]}% Load</span>
        </div>
        <div className="h-14 w-full flex items-end gap-1 px-1">
          {history.map((val, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t transition-all duration-300 hover:brightness-125"
              style={{ height: `${val}%` }}
              title={`قيمة: ${val}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
