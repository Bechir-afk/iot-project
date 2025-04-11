#include <SPI.h>
#include <MFRC522.h>
#include <SoftwareSerial.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <map> // Include map for tracking UIDs

// RFID
#define SS_PIN 10
#define RST_PIN 9
MFRC522 mfrc522(SS_PIN, RST_PIN);

// ESP8266
SoftwareSerial esp8266(2, 3); // RX, TX

// Optional Components
#define BUZZER_PIN 5
#define RED_PIN 6
#define GREEN_PIN 7
#define BLUE_PIN 8
LiquidCrystal_I2C lcd(0x27, 16, 2);

std::map<String, bool> uidStates; // Map to track UIDs and their states

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();

  // ESP8266 init
  esp8266.begin(9600);
  sendCommand("AT");
  sendCommand("AT+CWMODE=1");
  sendCommand("AT+CWJAP=\"YOUR_SSID\",\"YOUR_PASSWORD\"");

  // Optional
  lcd.begin();
  lcd.backlight();
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  lcd.print("RFID Ready");
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    showColor("blue"); // Turn LED blue when no card is detected
    return;
  }

  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  Serial.println("UID: " + uid);

  lcd.clear();

  // Check if the UID is already in the map
  if (uidStates.find(uid) == uidStates.end() || !uidStates[uid]) {
    // First scan: Show "Welcome"
    lcd.print("Welcome");
    uidStates[uid] = true; // Mark as scanned
  } else {
    // Second scan: Show "Goodbye"
    lcd.print("Goodbye");
    uidStates[uid] = false; // Reset state for the UID
  }

  // Turn LED green and activate buzzer for 2 seconds
  showColor("green");
  buzz(2000); // Buzzer for 2 seconds
  sendToFirebase(uid);

  delay(2000);
  showColor("off");
  lcd.clear();
  lcd.print("RFID Ready");
}

void sendToFirebase(String uid) {
  String host = "your-project-id.firebaseio.com";
  String url = "/attendance.json";
  String data = "{\"uid\":\"" + uid + "\",\"timestamp\":\"" + String(millis()) + "\"}";

  sendCommand("AT+CIPMUX=1");
  sendCommand("AT+CIPSTART=0,\"TCP\",\"" + host + "\",80");
  delay(1000);

  String request = "POST " + url + " HTTP/1.1\r\n" +
                   "Host: " + host + "\r\n" +
                   "Content-Type: application/json\r\n" +
                   "Content-Length: " + data.length() + "\r\n\r\n" +
                   data;

  sendCommand("AT+CIPSEND=0," + String(request.length()));
  delay(500);
  esp8266.print(request);
  delay(1000);
  sendCommand("AT+CIPCLOSE=0");
}

void sendCommand(String cmd) {
  esp8266.println(cmd);
  delay(500);
  while (esp8266.available()) {
    Serial.write(esp8266.read());
  }
}

void buzz(int duration) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration);
  digitalWrite(BUZZER_PIN, LOW);
}

void buzz() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(200);
  digitalWrite(BUZZER_PIN, LOW);
}

void showColor(String color) {
  if (color == "green") {
    digitalWrite(RED_PIN, LOW);
    digitalWrite(GREEN_PIN, HIGH);
    digitalWrite(BLUE_PIN, LOW);
  } else if (color == "red") {
    digitalWrite(RED_PIN, HIGH);
    digitalWrite(GREEN_PIN, LOW);
    digitalWrite(BLUE_PIN, LOW);
  } else if (color == "blue") {
    digitalWrite(RED_PIN, LOW);
    digitalWrite(GREEN_PIN, LOW);
    digitalWrite(BLUE_PIN, HIGH);
  } else {
    digitalWrite(RED_PIN, LOW);
    digitalWrite(GREEN_PIN, LOW);
    digitalWrite(BLUE_PIN, LOW);
  }
}
