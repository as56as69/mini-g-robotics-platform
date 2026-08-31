import { RobotModelType, RobotState } from '../types/robot';
import { BLE_CONFIG, BLEProtocol, CMD_CODES } from './Protocol';
import { safetyManager, isChildSafePhrase, CHILD_SAFE_FALLBACK } from './SafetyManager';

type ConnectionCallback = (connected: boolean, deviceName?: string) => void;
type StateUpdateCallback = (state: Partial<RobotState>) => void;

class BLEManager {
  private device: any = null;
  private characteristic: any = null;
  private isConnecting: boolean = false;
  private connectionListeners: ConnectionCallback[] = [];
  private stateListeners: StateUpdateCallback[] = [];
  private virtualMode: boolean = true; // Defaults to true if no physical device connected

  private currentState: RobotState = {
    connected: false,
    model: 'mini_gm',
    batteryLevel: 92,
    rssi: -65,
    gf_ledColor: '#38bdf8',
    gf_vibrating: false,
    gm_expression: 'happy',
    gm_customFace: null,
    gm_headAngle: 0,
    gm_isPlayingSound: false,
    // Avatar customization (persisted skin color from the Costume Studio)
    costumeSkinColor: (() => {
      try {
        return (typeof localStorage !== 'undefined' && localStorage.getItem('mg_costume_skin')) || '#38bdf8';
      } catch {
        return '#38bdf8';
      }
    })(),
    g_wheelSpeedL: 0,
    g_wheelSpeedR: 0,
    g_armLeftAngle: 0,
    g_armRightAngle: 0,
    g_activePersona: 'alkhwarizmi',
    g_isTalking: false,
    g_speechText: '',
  };

  public isWebBluetoothAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public isConnected(): boolean {
    return this.currentState.connected;
  }

  public getState(): RobotState {
    return { ...this.currentState };
  }

  public setModel(model: RobotModelType) {
    this.currentState.model = model;
    this.notifyStateListeners({ model });
  }

  /** Persists and applies the robot skin color live on the digital twin */
  public setCostumeSkin(color: string) {
    try {
      localStorage.setItem('mg_costume_skin', color);
    } catch {}
    this.currentState.costumeSkinColor = color;
    this.notifyStateListeners({ costumeSkinColor: color });
  }

  public onConnectionChange(cb: ConnectionCallback) {
    this.connectionListeners.push(cb);
  }

  public onStateUpdate(cb: StateUpdateCallback) {
    this.stateListeners.push(cb);
  }

  private notifyStateListeners(partial: Partial<RobotState>) {
    this.currentState = { ...this.currentState, ...partial };
    this.stateListeners.forEach(cb => cb(this.currentState));
  }

  /** Human-readable label for the live status card */
  private describeCommand(cmd: number, data: number[] | string): string {
    switch (cmd) {
      case CMD_CODES.GF_SET_LED_RGB: {
        const hex = typeof data === 'string' ? data : null;
        const names: Record<string, string> = {
          '#ef4444': 'أحمر', '#22c55e': 'أخضر', '#3b82f6': 'أزرق', '#eab308': 'أصفر',
          '#a855f7': 'بنفسجي', '#ec4899': 'وردي', '#ffffff': 'أبيض', '#000000': 'إطفاء',
        };
        return hex ? `لوّن الليد (${names[hex.toLowerCase()] || hex})` : 'تغيير لون الليد';
      }
      case CMD_CODES.GF_TRIGGER_HAPTIC: {
        const ms = Array.isArray(data) ? data[0] : 0;
        return `نبضة هزاز ${ms}ms`;
      }
      case CMD_CODES.GF_BLINK_LED: {
        const count = Array.isArray(data) ? data[0] : 1;
        return `وميض الليد ×${count}`;
      }
      default:
        return `أمر 0x${cmd.toString(16).toUpperCase()}`;
    }
  }

  private notifyConnectionListeners(connected: boolean, name?: string) {
    this.currentState.connected = connected;
    if (name) this.currentState.deviceName = name;
    this.connectionListeners.forEach(cb => cb(connected, name));
    this.notifyStateListeners({ connected, deviceName: name ?? this.currentState.deviceName });
  }

