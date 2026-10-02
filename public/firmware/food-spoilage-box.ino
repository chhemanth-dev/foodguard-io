/*
  Food Storage Spoilage Box - ESP32-S3 firmware
  Sends temperature, humidity, pressure and gas (VOC) readings to the dashboard every 15 s.

  Wiring (BME680, I2C):
    BME680 VCC -> 3.3V     BME680 GND -> GND
    BME680 SDA -> GPIO 8   BME680 SCL -> GPIO 9
  Optional: buzzer on GPIO 4, alert LED on GPIO 5.

  Arduino IDE setup:
    1. Boards Manager: install "esp32 by Espressif", select "ESP32S3 Dev Module".
    2. Library Manager: install "Adafruit BME680 Library" and "Adafruit Unified Sensor".
    3. Fill in the four values below, then Upload. Open Serial Monitor at 115200 baud.
*/
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include "Adafruit_BME680.h"

const char* WIFI_NAME     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* DASHBOARD_URL = "https://foodguard-io.lovable.app/api/public/detector/readings";
const char* DEVICE_KEY    = "YOUR_DEVICE_KEY";
const char* DEVICE_ID     = "storage-box-01";

#define SDA_PIN 8
#define SCL_PIN 9
#define BUZZER_PIN 4
#define LED_PIN 5
#define SEND_INTERVAL_MS 15000

Adafruit_BME680 bme;
bool sensorReady = false;

void connectWiFi() {
  Serial.printf("Connecting to %s", WIFI_NAME);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_NAME, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " connected" : " failed, will retry");
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  Wire.begin(SDA_PIN, SCL_PIN);

  sensorReady = bme.begin(0x76) || bme.begin(0x77);
  if (!sensorReady) Serial.println("BME680 not found - check wiring.");
  bme.setTemperatureOversampling(BME680_OS_8X);
  bme.setHumidityOversampling(BME680_OS_2X);
  bme.setPressureOversampling(BME680_OS_4X);
  bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
  bme.setGasHeater(320, 150);

  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!sensorReady || !bme.performReading()) {
    Serial.println("Sensor reading failed.");
    delay(5000);
    return;
  }

  float temperature = bme.temperature;          // °C
  float humidity    = bme.humidity;             // %
  float pressure    = bme.pressure / 100.0;     // hPa
  float gasKOhm     = bme.gas_resistance / 1000.0;
  // Lower gas resistance = more VOCs. Rough conversion to a VOC index (ppb-like scale).
  float voc = constrain((500.0 - gasKOhm) * 2.0, 0, 1000);

  // Local alert: buzzer + LED when VOC is high.
  bool alert = voc > 300;
  digitalWrite(LED_PIN, alert);
  digitalWrite(BUZZER_PIN, alert);

  String json = String("{\"deviceId\":\"") + DEVICE_ID + "\""
    + ",\"temperature\":" + String(temperature, 2)
    + ",\"humidity\":" + String(humidity, 2)
    + ",\"pressure\":" + String(pressure, 2)
    + ",\"voc\":" + String(voc, 2) + "}";

  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // HTTPS without certificate pinning
    HTTPClient http;
    http.begin(client, DASHBOARD_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-device-key", DEVICE_KEY);
    int code = http.POST(json);
    Serial.printf("Sent %s -> %d (201 = OK, 401 = wrong key)\n", json.c_str(), code);
    http.end();
  }

  delay(SEND_INTERVAL_MS);
}
