import { RobotModelType, RobotState } from '../types/robot';
import { BLE_CONFIG, BLEProtocol, CMD_CODES } from './Protocol';

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
    gm_headAngle: 0,
    gm_isPlayingSound: false,
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
      device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

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
      // Fallback to virtual simulation
      this.virtualMode = true;
      this.notifyConnectionListeners(true, `Virtual ${targetModel || this.currentState.model} (Simulator Only)`);
      return true;
    }
  }

  public async disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnect();
  }

  private handleDisconnect() {
    this.device = null;
    this.characteristic = null;
    this.notifyConnectionListeners(false);
  }

  /**
   * Send binary command packet to ESP32 / Virtual Engine
   * Accepts either an RGB byte array or a hex string (e.g. "#ff0000")
   */
  public async sendCommand(cmd: number, data: number[] | string = []) {
    // Only build a binary packet for real BLE when data is numeric
    if (Array.isArray(data)) {
      const packet = BLEProtocol.buildPacket(this.currentState.model, cmd, data);
      if (this.characteristic && this.device?.gatt?.connected) {
        try {
          await this.characteristic.writeValue(packet);
        } catch (err) {
          console.error('Error sending BLE packet:', err);
        }
      }
    }
    // 2. Dispatch to Simulator / Virtual State (handles both formats)
    this.updateVirtualState(cmd, data);
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
        const emotions = ['happy', 'surprised', 'love', 'sleepy', 'cool', 'wink'];
        const expr = emotions[data[0]] || 'happy';
        this.notifyStateListeners({ gm_expression: expr });
        break;
      }
      case CMD_CODES.GM_ROTATE_HEAD: {
        const angle = (data[0] > 127 ? data[0] - 256 : data[0]); // signed 8-bit
        this.notifyStateListeners({ gm_headAngle: angle });
        break;
      }
      case CMD_CODES.GM_PLAY_TONE: {
        this.notifyStateListeners({ gm_isPlayingSound: true });
        this.playSynthesizedTone(data[0] || 440, (data[1] || 3) * 100);
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
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (durationMs / 1000));
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
