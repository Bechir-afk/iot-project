#include <SPI.h>
#include <MFRC522.h>
#include <FirebaseESP8266.h>
#include <time.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <map>

// RFID Pins
#define SS_PIN 10
#define RST_PIN 9
MFRC522 mfrc522(SS_PIN, RST_PIN);

// LED Pins
#define GREEN_LED_PIN 4
#define RED_LED_PIN 5

// LCD Configuration
LiquidCrystal_I2C lcd(0x27, 16, 2); // Set the LCD address to 0x27 for a 16x2 display

// Wi-Fi Credentials
const char* ssid = "YOUR_SSID"; // Replace with your Wi-Fi SSID
const char* password = "YOUR_PASSWORD"; // Replace with your Wi-Fi password

// Firebase Configuration
#define FIREBASE_HOST "fdhf-4403b-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "Owh7MHTxs5FTxQ4KHPF885cFknNZlusGWhgHRB1i"

FirebaseData firebaseData;

// Track RFID scan status
std::map<String, bool> uidStatus; // true = clocked in, false = not clocked in

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("RFID Attendance");
  lcd.setCursor(0, 1);
  lcd.print("System Ready");
  
  // Initialize LED pins
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  
  // Turn off LEDs initially
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  
  Serial.println("RFID Reader Initialized");

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to Wi-Fi...");
    lcd.setCursor(0, 1);
    lcd.print("Connecting Wi-Fi");
  }
  Serial.println("Connected to Wi-Fi");
  lcd.setCursor(0, 1);
  lcd.print("Wi-Fi Connected ");

  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);

  // Initialize NTP for timestamps
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Waiting for NTP time sync...");
  lcd.setCursor(0, 1);
  lcd.print("Syncing time... ");
  
  while (time(nullptr) < 100000) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nTime synchronized");
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Scan Your Card");
  lcd.setCursor(0, 1);
  lcd.print("to Clock In/Out");
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Read the UID of the card
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  Serial.println("UID: " + uid);

  // Get the current timestamp
  String timestamp = getTimestamp();

  // Send data to Firebase
  sendToFirebase(uid, timestamp);

  // Provide feedback
  Serial.println("Data sent to Firebase.");
  delay(2000);
  
  // Reset display after delay
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Scan Your Card");
  lcd.setCursor(0, 1);
  lcd.print("to Clock In/Out");
}

void sendToFirebase(String uid, String timestamp) {
  bool success = true;
  bool isClockingIn = !uidStatus.count(uid) || !uidStatus[uid];
  
  // First, update the attendance records
  String attendancePath = "/attendance";
  FirebaseJson attendanceJson;
  attendanceJson.set("uid", uid);
  attendanceJson.set("timestamp", timestamp);
  attendanceJson.set("status", isClockingIn ? "in" : "out");

  if (Firebase.pushJSON(firebaseData, attendancePath, attendanceJson)) {
    Serial.println("Attendance recorded successfully.");
  } else {
    Serial.println("Failed to record attendance.");
    Serial.println(firebaseData.errorReason());
    success = false;
  }

  // Then update latest_scan node for real-time dashboard detection
  String latestScanPath = "/latest_scan";
  FirebaseJson latestScanJson;
  latestScanJson.set("uid", uid);
  latestScanJson.set("timestamp", timestamp);
  latestScanJson.set("status", isClockingIn ? "in" : "out");
  latestScanJson.set("scanTime", millis());  // Add this to ensure updates are detected

  if (Firebase.setJSON(firebaseData, latestScanPath, latestScanJson)) {
    Serial.println("Latest scan updated successfully.");
  } else {
    Serial.println("Failed to update latest scan.");
    Serial.println(firebaseData.errorReason());
    success = false;
  }

  // Get user's name from Firebase
  String userName = "User"; // Default name
  if (success) {
    String userPath = "/users/" + uid + "/name";
    if (Firebase.getString(firebaseData, userPath)) {
      if (firebaseData.stringData().length() > 0) {
        userName = firebaseData.stringData();
      }
    }
  }

  // Display appropriate message based on clock in/out status
  lcd.clear();
  lcd.setCursor(0, 0);
  
  if (isClockingIn) {
    lcd.print("Welcome");
    lcd.setCursor(0, 1);
    lcd.print(userName);
    uidStatus[uid] = true; // Mark as clocked in
  } else {
    lcd.print("Goodbye");
    lcd.setCursor(0, 1);
    lcd.print("Have a good day");
    uidStatus[uid] = false; // Mark as clocked out
  }

  // Provide LED feedback
  if (success) {
    // Success - turn on green LED
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(RED_LED_PIN, LOW);
    delay(1000);
    digitalWrite(GREEN_LED_PIN, LOW);
  } else {
    // Error - turn on red LED
    digitalWrite(RED_LED_PIN, HIGH);
    digitalWrite(GREEN_LED_PIN, LOW);
    delay(1000);
    digitalWrite(RED_LED_PIN, LOW);
  }
}

String getTimestamp() {
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  char buffer[20];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", timeinfo);
  return String(buffer);
}
