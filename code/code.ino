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
#define ESP_RX 0
#define ESP_TX 1

// Buzzer Pin
#define BUZZER_PIN 8

// LED Module Pins (HW-479)
#define LED_RED 13
#define LED_GREEN 12
#define LED_BLUE 11

// Firebase Details
const char* FIREBASE_HOST = "fdhf-4403b-default-rtdb.firebaseio.com"; // Firebase Realtime Database URL
const char* FIREBASE_AUTH = "Owh7MHTxs5FTxQ4KHPF885cFknNZlusGWhgHRB1i"; // Replace with your Firebase Database Secret

// Wi-Fi Credentials
const char* ssid = "test";
const char* password = "test1234";

// RFID Reader
MFRC522 mfrc522(SS_PIN, RST_PIN);

// LCD Display
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ESP-01 Communication
SoftwareSerial espSerial(ESP_RX, ESP_TX);

// Track Wi-Fi connection status
bool isWiFiConnected = false;

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
  connectToWiFi();
}

void loop() {
  // Monitor Wi-Fi status
  if (!isWiFiConnected) {
    connectToWiFi();
  }

  // Handle RFID scanning
  handleRFIDScan();
}

// Function 1: Connect ESP-01 to Wi-Fi
void connectToWiFi() {
  lcd.clear();
  lcd.print("Trying to connect");

  // Blink blue LED while trying to connect
  unsigned long startTime = millis();
  while (millis() - startTime < 8000) { // Blink for 8 seconds (connection timeout)
    digitalWrite(LED_BLUE, HIGH);
    delay(250);
    digitalWrite(LED_BLUE, LOW);
    delay(250);

    // Check if ESP-01 responds during blinking
    if (espSerial.available()) {
      break; // Exit blinking if a response is received
    }
  }

  // Send AT command to connect to Wi-Fi
  espSerial.println("AT+CWJAP=\"" + String(ssid) + "\",\"" + String(password) + "\"");
  delay(8000); // Wait for the connection to establish

  String response = "";
  while (espSerial.available()) {
    response += espSerial.readString();
  }

  if (response.indexOf("WIFI CONNECTED") != -1 || response.indexOf("OK") != -1) {
    lcd.clear();
    lcd.print("Wi-Fi Connected");
    digitalWrite(LED_BLUE, LOW);
    digitalWrite(LED_GREEN, HIGH); // Turn green LED on for successful connection
    digitalWrite(LED_RED, LOW);
    isWiFiConnected = true; // Update Wi-Fi status
    delay(2000);
    lcd.clear();
    lcd.print("Scan Your Card");
  } else {
    lcd.clear();
    lcd.print("Wi-Fi Failed");
    digitalWrite(LED_BLUE, LOW);
    digitalWrite(LED_RED, HIGH); // Turn red LED on for failed connection
    digitalWrite(LED_GREEN, LOW);
    isWiFiConnected = false; // Update Wi-Fi status
    delay(3000); // Retry after 3 seconds
  }
}

// Function 2: Handle RFID Scanning and Firebase Validation
void handleRFIDScan() {
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
    String userName = getUserNameFromFirebase(uid);

    if (userName != "") {
      // Valid UID
      lcd.clear();
      lcd.print("Welcome ");
      lcd.setCursor(0, 1);
      lcd.print(userName);
      buzzPattern(1); // 1 beep for valid UID
    } else {
      // Invalid UID
      lcd.clear();
      lcd.print("Invalid UID");
      buzzPattern(3); // 3 beeps for invalid UID
    }

    delay(2000); // Wait before resetting LCD
    lcd.clear();
    lcd.print("Scan Your Card");

    // Halt the card
    mfrc522.PICC_HaltA();
  }
}

// Function to get user name from Firebase
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

// Function to control buzzer patterns
void buzzPattern(int pattern) {
  for (int i = 0; i < pattern; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
}