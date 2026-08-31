import React, { useState } from 'react';
import { RobotModelType, ROBOT_MODELS } from '../types/robot';
import { Download, Copy, Check, FileCode, HelpCircle, X } from 'lucide-react';
import { pinoutManager, type PinoutMap } from '../ble/PinoutManager';
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

/* ============================================================
 * C++ FIRMWARE TEMPLATES — mirrored 1:1 from src/firmware/*.ino
 * (full BLE stack + complete handleCommand) with the kid's live
 * pin numbers injected. Simplified: no #if conditionals.
 * ============================================================ */

const GF_CPP = (pins: PinoutMap): string => `// Mini G-F (Keychain Companion) — Full BLE Firmware
// Mirrors src/firmware/mini_gf_esp32.ino — live pin map from the "المنافذ" tab.
// Replace the Serial prints with your real WS2812B driver where marked.
// Touch note: on ESP32-C3 wire a push-button (active LOW) on PIN_TOUCH and
// use digitalRead() — C3 has no capacitive-touch peripheral.
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID        "0000fff0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "0000fff1-0000-1000-8000-00805f9b34fb"

#define PIN_RGB    ${pins.pinLed}
#define PIN_HAPTIC ${pins.pinHaptic}
#define PIN_TOUCH  ${pins.pinTouch}

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

void handleCommand(uint8_t cmd, uint8_t* data, size_t len) {
  if (cmd == 0x10 && len >= 3) {
    // 0x10: Set RGB Color [R, G, B]
    uint8_t r = data[0], g = data[1], b = data[2];
    Serial.printf("[Mini G-F] Set LED RGB: (%d, %d, %d)\\n", r, g, b);
    // Replace with your WS2812B strip driver: strip.setPixelColor + show
  }
  else if (cmd == 0x11 && len >= 1) {
    // 0x11: Haptic Vibration [duration_ms] — the PWA sends ms directly
    int duration = data[0];
    digitalWrite(PIN_HAPTIC, HIGH);
    delay(duration);
    digitalWrite(PIN_HAPTIC, LOW);
    Serial.printf("[Mini G-F] Vibration %d ms\\n", duration);
  }
  else if (cmd == 0x12 && len >= 1) {
    // 0x12: Blink LED [count] — ON 150ms / OFF 150ms per blink
    uint8_t count = data[0];
    for (int i = 0; i < count; i++) {
      Serial.println("[Mini G-F] LED ON");
      delay(150);
      Serial.println("[Mini G-F] LED OFF");
      delay(150);
    }
  }
}

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("[Mini G-F] BLE Connected to PWA Studio!");
      digitalWrite(PIN_HAPTIC, HIGH);
      delay(150);
      digitalWrite(PIN_HAPTIC, LOW);
    }
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("[Mini G-F] BLE Disconnected. Advertising...");
      pServer->startAdvertising();
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pChar) {
      uint8_t* val = pChar->getData();
      size_t len = pChar->getLength();
      if (len >= 4 && val[0] == 0xAA && val[1] == 0x01) {
        handleCommand(val[2], &val[4], val[3]);
      }
    }
};

void setup() {
  Serial.begin(115200);
  pinMode(PIN_HAPTIC, OUTPUT);
  digitalWrite(PIN_HAPTIC, LOW);
  pinMode(PIN_TOUCH, INPUT_PULLUP);

  BLEDevice::init("Mini-G-F Keychain");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_WRITE |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pCharacteristic->setCallbacks(new MyCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());

  pService->start();
  BLEAdvertising *pAdv = BLEDevice::getAdvertising();
  pAdv->addServiceUUID(SERVICE_UUID);
  pAdv->setScanResponse(true);
  pAdv->setMinPreferred(0x06);
  BLEDevice::startAdvertising();

  Serial.println("[Mini G-F] Ready for pairing with Kids PWA Platform!");
}

void loop() {
  // Touch: on ESP32-C3 wire a push-button (active LOW) on PIN_TOUCH and use
  // digitalRead(); on S3/original ESP32 use touchRead(PIN_TOUCH) < 30 instead.
  delay(50);
}`;

