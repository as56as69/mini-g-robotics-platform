/*
 * Mini G: 50cm AI Humanoid School Companion Robot Firmware
 * Target MCU: ESP32-S3
 * Peripherals: Differential Drive DC Motors/Steppers, Arm Servos (L/R),
 *              Display Head Controller, Audio DAC / I2S Speaker & Mic
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ESP32Servo.h>

#define SERVICE_UUID        "0000fff0-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID "0000fff1-0000-1000-8000-00805f9b34fb"

#define PIN_MOTOR_L_PWM     14
#define PIN_MOTOR_R_PWM     27
#define PIN_SERVO_ARM_L     25
#define PIN_SERVO_ARM_R     26

Servo armLeft;
Servo armRight;

void handleCommand(uint8_t cmd, uint8_t* data, size_t len) {
  if (cmd == 0x30 && len >= 2) {
    // 0x30: Differential Drive Motors [Speed_L, Speed_R]
    int8_t spdL = (int8_t)data[0];
    int8_t spdR = (int8_t)data[1];
    Serial.printf("[Mini G] Driving Wheels - L: %d, R: %d\n", spdL, spdR);
  }
  else if (cmd == 0x31 && len >= 1) {
    // 0x31: Set Left Arm Angle [0..180]
    armLeft.write(data[0]);
    Serial.printf("[Mini G] Left Arm angle: %d\n", data[0]);
  }
  else if (cmd == 0x32 && len >= 1) {
    // 0x32: Set Right Arm Angle [0..180]
    armRight.write(data[0]);
    Serial.printf("[Mini G] Right Arm angle: %d\n", data[0]);
  }
  else if (cmd == 0x33 && len >= 1) {
    // 0x33: Switch AI Persona Face & Voice Theme
    uint8_t personaId = data[0];
    Serial.printf("[Mini G] Switching GenAI Persona: %d\n", personaId);
  }
  else if (cmd == 0x34) {
    // 0x34: Trigger AI Speech & Lip Sync
    Serial.println("[Mini G] AI Speech synthesis & Lip Sync started");
  }
}

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pChar) {
      uint8_t* val = pChar->getData();
      size_t len = pChar->getLength();
      if (len >= 4 && val[0] == 0xAA && val[1] == 0x03) {
        uint8_t cmd = val[2];
        uint8_t dataLen = val[3];
        handleCommand(cmd, &val[4], dataLen);
      }
    }
};

void setup() {
  Serial.begin(115200);
  armLeft.attach(PIN_SERVO_ARM_L);
  armRight.attach(PIN_SERVO_ARM_R);
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
}
