#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Hardware Pins for ESP32 - CORRECTED TO AVOID CONFLICTS
#define SS_PIN 5      // SPI SS for RFID
#define RST_PIN 22    // RFID reset
#define BUZZER_PIN 21
#define LED_R 4       
#define LED_G 16      
#define LED_B 17      

// I2C pins for LCD - Moved to non-conflicting pins
#define SDA_PIN 25    // Changed from 23 to avoid SPI conflict
#define SCL_PIN 26    // Changed from 19 to avoid SPI conflict

// SPI pins for RFID
#define MOSI_PIN 23   // Default VSPI MOSI
#define MISO_PIN 19   // Default VSPI MISO
#define SCK_PIN 18    // Default VSPI SCK

// WiFi credentials
const char* ssid = "Home";
const char* password = "21277855aZe**";

// Firebase Details
const char* FIREBASE_HOST = "fdhf-4403b-default-rtdb.firebaseio.com";
const char* FIREBASE_AUTH = "Owh7MHTxs5FTxQ4KHPF885cFknNZlusGWhgHRB1i";

// Initialize components
MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2); // I2C LCD

// State variables
enum SystemState { CONNECTING_WIFI, READY_FOR_SCAN, PROCESSING_CARD };
SystemState currentState = CONNECTING_WIFI;
unsigned long stateTime = 0;
String currentUID = "";
bool wifiConnected = false;

void setup() {
  Serial.begin(115200);
  
  // Custom SPI initialization for ESP32
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN); // Don't include SS_PIN here
  rfid.PCD_Init();

  // Add a proper initialization check
  if (!rfid.PCD_PerformSelfTest()) {
    Serial.println("RFID reader test failed!");
    lcd.clear();
    lcd.print("RFID Error!");
    while (1) { 
      setLED(1, 0, 0); // Red LED for error
      delay(300);
      setLED(0, 0, 0);
      delay(300);
    }
  }
  Serial.println("RFID reader test passed!");
  
  // Initialize LCD with non-conflicting I2C
  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("Initializing...");
  
  // Add this to your setup()
  configTime(0, 0, "pool.ntp.org");

  // Rest of your setup code remains the same
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_R, OUTPUT);
  pinMode(LED_G, OUTPUT);
  pinMode(LED_B, OUTPUT);
  
  setLED(0, 0, 0);
  connectToWiFi();
}

// Add this function to show system status via LED
void updateStatusLED() {
  static unsigned long lastBlinkTime = 0;
  static bool ledState = false;
  
  switch (currentState) {
    case CONNECTING_WIFI:
      // Blinking blue for WiFi connecting
      if (millis() - lastBlinkTime > 300) {
        ledState = !ledState;
        setLED(0, 0, ledState ? 1 : 0);
        lastBlinkTime = millis();
      }
      break;
      
    case READY_FOR_SCAN:
      // Pulsing green to indicate ready
      if (millis() - lastBlinkTime > 1000) {
        ledState = !ledState;
        setLED(0, ledState ? 0.5 : 0, 0);
        lastBlinkTime = millis();
      }
      break;
      
    case PROCESSING_CARD:
      // Fast blinking purple for processing
      if (millis() - lastBlinkTime > 100) {
        ledState = !ledState;
        setLED(ledState ? 1 : 0, 0, ledState ? 1 : 0);
        lastBlinkTime = millis();
      }
      break;
  }
}

void loop() {
  // Add timeout handling
  unsigned long currentTime = millis();
  
  // If stuck in PROCESSING_CARD for too long (10 seconds)
  if (currentState == PROCESSING_CARD && (currentTime - stateTime > 10000)) {
    Serial.println("Processing timed out, returning to scan state");
    lcd.clear();
    lcd.print("Timeout!");
    delay(1000);
    lcd.clear();
    lcd.print("Scan your card");
    currentState = READY_FOR_SCAN;
  }
  
  // Call this at the beginning of loop()
  updateStatusLED();
  
  switch (currentState) {
    case CONNECTING_WIFI:
      // If WiFi connection drops, try to reconnect
      if (WiFi.status() != WL_CONNECTED) {
        connectToWiFi();
      } else {
        currentState = READY_FOR_SCAN;
        lcd.clear();
        lcd.print("Scan your card");
      }
      break;
      
    case READY_FOR_SCAN:
      handleRFIDScan();
      break;
      
    case PROCESSING_CARD:
      checkFirebaseResponse();
      break;
  }
}