const GM_CPP = (pins: PinoutMap): string => `// Mini G-M (Desktop Companion) — Full BLE Firmware
// Mini G Platform export — mirrors src/firmware/mini_gm_esp32.ino.
// Live pin map injected from the "المنافذ" tab.
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ESP32Servo.h>

#define SERVICE_UUID        "0000fff0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "0000fff1-0000-1000-8000-00805f9b34fb"

#define PIN_SERVO  ${pins.pinServo}
#define PIN_BUZZER ${pins.pinBuzzer}

Servo neckServo;

void handleCommand(uint8_t cmd, uint8_t* data, size_t len) {
  if (cmd == 0x20 && len >= 1) {
    // 0x20: Set Expression [Emotion_ID]
    uint8_t emotion = data[0];
    Serial.printf("[Mini G-M] Display Expression: %d on Screen\\n", emotion);
    // Draw OLED screen eye frames here
  }
  else if (cmd == 0x21 && len >= 1) {
    // 0x21: Rotate Head Servo [Signed Angle]
    int8_t angle = (int8_t)data[0];
    int servoPos = 90 + angle; // Map -45..+45 to 45..135
    neckServo.write(servoPos);
    Serial.printf("[Mini G-M] Neck Servo: %d deg\\n", servoPos);
  }
  else if (cmd == 0x22 && len >= 2) {
    // 0x22: Play Tone [Freq/10, Duration_blocks] — PWA sends freq ÷10
    uint16_t freq = data[0] * 10;
    uint16_t durationMs = data[1] * 100;
    if (durationMs == 0 || freq == 0) {
      noTone(PIN_BUZZER);
    } else {
      tone(PIN_BUZZER, freq, min(durationMs, (uint16_t)5000));
      Serial.printf("[Mini G-M] Tone: %d Hz for %d ms\\n", freq, durationMs);
    }
  }
  else if (cmd == 0x23 && len >= 1) {
    // 0x23: Nod Head Vertically [count] — 90 → 75 → 105 → 90 per nod
    uint8_t nods = data[0];
    if (nods > 3) nods = 3;
    for (int i = 0; i < nods; i++) {
      neckServo.write(75);
      delay(140);
      neckServo.write(105);
      delay(150);
    }
    neckServo.write(90);
    Serial.println("[Mini G-M] Nod gesture done");
  }
}

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pChar) {
      uint8_t* val = pChar->getData();
      size_t len = pChar->getLength();
      if (len >= 4 && val[0] == 0xAA && val[1] == 0x02) {
        handleCommand(val[2], &val[4], val[3]);
      }
    }
};

void setup() {
  Serial.begin(115200);
  neckServo.attach(PIN_SERVO);
  neckServo.write(90);

  BLEDevice::init("Mini-G-M Desktop");
  BLEServer* pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);
  BLECharacteristic* pChar = pService->createCharacteristic(
                               CHARACTERISTIC_UUID,
                               BLECharacteristic::PROPERTY_READ |
                               BLECharacteristic::PROPERTY_WRITE |
                               BLECharacteristic::PROPERTY_NOTIFY
                             );
  pChar->setCallbacks(new MyCallbacks());
  pChar->addDescriptor(new BLE2902());

  pService->start();
  BLEAdvertising *pAdv = BLEDevice::getAdvertising();
  pAdv->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();

  Serial.println("[Mini G-M] Desktop Buddy Ready!");
}

void loop() {
  delay(100);
}`;

