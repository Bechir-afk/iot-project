#include <SPI.h>
#include <MFRC522.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// RFID Pins
#define SS_PIN 10  // Slave Select
#define RST_PIN 9  // Reset

// ESP8266 Pins
#define ESP_RX 2   // Connect to ESP8266 TX
#define ESP_TX 3   // Connect to ESP8266 RX

// Buzzer Pin
#define BUZZER_PIN 8

// Firebase Details
const char* FIREBASE_HOST = "your-firebase-database-url.firebaseio.com";
const char* FIREBASE_AUTH = "your-firebase-database-secret";

// RFID Object
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Software Serial for ESP8266
SoftwareSerial espSerial(ESP_RX, ESP_TX);  // RX, TX

void setup() {
  Serial.begin(9600);   // Initialize Serial Monitor
  espSerial.begin(9600); // Initialize ESP8266 Communication
  SPI.begin();          // Initialize SPI Bus
  mfrc522.PCD_Init();   // Initialize RFID Reader

  pinMode(BUZZER_PIN, OUTPUT); // Set buzzer as output

  Serial.println("RFID Attendance System Ready!");
}

void loop() {
  // Look for new RFID cards
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    // Read the card's UID
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    Serial.println("Card UID: " + uid);

    // Record attendance
    recordAttendance(uid);
    
    // Also send to latest scan node for web interface
    updateLatestScan(uid);

    // Halt the card
    mfrc522.PICC_HaltA();

    // Beep to indicate successful scan
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void recordAttendance(String uid) {
  // Create JSON payload
  StaticJsonDocument<200> json;
  json["uid"] = uid;
  json["timestamp"] = getTimestamp();

  // Convert JSON to string
  String payload;
  serializeJson(json, payload);

  // Send data to Firebase
  String httpRequest = "POST /attendance.json?auth=" + String(FIREBASE_AUTH) + " HTTP/1.1\r\n";
  httpRequest += "Host: " + String(FIREBASE_HOST) + "\r\n";
  httpRequest += "Content-Type: application/json\r\n";
  httpRequest += "Content-Length: " + String(payload.length()) + "\r\n\r\n";
  httpRequest += payload;

  // Send request to ESP8266
  espSerial.println(httpRequest);
  delay(1000);

  // Check ESP8266 response
  while (espSerial.available()) {
    String response = espSerial.readString();
    Serial.println(response);
  }
}

void updateLatestScan(String uid) {
  // Create JSON payload specifically for the latest scan
  StaticJsonDocument<200> json;
  json["uid"] = uid;
  json["timestamp"] = getTimestamp();
  json["scanTime"] = millis(); // Add current time to prevent caching issues

  // Convert JSON to string
  String payload;
  serializeJson(json, payload);

  // Send data to Firebase latest_scan node
  String httpRequest = "PUT /latest_scan.json?auth=" + String(FIREBASE_AUTH) + " HTTP/1.1\r\n";
  httpRequest += "Host: " + String(FIREBASE_HOST) + "\r\n";
  httpRequest += "Content-Type: application/json\r\n";
  httpRequest += "Content-Length: " + String(payload.length()) + "\r\n\r\n";
  httpRequest += payload;

  // Send request to ESP8266
  espSerial.println(httpRequest);
  delay(500);

  // Check ESP8266 response (optional, for debugging)
  while (espSerial.available()) {
    String response = espSerial.readString();
    Serial.println("Latest scan update response: " + response);
  }
}

String getTimestamp() {
  // Simulate timestamp (replace with RTC module code if available)
  return "2023-10-01T12:34:56";
}