void connectToWiFi() {
  lcd.clear();
  lcd.print("Connecting WiFi");
  Serial.println("Connecting to WiFi...");
  
  // Blink blue LED while connecting
  for (int i = 0; i < 4; i++) {
    setLED(0, 0, 1);
    delay(250);
    setLED(0, 0, 0);
    delay(250);
  }
  
  WiFi.begin(ssid, password);
  
  // Wait for connection with timeout
  unsigned long startMillis = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startMillis < 20000) {
    setLED(0, 0, 1);
    delay(250);
    setLED(0, 0, 0);
    delay(250);
    Serial.print(".");
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    setLED(0, 1, 0); // Green LED
    lcd.clear();
    lcd.print("WiFi Connected");
    Serial.println("\nWiFi Connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
    delay(2000);
    lcd.clear();
    lcd.print("Scan your card");
    currentState = READY_FOR_SCAN;
  } else {
    setLED(1, 0, 0); // Red LED
    lcd.clear();
    lcd.print("WiFi Failed!");
    Serial.println("\nWiFi connection failed!");
    wifiConnected = false;
    delay(3000);
    // Retry connection
    currentState = CONNECTING_WIFI;
  }
}

void handleRFIDScan() {
  static unsigned long lastScanTime = 0;
  static unsigned long lastAttemptTime = 0;
  
  if (millis() - lastScanTime < 3000) return; // 3-second cooldown
  
  // Try to wake up the RFID module periodically
  if (millis() - lastAttemptTime > 1000) {
    rfid.PCD_Init();      // Reinitialize reader
    lastAttemptTime = millis();
    Serial.println("Checking for RFID cards...");
  }

  // First check if card is present
  if (rfid.PICC_IsNewCardPresent()) {
    Serial.println("Card detected!");
    
    // Then try to read it
    if (rfid.PICC_ReadCardSerial()) {
      currentUID = getRFIDUID();
      Serial.print("Successfully read card UID: ");
      Serial.println(currentUID);
      
      lcd.clear();
      lcd.print("UID:");
      lcd.setCursor(0, 1);
      lcd.print(currentUID);

      // Rest of your code...
      
      lastScanTime = millis();
    } else {
      Serial.println("Failed to read card data");
      // Brief flash of red LED for failed read
      setLED(1, 0, 0);
      delay(200);
      setLED(0, 0, 0);
    }
  }
}

void checkFirebaseResponse() {
  // Using HTTPClient to communicate with Firebase
  String userName = getUserNameFromFirebase(currentUID);
  
  if (userName != "") {
    // Valid RFID - Now check if already clocked in today
    bool isClockOut = checkAlreadyClockedIn(currentUID);
    
    if (isClockOut) {
      // User already clocked in, so clock out
      lcd.clear();
      lcd.print("Goodbye");
      lcd.setCursor(0, 1);
      lcd.print(userName);
      setLED(0, 0, 1); // Blue for clock out
      beep(2); // 2 beeps for clock out
      
      // Record clock-out in Firebase
      recordAttendance(currentUID, userName, false); // false = clock out
    } else {
      // User not clocked in, so clock in
      lcd.clear();
      lcd.print("Welcome");
      lcd.setCursor(0, 1);
      lcd.print(userName);
      setLED(0, 1, 0); // Green for clock in
      beep(1); // 1 beep for clock in
      
      // Record clock-in in Firebase
      recordAttendance(currentUID, userName, true); // true = clock in
    }
  } else {
    // Invalid UID
    lcd.clear();
    lcd.print("Access Denied");
    lcd.setCursor(0, 1);
    lcd.print("Unknown Card");
    setLED(1, 0, 0); // Red for invalid
    beep(3);
  }

  delay(2000);
  lcd.clear();
  lcd.print("Scan your card");
  setLED(0, 0, 0); // Turn off LED
  currentState = READY_FOR_SCAN;
}

