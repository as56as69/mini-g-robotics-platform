/*
 * Mini G-F: Keychain Companion Firmware
 * Target MCU: ESP32-C3 / ESP32-S3 Mini
 * Peripherals: WS2812B RGB LED, Coin Vibration Haptic Motor, Capacitive Touch Pin
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID        "0000fff0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "0000fff1-0000-1000-8000-00805f9b34fb"

#define PIN_HAPTIC_MOTOR    4
#define PIN_TOUCH_SENSOR    2
#define PIN_RGB_LED         8

// ESP32-C3 has NO capacitive-touch peripheral, so touchRead() is only valid
// on ESP32-S3 and ESP32 (original). For C3 boards, wire a push-button to
// PIN_TOUCH_SENSOR (active LOW) and compile with: -DUSE_TOUCH_SENSOR=0
#ifndef USE_TOUCH_SENSOR
  #define USE_TOUCH_SENSOR 1
#endif

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

// Command Processor
void handleCommand(uint8_t cmd, uint8_t* data, size_t len) {
  if (cmd == 0x10 && len >= 3) {
    // 0x10: Set RGB Color [R, G, B]
    uint8_t r = data[0];
    uint8_t g = data[1];
    uint8_t b = data[2];
    Serial.printf("[Mini G-F] Set LED RGB: (%d, %d, %d)\n", r, g, b);
    // Control your WS2812B strip / LED driver here
  } 
  else if (cmd == 0x11 && len >= 1) {
    // 0x11: Trigger Haptic Vibration [Duration_MS]
    // NOTE: the PWA sends the value in milliseconds already (no *10 scaling)
    int duration = data[0];
    Serial.printf("[Mini G-F] Vibration Pulse for %d ms\n", duration);
    digitalWrite(PIN_HAPTIC_MOTOR, HIGH);
    delay(duration);
    digitalWrite(PIN_HAPTIC_MOTOR, LOW);
  }
  else if (cmd == 0x12 && len >= 1) {
    // 0x12: Blink LED [count] — each blink = ON 150ms / OFF 150ms
    uint8_t count = data[0];
    Serial.printf("[Mini G-F] Blink LED x%d\n", count);
    for (int i = 0; i < count; i++) {
      // ON phase (white flash)
      // NOTE: replace with your WS2812B driver call, e.g. strip.fill + strip.show
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
      // Startup joyful vibration feedback
      digitalWrite(PIN_HAPTIC_MOTOR, HIGH);
      delay(150);
      digitalWrite(PIN_HAPTIC_MOTOR, LOW);
    };

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
        uint8_t cmd = val[2];
        uint8_t dataLen = val[3];
        handleCommand(cmd, &val[4], dataLen);
      }
    }
};

void setup() {
  Serial.begin(115200);
  pinMode(PIN_HAPTIC_MOTOR, OUTPUT);
  digitalWrite(PIN_HAPTIC_MOTOR, LOW);
#if !USE_TOUCH_SENSOR
  pinMode(PIN_TOUCH_SENSOR, INPUT_PULLUP);
#endif

  // Initialize BLE
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
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();

  Serial.println("[Mini G-F] Ready for pairing with Kids PWA Platform!");
}

void loop() {
#if USE_TOUCH_SENSOR
  int touchVal = touchRead(PIN_TOUCH_SENSOR);
  if (touchVal < 30) { // Touch detected
    Serial.println("[Mini G-F] Touch Event Triggered!");
    // Vibrate gently
    digitalWrite(PIN_HAPTIC_MOTOR, HIGH);
    delay(80);
    digitalWrite(PIN_HAPTIC_MOTOR, LOW);
    delay(300);
  }
#else
  if (digitalRead(PIN_TOUCH_SENSOR) == LOW) { // Button pressed (active LOW)
    Serial.println("[Mini G-F] Touch (Button) Event Triggered!");
    digitalWrite(PIN_HAPTIC_MOTOR, HIGH);
    delay(80);
    digitalWrite(PIN_HAPTIC_MOTOR, LOW);
    delay(300);
  }
#endif
  delay(50);
}