  /**
   * Request and pair with BLE Device
   */
  public async connect(targetModel?: RobotModelType): Promise<boolean> {
    if (!this.isWebBluetoothAvailable()) {
      console.warn('Web Bluetooth API is not available on this browser. Falling back to Virtual Robot Twin.');
      this.virtualMode = true;
      this.notifyConnectionListeners(true, `Virtual ${targetModel || this.currentState.model}`);
      return true;
    }

    try {
      this.isConnecting = true;
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Mini-G' },
          { namePrefix: 'ESP32' },
          { services: [BLE_CONFIG.SERVICE_UUID] }
        ],
        optionalServices: [BLE_CONFIG.SERVICE_UUID]
      });

      this.device = device;
      device.addEventListener('gattserverdisconnected', this.handleDisconnect);

      // Teacher's "حظر الأجهزة غير المعرفة": only Mini-G units are allowed.
      const deviceName = device.name || '';
      if (safetyManager.get().bleRestricted && !deviceName.startsWith('Mini-G')) {
        if (device.gatt?.connected) {
          try { device.gatt.disconnect(); } catch (e) { /* ignore */ }
        }
        throw new Error('Device not in the classroom whitelist');
      }

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(BLE_CONFIG.SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(BLE_CONFIG.CHARACTERISTIC_UUID);

      this.virtualMode = false;
      this.notifyConnectionListeners(true, device.name || 'Mini G Device');
      this.isConnecting = false;
      return true;
    } catch (err: any) {
      console.error('BLE connection cancelled or failed:', err);
      this.isConnecting = false;
      // Virtual fallback only makes sense when the user cancelled the pairing
      // prompt or Web Bluetooth is unavailable. A genuine hardware/service
      // failure must NOT be reported as a successful connection (M7).
      const isUserAction =
        err?.name === 'NotFoundError' ||
        err?.name === 'NotAllowedError' ||
        err?.name === 'SecurityError' ||
        /use canceled|no matching/i.test(String(err?.message || ''));
      const usableFallback = !this.isWebBluetoothAvailable() || isUserAction;
      if (this.device?.gatt?.connected) {
        try { this.device.gatt.disconnect(); } catch (e) { /* ignore */ }
      }
      if (usableFallback) {
        this.virtualMode = true;
        this.notifyConnectionListeners(true, `Virtual ${targetModel || this.currentState.model} (Simulator Only)`);
      } else {
        this.virtualMode = true; // simulator still usable, but reported as NOT connected
        this.device = null;
        this.characteristic = null;
        this.notifyConnectionListeners(false);
      }
      return usableFallback;
    }
  }

  public async disconnect() {
    if (this.device && this.device.gatt.connected) {
      try { this.device.gatt.disconnect(); } catch (e) { /* ignore */ }
      // The 'gattserverdisconnected' event will invoke handleDisconnect.
    }
    this.handleDisconnect();
  }

  private handleDisconnect = (event?: any) => {
    // Ignore stale disconnect events fired by a previously paired device.
    if (event && event.target && this.device !== event.target) return;
    // Idempotent: platform disconnect + manual call must not double-notify (M6).
    if (!this.device && !this.characteristic) return;
    this.device = null;
    this.characteristic = null;
    this.notifyConnectionListeners(false);
  };

  /**
   * Send binary command packet to ESP32 / Virtual Engine
   * Accepts either an RGB byte array or a hex string (e.g. "#ff0000")
   */
  public async sendCommand(cmd: number, data: number[] | string = []) {
    // Voice safety filter: block inappropriate speech before it reaches either
    // the real robot or the virtual twin (the teacher's "فلتر الأمان الصوتي").
    let effective: number[] | string = data;
    if (
      cmd === CMD_CODES.G_SPEAK_PHRASE &&
      typeof data === 'string' &&
      safetyManager.get().voiceSafeFilter &&
      !isChildSafePhrase(data)
    ) {
      effective = CHILD_SAFE_FALLBACK;
    }

    // Build a binary packet for the real ESP32 from numeric data, '#hex'
    // color strings (→ [r,g,b]), or speech text (→ UTF-8 bytes).
    const packetData = this.toPacketData(effective);
    if (packetData && this.characteristic && this.device?.gatt?.connected) {
      try {
        const packet = BLEProtocol.buildPacket(this.currentState.model, cmd, packetData);
        await this.characteristic.writeValue(packet);
      } catch (err) {
        console.error('Error sending BLE packet:', err);
      }
    }
    // Dispatch to Simulator / Virtual State (keeps the original argument so
    // string forms like speech text and '#hex' are consumed correctly above)
    this.updateVirtualState(cmd, effective);
    // Track the last command for the live status card (kid's remote panel)
    this.notifyStateListeners({
      lastCommand: this.describeCommand(cmd, effective),
      lastCommandAt: Date.now(),
    });
  }

  private toPacketData(data: number[] | string): number[] | null {
    if (Array.isArray(data)) return data;
    if (typeof data !== 'string') return null;
    if (data.startsWith('#')) {
      const rgb = BLEProtocol.hexToRgb(data);
      return rgb.some(v => !Number.isFinite(v)) ? null : [rgb[0] || 0, rgb[1] || 0, rgb[2] || 0];
    }
    return Array.from(new TextEncoder().encode(data));
  }

  private updateVirtualState(cmd: number, data: number[] | any) {
    switch (cmd) {
      // Mini G-F
      case CMD_CODES.GF_SET_LED_RGB: {
        // Accept RGB triplet, a raw hex string, or a hex string wrapped in an
        // array (as sent by the Direct Control Panel, e.g. ['#ff0000'])
        let hex: string | undefined;
        if (typeof data === 'string') {
          hex = data;
        } else {
          const first = Array.isArray(data) ? data[0] : data;
          if (typeof first === 'string' && first.startsWith('#')) {
            hex = first;
          } else {
            const [r, g, b] = data as number[];
            hex = `#${((1 << 24) + ((r || 0) << 16) + ((g || 0) << 8) + (b || 0)).toString(16).slice(1)}`;
          }
        }
        this.notifyStateListeners({ gf_ledColor: hex });
        break;
      }
      case CMD_CODES.GF_TRIGGER_HAPTIC: {
        this.notifyStateListeners({ gf_vibrating: true });
        setTimeout(() => this.notifyStateListeners({ gf_vibrating: false }), (data[0] || 500));
        break;
      }
      case CMD_CODES.GF_BLINK_LED: {
        // data[0] = blink count; each blink cycle ≈ 400ms (ON 150 / OFF 250)
        const count = Math.max(1, Math.min(10, data[0] || 1));
        this.notifyStateListeners({ gf_blinking: true });
        setTimeout(() => this.notifyStateListeners({ gf_blinking: false }), count * 400);
        break;
      }

      // Mini G-M
      case CMD_CODES.GM_SET_EXPRESSION: {
        const isCustomFace = Array.isArray(data) && data.length >= 8;
        if (isCustomFace) {
          // 8 bytes = hand-drawn 8x8 pixel face from the Pixel Face Designer
          this.notifyStateListeners({ gm_expression: 'custom', gm_customFace: data.slice(0, 8) });
          break;
        }
        const emotions = ['happy', 'surprised', 'love', 'sleepy', 'cool', 'wink'];
        const expr = emotions[data[0]] || 'happy';
        this.notifyStateListeners({ gm_expression: expr, gm_customFace: null });
        break;
      }
      case CMD_CODES.GM_ROTATE_HEAD: {
        const angle = (data[0] > 127 ? data[0] - 256 : data[0]); // signed 8-bit
        this.notifyStateListeners({ gm_headAngle: angle });
        break;
      }
      case CMD_CODES.GM_PLAY_TONE: {
        // Firmware contract: frequency is transmitted ÷10 (see mini_gm_esp32.ino),
        // so the virtual twin multiplies ×10 to keep the same pitch as the device.
        // data[1] === 0 means an explicit STOP (mirrors the firmware's noTone branch).
        const blocks = data[1] || 0;
        const durationMs = blocks * 100;
        if (durationMs === 0 || (data[0] || 0) === 0) {
          this.stopSynthTone();
          this.notifyStateListeners({ gm_isPlayingSound: false });
          break;
        }
        this.notifyStateListeners({ gm_isPlayingSound: true });
        this.playSynthesizedTone((data[0] || 44) * 10, durationMs);
        // Reset any previous completion timer so a fast-follow tone isn't
        // cut short by the older timeout (PLAY_TONE race fix).
        if (this.toneTimer != null) {
          clearTimeout(this.toneTimer);
          this.toneTimer = undefined;
        }
        this.toneTimer = window.setTimeout(() => {
          this.notifyStateListeners({ gm_isPlayingSound: false });
          this.toneTimer = null;
        }, durationMs);
        break;
      }
      case CMD_CODES.GM_NOD_HEAD: {
        // 0x23: vertical nod gesture — data[0] = nod count (1..3), each ≈ 300ms
        const nods = Math.max(1, Math.min(3, data[0] || 1));
        this.notifyStateListeners({ gm_nodding: true });
        if (this.nodTimer != null) {
          window.clearTimeout(this.nodTimer);
          this.nodTimer = undefined;
        }
        this.nodTimer = window.setTimeout(() => {
          this.notifyStateListeners({ gm_nodding: false });
          this.nodTimer = null;
        }, Math.min(nods, 3) * 300);
        break;
      }

      // Mini G
      case CMD_CODES.G_DRIVE_MOTORS: {
        const spdL = data[0] > 127 ? data[0] - 256 : data[0];
        const spdR = data[1] > 127 ? data[1] - 256 : data[1];
        this.notifyStateListeners({ g_wheelSpeedL: spdL, g_wheelSpeedR: spdR });
        break;
      }
      case CMD_CODES.G_SET_ARM_LEFT: {
        this.notifyStateListeners({ g_armLeftAngle: data[0] });
        break;
      }
      case CMD_CODES.G_SET_ARM_RIGHT: {
        this.notifyStateListeners({ g_armRightAngle: data[0] });
        break;
      }
      case CMD_CODES.G_SET_PERSONA: {
        const personas = ['alkhwarizmi', 'astronaut', 'einstein', 'friendly_bot'];
        this.notifyStateListeners({ g_activePersona: personas[data[0]] || 'friendly_bot' });
        break;
      }
      case CMD_CODES.G_SPEAK_PHRASE: {
        const phrase = (typeof (data as any) === 'string' && (data as any).length > 0)
          ? (data as any)
          : 'مرحباً بكم يا أبطال البرمجة في منصة ميني جي!';
        this.notifyStateListeners({ g_isTalking: true, g_speechText: phrase });
        this.speakBrowserAudio(phrase);
        setTimeout(() => this.notifyStateListeners({ g_isTalking: false }), 3000);
        break;
      }
      case CMD_CODES.G_STOP_ALL: {
        this.notifyStateListeners({
          g_wheelSpeedL: 0,
          g_wheelSpeedR: 0,
          gf_vibrating: false,
          gm_isPlayingSound: false,
          g_isTalking: false,
        });
        break;
      }
    }
  }

  private audioCtx: AudioContext | null = null;
  private toneOsc: OscillatorNode | null = null;
  private toneTimer: number | null = null;
  private nodTimer: number | undefined = undefined;

  private getAudioCtx(): AudioContext | null {
    try {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      if (!this.audioCtx) this.audioCtx = new Ctor();
      // Autoplay policy: resume if suspended (first user gesture may be needed)
      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume().catch(() => { /* not permitted yet */ });
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Web Audio Synth for simulator feedback
  private playSynthesizedTone(freq: number, durationMs: number) {
    try {
      const ctx = this.getAudioCtx();
      if (!ctx) return;
      // Stop any tone still ringing before starting the new one
      if (this.toneOsc) {
        try { this.toneOsc.stop(); } catch { /* already stopped */ }
        this.toneOsc = null;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const volume = 0.15 * (safetyManager.get().maxVolumeLimit / 100);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume * 0.07), ctx.currentTime + (durationMs / 1000));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (durationMs / 1000));
      this.toneOsc = osc;
    } catch (e) {
      // Audio not permitted yet
    }
  }

  /** Explicit tone stop (matches the firmware's noTone contract for duration=0) */
  private stopSynthTone() {
    if (this.toneTimer != null) {
      window.clearTimeout(this.toneTimer);
      this.toneTimer = null;
    }
    if (this.toneOsc) {
      try { this.toneOsc.stop(); } catch { /* already stopped */ }
      this.toneOsc = null;
    }
  }

  // Speech synthesis
  private speakBrowserAudio(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const bleService = new BLEManager();
