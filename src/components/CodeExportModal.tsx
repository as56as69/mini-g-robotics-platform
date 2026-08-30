import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Download, Code, Cpu, Copy, Check, FileCode, Play, Sparkles } from 'lucide-react';
import { pinoutManager } from '../ble/PinoutManager';
import { safetyManager } from '../ble/SafetyManager';

interface Props {
  model: RobotModelType;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    // Fallback for older / non-secure contexts
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export const CodeExportModal: React.FC<Props> = ({ model }) => {
  const [lang, setLang] = useState<'cpp' | 'python'>('cpp');
  const [copied, setCopied] = useState(false);
  const [exportBlocked, setExportBlocked] = useState(false);
  const modelInfo = ROBOT_MODELS[model];
  const pins = pinoutManager.get(model);

  const isExportAllowed = () => {
    const allowed = safetyManager.get().studentCodeExportAllowed;
    if (!allowed) {
      setExportBlocked(true);
      setTimeout(() => setExportBlocked(false), 2200);
    }
    return allowed;
  };

  const getSourceCode = () => {
    if (lang === 'cpp') {
      if (model === 'mini_gf') {
        return `// Mini G-F (Keychain Companion) - Arduino C++ Firmware
#include <BLEDevice.h>
#include <BLEServer.h>

#define PIN_HAPTIC ${pins.pinHaptic}
#define PIN_TOUCH  ${pins.pinTouch}
#define PIN_RGB    ${pins.pinLed}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_HAPTIC, OUTPUT);
  BLEDevice::init("Mini-G-F Keychain");
  Serial.println("Mini G-F Ready for Live BLE Control!");
}

void loop() {
  if (touchRead(PIN_TOUCH) < 30) {
    digitalWrite(PIN_HAPTIC, HIGH);
    delay(100);
    digitalWrite(PIN_HAPTIC, LOW);
  }
  delay(50);
}`;
      } else if (model === 'mini_gm') {
        return `// Mini G-M (Desktop Companion) - Arduino C++ Firmware
#include <BLEDevice.h>
#include <ESP32Servo.h>

#define PIN_SERVO  ${pins.pinServo}
#define PIN_BUZZER ${pins.pinBuzzer}

Servo neckServo;

void setup() {
  Serial.begin(115200);
  neckServo.attach(PIN_SERVO);
  neckServo.write(90);
  BLEDevice::init("Mini-G-M Desktop");
  Serial.println("Mini G-M Desktop Companion Active!");
}

void loop() {
  delay(100);
}`;
      } else {
        return `// Mini G (Humanoid AI Robot) - Arduino C++ Firmware
#include <BLEDevice.h>
#include <ESP32Servo.h>

#define PIN_MOTOR_L ${pins.pinMotorL}
#define PIN_MOTOR_R ${pins.pinMotorR}
#define PIN_ARM_L   ${pins.pinArmL}
#define PIN_ARM_R   ${pins.pinArmR}

Servo armLeft, armRight;

void setup() {
  Serial.begin(115200);
  armLeft.attach(PIN_ARM_L);
  armRight.attach(PIN_ARM_R);
  BLEDevice::init("Mini-G AI Robot");
  Serial.println("Mini G Humanoid Ready for STEM Classrooms!");
}

void loop() {
  delay(50);
}`;
      }
    } else {
      // MicroPython template
      return `# Mini G Platform - MicroPython Script for ${modelInfo.name}
import bluetooth
import time
from machine import Pin, PWM

print("Initializing ${modelInfo.name} on MicroPython...")
# BLE GATT Setup & Live Command Loop
led = Pin(2, Pin.OUT)
led.value(1)
print("Connected to Mini G Live Studio!")
`;
    }
  };

  const handleCopy = async () => {
    if (!isExportAllowed()) return;
    const copiedOk = await copyTextToClipboard(getSourceCode());
    if (copiedOk) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!isExportAllowed()) return;
    const code = getSourceCode();
    const ext = lang === 'cpp' ? 'ino' : 'py';
    const filename = `${model}_firmware.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Delay revoking so strict browsers do not cancel the download
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs md:text-sm text-slate-200">
            توليد كود الفريم وير والرفع للـ ESP32
          </span>
        </div>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setLang('cpp')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
              lang === 'cpp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            C++ / Arduino
          </button>
          <button
            onClick={() => setLang('python')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
              lang === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            MicroPython
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="relative bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-emerald-400 border border-slate-800/80 overflow-x-auto max-h-40">
        <pre>{getSourceCode()}</pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 left-2 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
          title="نسخ الكود"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[10px] text-slate-400">
          متوافق مع شرائح: ESP32-C3 / S3 / WROOM
        </span>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition active:scale-95 shadow"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تحميل ملف الفريم وير (.ino)</span>
        </button>
      </div>
    </div>
  );
};