String getUserNameFromFirebase(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    return "";
  }
  
  HTTPClient http;
  
  // Format the URL path
  String url = "https://";
  url += FIREBASE_HOST;
  url += "/users/";
  url += uid;
  url += "/name.json";
  if (FIREBASE_AUTH != NULL && strlen(FIREBASE_AUTH) > 0) {
    url += "?auth=";
    url += FIREBASE_AUTH;
  }
  
  Serial.print("HTTP Request URL: ");
  Serial.println(url);
  
  http.begin(url);
  int httpCode = http.GET();
  
  String result = "";
  
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      Serial.println("Response: " + payload);
      
      // If not "null" and has content (quotes)
      if (payload != "null" && payload.indexOf("\"") != -1) {
        // Remove quotes
        payload.replace("\"", "");
        result = payload;
      }
    } else {
      Serial.printf("HTTP GET error: %d\n", httpCode);
    }
  } else {
    Serial.printf("HTTP connection failed: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
  return result;
}

// Function to check if user has already clocked in today
bool checkAlreadyClockedIn(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  HTTPClient http;
  String date = getCurrentDate();
  
  // Format the URL path to check attendance for today
  String url = "https://";
  url += FIREBASE_HOST;
  url += "/attendance/";
  url += date;
  url += "/";
  url += uid;
  url += ".json";
  
  http.begin(url);
  int httpCode = http.GET();
  
  bool clockedIn = false;
  if (httpCode > 0 && httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    
    // If record exists and has clockIn but no clockOut, user is clocked in
    if (payload != "null" && payload.indexOf("clockIn") > 0 && 
        payload.indexOf("clockOut") == -1) {
      clockedIn = true;
    }
  }
  
  http.end();
  return clockedIn;
}

// Function to record attendance (clock in or clock out)
void recordAttendance(String uid, String userName, bool isClockIn) {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  String date = getCurrentDate();
  
  // 1. Update attendance record
  String attendanceUrl = "https://";
  attendanceUrl += FIREBASE_HOST;
  attendanceUrl += "/attendance/";
  attendanceUrl += date;
  attendanceUrl += "/";
  attendanceUrl += uid;
  attendanceUrl += ".json";
  
  // Create JSON with timestamp (current millis as simple timestamp)
  String timestamp = String(millis());
  String jsonData;
  
  if (isClockIn) {
    jsonData = "{\"name\":\"" + userName + "\",\"clockIn\":" + timestamp + "}";
  } else {
    jsonData = "{\"clockOut\":" + timestamp + "}";
    // Use PATCH to preserve existing clockIn value
    attendanceUrl += "?x-http-method-override=PATCH";
  }
  
  http.begin(attendanceUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode;
  if (isClockIn) {
    httpCode = http.PUT(jsonData);
  } else {
    httpCode = http.PATCH(jsonData);
  }
  
  if (httpCode > 0) {
    Serial.printf("Attendance record %s: %d\n", 
      isClockIn ? "clock-in" : "clock-out", httpCode);
  }
  http.end();
  
  // 2. Update latest_scan for dashboard integration
  updateLatestScan(uid, userName, isClockIn);
}

// Function to update latest_scan for dashboard integration
void updateLatestScan(String uid, String userName, bool isClockIn) {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  
  // Format the URL for latest_scan
  String url = "https://";
  url += FIREBASE_HOST;
  url += "/latest_scan.json";
  
  // Create JSON with all required fields for dashboard
  String jsonData = "{";
  jsonData += "\"uid\":\"" + uid + "\",";
  jsonData += "\"name\":\"" + userName + "\",";
  jsonData += "\"action\":\"" + String(isClockIn ? "clockIn" : "clockOut") + "\",";
  jsonData += "\"timestamp\":" + String(millis());
  jsonData += "}";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.PUT(jsonData);
  
  if (httpCode > 0) {
    Serial.printf("Latest scan update: %d\n", httpCode);
  }
  http.end();
}

// Helper function to get current date as YYYY-MM-DD
String getCurrentDate() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return "2025-04-19"; // Fallback date
  }
  
  char dateStr[11];
  sprintf(dateStr, "%04d-%02d-%02d", 
          1900 + timeinfo.tm_year, 
          timeinfo.tm_mon + 1, 
          timeinfo.tm_mday);
  return String(dateStr);
}

String getRFIDUID() {
  String uid;
  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void beep(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < count - 1) delay(150);
  }
}

void setLED(int red, int green, int blue) {
  digitalWrite(LED_R, red);
  digitalWrite(LED_G, green);
  digitalWrite(LED_B, blue);
}