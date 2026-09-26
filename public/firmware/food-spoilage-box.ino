#include <WiFi.h>
#include <HTTPClient.h>

// Replace these four values before uploading to your ESP32-S3.
const char* WIFI_NAME = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* DASHBOARD_URL = "https://YOUR-PUBLISHED-SITE.lovable.app/api/public/detector/readings";
const char* DEVICE_KEY = "YOUR_DEVICE_KEY";

void connectWiFi() {
  WiFi.begin(WIFI_NAME, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(500);
}

void setup() {
  Serial.begin(115200);
  connectWiFi();
  // Initialize your BME680/SGP30 and DS18B20/SHT31/SHT40 libraries here.
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  // Replace these example values with readings from your installed sensor libraries.
  float temperature = 3.4;
  float humidity = 63.0;
  float pressure = 1012.0;
  float voc = 82.0;

  String json = "{\"deviceId\":\"storage-box-01\",\"temperature\":" + String(temperature, 2)
    + ",\"humidity\":" + String(humidity, 2)
    + ",\"pressure\":" + String(pressure, 2)
    + ",\"voc\":" + String(voc, 2) + "}";

  HTTPClient http;
  http.begin(DASHBOARD_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);
  int responseCode = http.POST(json);
  Serial.printf("Dashboard response: %d\n", responseCode);
  http.end();

  delay(15000);
}
