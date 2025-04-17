#include <SPI.h>
#include <Wire.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>
#include <ArduinoJson.h>

// RFID Pins
#define SS_PIN 10
#define RST_PIN 9

// ESP-01 Pins - IMPORTANT: Don't use pins 0,1 as they're used by hardware Serial
#define ESP_RX 0  // Changed from 0
#define ESP_TX 1  // Changed from 1

// Buzzer Pin
#define BUZZER_PIN 8

// LED Module Pins (HW-479)
#define LED_RED 5
#define LED_GREEN 4
#define LED_BLUE 3

// Firebase Details
const char* FIREBASE_HOST = "fdhf-4403b-default-rtdb.firebaseio.com"; // Firebase Realtime Database URL
const char* FIREBASE_AUTH = "Owh7MHTxs5FTxQ4KHPF885cFknNZlusGWhgHRB1i"; // Firebase Database Secret

// Wi-Fi Credentials
const char* ssid = "test";
const char* password = "test12345";

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

  // Initialize ESP-01 with AT commands
  Serial.println("Resetting ESP-01");
  espSerial.println("AT+RST");
  delay(2000);
  while(espSerial.available()) espSerial.read(); // Clear buffer
  
  espSerial.println("AT+CWMODE=1"); // Set to station mode
  delay(1000);
  while(espSerial.available()) espSerial.read(); // Clear buffer

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
  lcd.print("connecting");
  Serial.println("Connecting to WiFi...");

  // Blink blue LED while trying to connect
  for (int i = 0; i < 4; i++) {
    digitalWrite(LED_BLUE, HIGH);
    delay(250);
    digitalWrite(LED_BLUE, LOW);
    delay(250);
  }

  // Clear any pending data
  while(espSerial.available()) espSerial.read();

  // Send AT command to connect to Wi-Fi
  String cmd = "AT+CWJAP=\"";
  cmd += ssid;
  cmd += "\",\"";
  cmd += password;
  cmd += "\"";
  espSerial.println(cmd);
  Serial.println("Sent: " + cmd);

  // Wait for response with longer timeout
  unsigned long startTime = millis();
  String response = "";
  bool connected = false;
  
  digitalWrite(LED_BLUE, HIGH); // Keep blue LED on while waiting
  
  while (millis() - startTime < 20000) { // 20 second timeout
    if (espSerial.available()) {
      char c = espSerial.read();
      response += c;
      Serial.write(c); // Monitor response
      
      // More lenient connection detection
      if (response.indexOf("CONNECTED") != -1 || response.indexOf("OK") != -1) {
        connected = true;
      }
      if (response.indexOf("FAIL") != -1 || response.indexOf("ERROR") != -1) {
        connected = false;
        break;
      }
    }
  }
  
  digitalWrite(LED_BLUE, LOW);


  
  if (connected) {
    lcd.clear();
    lcd.print("Wi-Fi Connected");
    digitalWrite(LED_GREEN, HIGH); // Turn green LED on for successful connection
    digitalWrite(LED_RED, LOW);
    isWiFiConnected = true; // Update Wi-Fi status
    
    // Set up single connection mode
    espSerial.println("AT+CIPMUX=0");
    delay(1000);
    while(espSerial.available()) espSerial.read();
    
    delay(2000);
    lcd.clear();
    lcd.print("Scan Your Card");
    Serial.println("WiFi connected successfully");
  } else {
    lcd.clear();
    lcd.print("Wi-Fi Failed");
    digitalWrite(LED_RED, HIGH); // Turn red LED on for failed connection
    digitalWrite(LED_GREEN, LOW);
    isWiFiConnected = false; // Update Wi-Fi status
    Serial.println("WiFi connection failed. Response: " + response);
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
    uid.toUpperCase(); // Ensure uppercase to match Firestore document ID
    
    // Display UID on LCD
    lcd.clear();
    lcd.print("UID:");
    lcd.setCursor(0, 1);
    lcd.print(uid);
    Serial.println("Card UID: " + uid);
    delay(2000);
    
    // Show checking message
    lcd.clear();
    lcd.print("Checking UID...");

    // Check UID in Firebase
    if (isWiFiConnected) {
      String userName = getUserNameFromRTDB(uid);

      if (userName != "" && userName != "Unknown") {
        // Valid UID - name found
        lcd.clear();
        lcd.print("Welcome");
        lcd.setCursor(0, 1);
        lcd.print(userName);
        buzzPattern(1); // 1 beep for valid UID
        digitalWrite(LED_GREEN, HIGH);
        delay(1000);
        digitalWrite(LED_GREEN, LOW);
      } else {
        // Invalid UID or name not found
        lcd.clear();
        lcd.print("Invalid Card");
        lcd.setCursor(0, 1);
        lcd.print("Access Denied");
        buzzPattern(3); // 3 beeps for invalid UID
        digitalWrite(LED_RED, HIGH);
        delay(1000);
        digitalWrite(LED_RED, LOW);
      }
    } else {
      lcd.clear();
      lcd.print("WiFi not connected");
      buzzPattern(2);
    }

    delay(2000); // Wait before resetting LCD
    lcd.clear();
    lcd.print("Scan Your Card");

    // Halt the card
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  }
}

// Function to get user name from Firebase RTDB
String getUserNameFromRTDB(String uid) {
  // Use RTDB instead of Firestore
  String urlPath = "/users/" + uid + ".json"; // Path to user data in RTDB
  
  Serial.println("Fetching user from RTDB: " + uid);
  
  // Start TCP connection
  String cmd = "AT+CIPSTART=\"TCP\",\"";  // Use TCP instead of SSL
  cmd += FIREBASE_HOST;
  cmd += "\",443";
  espSerial.println(cmd);
  delay(2000);
  
  String response = "";
  while (espSerial.available()) {
    response += (char)espSerial.read();
  }
  
  if (response.indexOf("ERROR") != -1) {
    Serial.println("TCP connection failed");
    return "Unknown";
  }
  
  // Create HTTP GET request
  String httpRequest = "GET " + urlPath + " HTTP/1.1\r\n";
  httpRequest += "Host: " + String(FIREBASE_HOST) + "\r\n";
  httpRequest += "Connection: close\r\n\r\n";
  
  // Send data length
  cmd = "AT+CIPSEND=";
  cmd += String(httpRequest.length());
  espSerial.println(cmd);
  delay(1000);
  
  // Send HTTP request
  if (espSerial.find(">")) {
    espSerial.print(httpRequest);
    
    // Wait for response
    unsigned long timeout = millis();
    response = "";
    
    while (millis() - timeout < 5000) {
      if (espSerial.available()) {
        response += (char)espSerial.read();
      }
    }
    
    Serial.println("Response: " + response);
    
    // Extract name from JSON response
    int nameStart = response.indexOf("\"name\":\"");
    if (nameStart > 0) {
      nameStart += 8; // Skip past "name":"
      int nameEnd = response.indexOf("\"", nameStart);
      if (nameEnd > 0) {
        String name = response.substring(nameStart, nameEnd);
        return name;
      }
    }
  }
  
  return "Unknown";
}

// Function to control buzzer patterns
void buzzPattern(int pattern) {
  for (int i = 0; i < pattern; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < pattern - 1) delay(200);
  }
}