#include <SPI.h>
#include <Wire.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// RFID Pins
#define SS_PIN 10
#define RST_PIN 9

// ESP-01 Pins
#define ESP_RX 2
#define ESP_TX 3

// Buzzer Pin
#define BUZZER_PIN 8

// LED Module Pins (HW-479)
#define LED_RED 5
#define LED_GREEN 6
#define LED_BLUE 7

// Firebase Details
const char* FIREBASE_HOST = "your-firebase-database-url.firebaseio.com";
const char* FIREBASE_AUTH = "your-firebase-database-secret";

// RFID Reader
MFRC522 mfrc522(SS_PIN, RST_PIN);

// LCD Display
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ESP-01 Communication
SoftwareSerial espSerial(ESP_RX, ESP_TX);

// UID State Map
std::map<String, bool> uidStates;

bool isWiFiConnected = false; // Track Wi-Fi connection status

void setup() {
  // Initialize Serial Monitor
  Serial.begin(9600);
  espSerial.begin(9600);

  // Initialize RFID Reader
  SPI.begin();
  mfrc522.PCD_Init();

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("Initializing...");

  // Initialize Buzzer and LED Pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);

  // Turn off LEDs initially
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_BLUE, LOW);

  // Attempt to connect to Wi-Fi
  checkWiFiStatus();
}

void loop() {
  // Monitor Wi-Fi status
  if (!isWiFiConnected) {
    checkWiFiStatus();
  }

  // Look for new RFID cards
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    // Read the card's UID
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    Serial.println("Card UID: " + uid);

    // Check UID in Firebase
    handleRFIDScan(uid);

    // Halt the card
    mfrc522.PICC_HaltA();
  }
}

void handleRFIDScan(String uid) {
  String userName = getUserNameFromFirebase(uid);

  if (userName != "") {
    // Valid UID
    if (uidStates.find(uid) == uidStates.end() || !uidStates[uid]) {
      // First scan: Welcome
      lcd.clear();
      lcd.print("Welcome ");
      lcd.setCursor(0, 1);
      lcd.print(userName);
      uidStates[uid] = true; // Mark as scanned
      buzzPattern(1); // 1 beep for entry
    } else {
      // Second scan: Goodbye
      lcd.clear();
      lcd.print("Goodbye ");
      lcd.setCursor(0, 1);
      lcd.print(userName);
      uidStates[uid] = false; // Reset state for the UID
      buzzPattern(2); // 2 beeps for exit
    }

    // Indicate success with green LED
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_BLUE, LOW);
  } else {
    // Invalid UID
    lcd.clear();
    lcd.print("Access Denied");
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_BLUE, LOW);
    buzzPattern(3); // 3 beeps for error/denied
  }

  delay(2000); // Wait before resetting LCD
  lcd.clear();
  lcd.print("Scan Your Card");
}

String getUserNameFromFirebase(String uid) {
  // Create HTTP GET request
  String httpRequest = "GET /users/" + uid + "/name.json?auth=" + String(FIREBASE_AUTH) + " HTTP/1.1\r\n";
  httpRequest += "Host: " + String(FIREBASE_HOST) + "\r\n";
  httpRequest += "Connection: close\r\n\r\n";

  // Send request to ESP-01
  espSerial.println(httpRequest);
  delay(1000);

  // Read response
  String response = "";
  while (espSerial.available()) {
    response += espSerial.readString();
  }

  // Parse JSON response
  int jsonStart = response.indexOf("\r\n\r\n") + 4;
  if (jsonStart > 4) {
    String jsonResponse = response.substring(jsonStart);
    StaticJsonDocument<200> doc;
    deserializeJson(doc, jsonResponse);
    if (doc.is<String>()) {
      return doc.as<String>();
    }
  }

  return ""; // Return empty string if UID is not found
}

void checkWiFiStatus() {
  lcd.clear();
  lcd.print("Connecting Wi-Fi");
  espSerial.println("AT+CWJAP?");
  delay(2000);

  String response = "";
  while (espSerial.available()) {
    response += espSerial.readString();
  }

  if (response.indexOf("OK") != -1) {
    lcd.clear();
    lcd.print("Wi-Fi Connected");
    digitalWrite(LED_BLUE, HIGH); // Indicate Wi-Fi connection with blue LED
    digitalWrite(LED_RED, LOW);
    isWiFiConnected = true; // Update Wi-Fi status
  } else {
    lcd.clear();
    lcd.print("Wi-Fi Not Found");
    digitalWrite(LED_RED, HIGH); // Indicate no Wi-Fi with red LED
    digitalWrite(LED_BLUE, LOW);
    isWiFiConnected = false; // Update Wi-Fi status
    delay(5000); // Retry after 5 seconds
  }

  delay(2000);
  lcd.clear();
  lcd.print("Scan Your Card");
}

void buzzPattern(int pattern) {
  for (int i = 0; i < pattern; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
}