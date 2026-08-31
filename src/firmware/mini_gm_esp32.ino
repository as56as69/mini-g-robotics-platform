/*
 * Mini G-M: Desktop Companion & Study Buddy Firmware
 * Target MCU: ESP32
 * Peripherals: I2C/SPI OLED Screen, Servo Motor (Head/Neck), Buzzer/Speaker, ToF/PIR Sensor
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ESP32Servo.h>

#define SERVICE_UUID        "0000fff0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "0000fff1-0000-1000-8000-00805f9b34fb"

#define PIN_SERVO_NECK      18
#define PIN_SPEAKER         19

Servo neckServo;

void handleCommand(uint8_t cmd, uint8_t* data, size_t len) {
  if (cmd == 0x20 && len >= 1) {
    // 0x20: Set Expression [Emotion_ID]
    uint8_t emotion = data[0];
    Serial.printf("[Mini G-M] Display Expression: %d on Screen\n", emotion);
    // Draw OLED Screen Eye Frames (Happy, Wink, Sleepy, Heart)
  }
  else if (cmd == 0x21 && len >= 1) {
    // 0x21: Rotate Head Servo [Signed Angle]
    int8_t angle = (int8_t)data[0];
    int servoPos = 90 + angle; // Map -45..+45 to 45..135
    neckServo.write(servoPos);
    Serial.printf("[Mini G-M] Neck Servo rotated to: %d deg\n", servoPos);
  }
  else if (cmd == 0x22 && len >= 2) {
    // 0x22: Play Melody Tone [Freq/10, Duration_blocks]
    // PWA sends frequency ÷10 (same scale as the simulator); each "block" = 100ms
    uint16_t freq = data[0] * 10;
    uint16_t durationMs = data[1] * 100;    // matched to the PWA's note grid
    if (durationMs == 0 || freq == 0) {
      noTone(PIN_SPEAKER);                  // explicit stop
      Serial.println("[Mini G-M] Tone stopped");
    } else {
      tone(PIN_SPEAKER, freq, min(durationMs, (uint16_t)5000));  // cap at 5s
      Serial.printf("[Mini G-M] Playing Tone: %d Hz for %d ms\n", freq, durationMs);
    }
  }
  else if (cmd == 0x23 && len >= 1) {
    // 0x23: Nod Head Vertically [count] — 90 → 75 → 105 → 90 per nod
    uint8_t nods = data[0];
    if (nods > 3) nods = 3;
    Serial.printf("[Mini G-M] Nod Head x%d\n", nods);
    for (int i = 0; i < nods; i++) {
      neckServo.write(75);   // down
      delay(140);
      neckServo.write(105);  // up
      delay(150);
    }
    neckServo.write(90);     // return to center
    Serial.println("[Mini G-M] Nod gesture done");
  }
}

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pChar) {
      uint8_t* val = pChar->getData();
      size_t len = pChar->getLength();
      if (len >= 4 && val[0] == 0xAA && val[1] == 0x02) {
        uint8_t cmd = val[2];
        uint8_t dataLen = val[3];
        handleCommand(cmd, &val[4], dataLen);
      }
    }
};

void setup() {
  Serial.begin(115200);
  neckServo.attach(PIN_SERVO_NECK);
  neckServo.write(90); // Center position

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
}