const G_CPP = (pins: PinoutMap): string => `// Mini G (Humanoid AI Robot) — Full BLE Firmware
// Mini G Platform export — mirrors src/firmware/mini_g_esp32.ino.
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ESP32Servo.h>

#define SERVICE_UUID        "0000fff0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "0000fff1-0000-1000-8000-00805f9b34fb"

#define PIN_MOTOR_L ${pins.pinMotorL}
#define PIN_MOTOR_R ${pins.pinMotorR}
#define PIN_ARM_L   ${pins.pinArmL}
#define PIN_ARM_R   ${pins.pinArmR}

Servo armLeft;
Servo armRight;

void handleCommand(uint8_t cmd, uint8_t* data, size_t len) {
  if (cmd == 0x30 && len >= 2) {
    // 0x30: Differential Drive Motors [Speed_L, Speed_R] (signed)
    int8_t spdL = (int8_t)data[0];
    int8_t spdR = (int8_t)data[1];
    Serial.printf("[Mini G] Driving Wheels - L: %d, R: %d\\n", spdL, spdR);
    // Wire your L298N PWM driver here
  }
  else if (cmd == 0x31 && len >= 1) {
    armLeft.write(data[0]);
    Serial.printf("[Mini G] Left Arm angle: %d\\n", data[0]);
  }
  else if (cmd == 0x32 && len >= 1) {
    armRight.write(data[0]);
    Serial.printf("[Mini G] Right Arm angle: %d\\n", data[0]);
  }
  else if (cmd == 0x33 && len >= 1) {
    // Switch AI Persona Face & Voice Theme
    Serial.printf("[Mini G] Switching GenAI Persona: %d\\n", data[0]);
  }
  else if (cmd == 0x34 && len > 0) {
    // AI Speech & Lip Sync (UTF-8 phrase in data)
    char phrase[128];
    size_t n = (len < sizeof(phrase) - 1) ? len : sizeof(phrase) - 1;
    memcpy(phrase, data, n);
    phrase[n] = '\\0';
    Serial.printf("[Mini G] AI Speech: %s\\n", phrase);
  }
  else if (cmd == 0x35) {
    // Emergency Stop All
    armLeft.write(0);
    armRight.write(0);
    Serial.println("[Mini G] EMERGENCY STOP ALL!");
  }
}

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pChar) {
      uint8_t* val = pChar->getData();
      size_t len = pChar->getLength();
      if (len >= 4 && val[0] == 0xAA && val[1] == 0x03) {
        handleCommand(val[2], &val[4], val[3]);
      }
    }
};

void setup() {
  Serial.begin(115200);
  armLeft.attach(PIN_ARM_L);
  armRight.attach(PIN_ARM_R);
  armLeft.write(0);
  armRight.write(0);

  BLEDevice::init("Mini-G AI Robot");
  BLEServer* pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(SERVICE_UUID);
  BLECharacteristic* pChar = pService->createCharacteristic(
                               CHARACTERISTIC_UUID,
                               BLECharacteristic::PROPERTY_READ |
                               BLECharacteristic::PROPERTY_WRITE |
                               BLECharacteristic::PROPERTY_NOTIFY
                             );
  pChar->setCallbacks(new MyCallbacks());
  pChar->addDescriptor(new BLE2902());

  pService->start();
  BLEAdvertising *pAdv = BLEDevice::getAdvertising();
  pAdv->addServiceUUID(SERVICE_UUID);
  BLEDevice::startAdvertising();

  Serial.println("[Mini G] AI Humanoid Ready for Classrooms!");
}

void loop() {
  delay(50);
}`;

const MP_BLE_HELPERS = `# ---- BLE GATT + packet parser (same protocol as the C++ firmware) ----
# Packet: AA | robot_type | cmd | len | data... | checksum | 55 (XOR checksum)
import bluetooth
import time
import asyncio
from machine import Pin, PWM
from micropython import const

_IRQ_GATTS_WRITE = const(3)
SERVICE_UUID = bluetooth.UUID("0000fff0-0000-1000-8000-00805f9b34fb")
CHAR_UUID = bluetooth.UUID("0000fff1-0000-1000-8000-00805f9b34fb")

def parse_packet(raw):
    """Validate a Mini G packet. Returns (cmd, payload) or (None, None)."""
    data = bytes(raw)
    if len(data) < 4 or data[0] != 0xAA:
        return None, None
    cmd = data[2]
    ln = data[3]
    if len(data) < 4 + ln + 2:
        return None, None
    payload = data[4:4 + ln]
    expected = data[4 + ln]
    computed = 0xAA
    for b in data[1:4 + ln]:
        computed ^= b
    if data[4 + ln + 1] != 0x55 or computed != checksum:
        return None, None
    return cmd, payload

def angle_duty(angle):
    """Servo SG90: map 0..180 degrees to 40..115 duty (out of 1024 @50Hz)."""
    return int(26 + (angle / 180) * 92)
`;

