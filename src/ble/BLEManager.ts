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

  private notifyConnectionListeners(connected: boolean, name?: string) {
    this.currentState.connected = connected;
    this.connectionListeners.forEach(cb => cb(connected, name));
    this.notifyStateListeners({ connected });
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
        this.notifyStateListeners({ gm_isPlayingSound: true });
        this.playSynthesizedTone((data[0] || 44) * 10, (data[1] || 3) * 100);
        setTimeout(() => this.notifyStateListeners({ gm_isPlayingSound: false }), (data[1] || 3) * 100);
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

  // Web Audio Synth for simulator feedback
  private playSynthesizedTone(freq: number, durationMs: number) {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
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
    } catch (e) {
      // Audio not permitted yet
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
