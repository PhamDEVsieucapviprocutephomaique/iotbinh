#include <Wire.h>
#include <BH1750.h>
#include <DHT.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

const char* ssid = "Thatte";
const char* password = "doinhucac";
const char* mqtt_server = "broker.hivemq.com";  

const char* mqtt_user = "anh123";
const char* mqtt_password = "1234";

// API endpoints để lấy trạng thái cuối cùng
const char* api_device1 = "http://192.168.70.133:8000/api/historyaction/laster/device1";
const char* api_device2 = "http://192.168.70.133:8000/api/historyaction/laster/device2";
const char* api_device3 = "http://192.168.70.133:8000/api/historyaction/laster/device3";
#define DHTPIN D4
#define DHTTYPE DHT22
#define LED1 D5
#define LED2 D6
#define LED3 D7

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastSensorPublish = 0;
const long sensorInterval = 3000;

void setup_wifi() {
  Serial.begin(115200);
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// Hàm lấy trạng thái từ API
String getDeviceState(const char* apiUrl) {
  HTTPClient http;
  WiFiClient client;
  
  http.begin(client, apiUrl);
  int httpCode = http.GET();
  
  String state = "off"; // Mặc định là off nếu không lấy được
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.print("API Response: ");
    Serial.println(payload);
    
    // Parse JSON
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      // Lấy tên device từ URL (device1, device2, device3)
      String url = String(apiUrl);
      String deviceName = "";
      
      if (url.indexOf("device1") != -1) deviceName = "device1";
      else if (url.indexOf("device2") != -1) deviceName = "device2";
      else if (url.indexOf("device3") != -1) deviceName = "device3";
      
      if (deviceName != "" && doc.containsKey(deviceName)) {
        state = doc[deviceName].as<String>();
      }
    }
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpCode);
  }
  
  http.end();
  return state;
}

// Hàm khôi phục trạng thái các đèn từ API
void restoreDeviceStates() {
  Serial.println("\n=== Restoring device states from API ===");
  
  // Device 1
  String state1 = getDeviceState(api_device1);
  if (state1 == "on") {
    digitalWrite(LED1, HIGH);
    Serial.println("Device1 restored: ON");
  } else {
    digitalWrite(LED1, LOW);
    Serial.println("Device1 restored: OFF");
  }
  delay(100);
  
  // Device 2
  String state2 = getDeviceState(api_device2);
  if (state2 == "on") {
    digitalWrite(LED2, HIGH);
    Serial.println("Device2 restored: ON");
  } else {
    digitalWrite(LED2, LOW);
    Serial.println("Device2 restored: OFF");
  }
  delay(100);
  
  // Device 3
  String state3 = getDeviceState(api_device3);
  if (state3 == "on") {
    digitalWrite(LED3, HIGH);
    Serial.println("Device3 restored: ON");
  } else {
    digitalWrite(LED3, LOW);
    Serial.println("Device3 restored: OFF");
  }
  
  Serial.println("=== Device states restored ===\n");
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);
  
  if (String(topic) == "device") {
    String historyJson = "{";
    bool firstDevice = true;
    
    // Xử lý điều khiển device1 và thêm vào history
    if (message.indexOf("\"device1\": \"on\"") != -1) {
      digitalWrite(LED1, HIGH);
      if (!firstDevice) historyJson += ", ";
      historyJson += "\"device1\": \"on\"";
      firstDevice = false;
      Serial.println("Device1 turned ON");
    } else if (message.indexOf("\"device1\": \"off\"") != -1) {
      digitalWrite(LED1, LOW);
      if (!firstDevice) historyJson += ", ";
      historyJson += "\"device1\": \"off\"";
      firstDevice = false;
      Serial.println("Device1 turned OFF");
    }
    
    // Xử lý điều khiển device2 và thêm vào history
    if (message.indexOf("\"device2\": \"on\"") != -1) {
      digitalWrite(LED2, HIGH);
      if (!firstDevice) historyJson += ", ";
      historyJson += "\"device2\": \"on\"";
      firstDevice = false;
      Serial.println("Device2 turned ON");
    } else if (message.indexOf("\"device2\": \"off\"") != -1) {
      digitalWrite(LED2, LOW);
      if (!firstDevice) historyJson += ", ";
      historyJson += "\"device2\": \"off\"";
      firstDevice = false;
      Serial.println("Device2 turned OFF");
    }
    
    // Xử lý điều khiển device3 và thêm vào history
    if (message.indexOf("\"device3\": \"on\"") != -1) {
      digitalWrite(LED3, HIGH);
      if (!firstDevice) historyJson += ", ";
      historyJson += "\"device3\": \"on\"";
      firstDevice = false;
      Serial.println("Device3 turned ON");
    } else if (message.indexOf("\"device3\": \"off\"") != -1) {
      digitalWrite(LED3, LOW);
      if (!firstDevice) historyJson += ", ";
      historyJson += "\"device3\": \"off\"";
      firstDevice = false;
      Serial.println("Device3 turned OFF");
    }
    
    historyJson += "}";
    
    // Pub lịch sử hành động đến topic historyaction
    client.publish("historyaction", historyJson.c_str());
    Serial.print("Published to historyaction: ");
    Serial.println(historyJson);
  }
}

void reconnect() {
  while (!client.connected()) {
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      client.subscribe("device");
      Serial.println("MQTT connected and subscribed to 'device' topic");
    } else {
      delay(1000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  // Khởi tạo LED pins
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);
  
  // Tắt hết đèn ban đầu
  digitalWrite(LED1, LOW);
  digitalWrite(LED2, LOW);
  digitalWrite(LED3, LOW);
  Serial.println("LEDs initialized (OFF)");

  Wire.begin(D2, D1);
  lightMeter.begin();
  dht.begin();

  setup_wifi();
  
  // Khôi phục trạng thái từ API sau khi đã kết nối WiFi
  restoreDeviceStates();
  
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  randomSeed(micros());
  
  Serial.println("Setup completed");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastSensorPublish > sensorInterval) {
    lastSensorPublish = now;

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    float l = lightMeter.readLightLevel();

    if (!isnan(h) && !isnan(t)) {
      Serial.print("Temperature: ");
      Serial.print(t);
      Serial.print("°C, Humidity: ");
      Serial.print(h);
      Serial.print("%, Light: ");
      Serial.print(l);
      Serial.println(" lux");
      
      // Pub giá trị cảm biến dạng JSON
      String sensorJson = "{\"temperature\": " + String(t) + 
                         ", \"humidity\": " + String(h) + 
                         ", \"light\": " + String(l) + "}";
      client.publish("datasensor", sensorJson.c_str());
      Serial.println("Published to datasensor: " + sensorJson);
    } else {
      Serial.println("Failed to read from DHT sensor!");
    }
  }
  delay(5000);
}