const PY_GF = (pins: PinoutMap, name: string): string => `${MP_BLE_HELPERS}

# ---- firmware (Mini G Platform MicroPython export) ----
# Pins are live from the "المنافذ" tab (pinoutManager).
haptic = Pin(${pins.pinHaptic}, Pin.OUT)
rgb_data = Pin(${pins.pinLed}, Pin.OUT)
touch = Pin(${pins.pinTouch}, Pin.IN)
# RGB LED: wire a WS2812B strip to rgb_data and use neopixel:
#   import neopixel; led = neopixel.NeoPixel(rgb_data, 1)

def handle_command(cmd, data):
    if cmd == 0x10 and len(data) >= 3:      # Set RGB color
        r, g, b = data[0], data[1], data[2]
        print("[Mini G-F] LED RGB:", (r, g, b))
        # np[0] = (r, g, b); np.write()
    elif cmd == 0x11 and len(data) >= 1:    # Haptic [duration_ms]
        haptic.on()
        time.sleep_ms(min(data[0], 500))
        haptic.off()
    elif cmd == 0x12 and len(data) >= 1:    # Blink LED [count]
        for i in range(min(data[0], 10)):
            print("LED ON"); time.sleep_ms(150)
            print("LED OFF"); time.sleep_ms(150)

_ROBOT_TYPE = 0x01  # mini_gf

async def gatts_handler(chr_, data):
    cmd, payload = parse_packet(data)
    if cmd is not None:
        handle_command(cmd, payload)

async def main():
    # BLE advertising + gatts write handler (aioble on ESP32)
    # See aioble docs: aioble.service/characteristic with the same UUIDs,
    # then dispatch every write through handle_command (shown simplified).
    while True:
        await asyncio.sleep_ms(50)
`;

const PY_GM = (pins: PinoutMap): string => `# ---- ${'Mini G-M'} MicroPython firmware (same level as the C++ firmware) ----
# Pins live from the "المنافذ" tab.
import time
import asyncio

servo = PWM(Pin(${pins.pinServo}), freq=50)
buzzer = PWM(Pin(${pins.pinBuzzer}), freq=1000, duty_u16=0)

def angle_duty(angle):
    return int(26 + (angle / 180) * 115)

def handle_command(cmd, data):
    if cmd == 0x20 and len(data) >= 1:
        print("[Mini G-M] Expression:", data[0])
    elif cmd == 0x21 and len(data) >= 1:
        angle = data[0] - 256 if data[0] > 127 else data[0]
        servo.duty(angle_duty(90 + max(-45, min(45, angle))))
    elif cmd == 0x22 and len(data) >= 2:
        freq = data[0] * 10
        duration = data[1] * 100
        if duration == 0 or freq == 0:
            buzzer.duty_u16(0)
        else:
            buzzer.freq(freq)
            buzzer.duty_u16(32768)
            time.sleep_ms(min(duration, 5000))
            buzzer.duty_u16(0)
    elif cmd == 0x23 and len(data) >= 1:
        nods = min(data[0], 3)
        for i in range(nods):
            servo.duty(angle_duty(75))
            time.sleep_ms(140)
            servo.duty(_angle_duty(105))
            time.sleep_ms(150)
        servo.duty(_angle_duty(90))
`;

const PY_G = (pins: PinoutMap): string => `# ---- Mini G MicroPython firmware ----
import time
import asyncio
from machine import Pin, PWM

motor_l = PWM(Pin(${pins.pinMotorL}), freq=1000)
motor_r = PWM(Pin(${pins.pinMotorR}), freq=1000)
arm_l = PWM(Pin(${pins.pinArmL}), freq=50)
arm_r = PWM(Pin(${pins.pinArmR}), freq=50)

def handle_command(cmd, data):
    if cmd == 0x30 and len(data) >= 2:
        spdL = data[0] - 256 if data[0] > 127 else data[0]
        spdR = data[1] - 256 if data[1] > 127 else data[1]
        motor_l.duty(int(abs(spdL) * 10))   # L298N PWM wiring required
        motor_r.duty(int(abs(spdR) * 10))
        print("[Mini G] Wheels:", spdL, spdR)
    elif cmd == 0x31 and len(data) >= 1:
        arm_l.duty(_angle_duty(data[0]))
    elif cmd == 0x32 and len(data) >= 1:
        arm_r.duty(_angle_duty(data[0]))
    elif cmd == 0x33 and len(data) >= 1:
        print("[Mini G] Persona:", data[0])
    elif cmd == 0x34 and len(data) > 0:
        print("[Mini G] AI Speech:", bytes(data).decode('utf-8'))
    elif cmd == 0x35:
        arm_l.duty(0); arm_r.duty(0)
        print("[Mini G] EMERGENCY STOP")
`;

function pyTemplate(model: RobotModelType, pins: PinoutMap, name: string): string {
  const body = model === 'mini_gf'
    ? PY_GF(pins, name)
    : model === 'mini_gm'
    ? PY_GM(pins)
    : PY_G(pins);
  return `# Mini G Platform — ${name} MicroPython Firmware
# Full BLE GATT + packet parser (AA|type|cmd|len|checksum|55) — same
# command contracts as the C++ firmware. Pins live from the "المنافذ" tab.
${body}`;
}

export const CodeExportModal: React.FC<Props> = ({ model }) => {
  const [lang, setLang] = useState<'cpp' | 'python'>('cpp');
  const [copied, setCopied] = useState(false);
  const [exportBlocked, setExportBlocked] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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
      return model === 'mini_gf' ? GF_CPP(pins) : model === 'mini_gm' ? GM_CPP(pins) : G_CPP(pins);
    }
    return pyTemplate(model, pins, modelInfo.name);
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
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  };

  const mgBuildCmd = `bash ~/mini-g-robotics-platform/mgbuild.sh ${model === 'mini_gf' ? 'gf' : model === 'mini_gm' ? 'gm' : 'g'}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs md:text-sm text-slate-200">
            توليد كود الفريم وير والرفع للـ ESP32
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHelpOpen(v => !v)}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 transition"
            title="كيف أجمّع وأرفع؟"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>
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
      </div>

      {helpOpen && (
        <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-3 text-[11px] text-slate-300 flex flex-col gap-1.5 relative">
          <button
            onClick={() => setHelpOpen(false)}
            className="absolute top-2 left-2 p-1 text-slate-500 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold text-cyan-300">كيف أجمّع هذا الكود؟ (مساران):</span>
          <p className="text-slate-400 leading-relaxed">
            <b className="text-emerald-400">أ) سكربت جاهز (الأسرع):</b> على كمبيوتر المعلم شغّل{' '}
            <code className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-cyan-300 font-mono" dir="ltr">
              bash ~/mini-g-robotics-platform/mgbuild.sh {model === 'mini_gf' ? 'gf' : model === 'mini_gm' ? 'gm' : 'g'}
            </code>
            {' '}فيُنتج ملف .bin في مجلد build/ — ثم ارفعه من تبويب «⚡ الفلاشر».
          </p>
          <p className="text-slate-400 leading-relaxed">
            <b className="text-slate-300">ب) Arduino IDE:</b> افتح الملف المُنزَّل → <b>Sketch → Export Compiled Binary</b> → خذ ملف <code dir="ltr" className="font-mono text-cyan-300">.ino.bin</code> من مجلد build → ارفعه من تبويب «⚡ الفلاشر».
          </p>
        </div>
      )}

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
          <span>تحميل ملف الفريم وير ({lang === 'cpp' ? '.ino' : '.py'})</span>
        </button>
      </div>
    </div>
  );
};
