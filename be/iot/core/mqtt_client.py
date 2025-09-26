# trong core/mqtt_client.py
# Import thư viện cần thiết
import paho.mqtt.client as mqtt
import json
from .models import DataSensor, HistoryAction
from .serializers import DataSensorSerializer, HistoryActionSerializer  # THÊM DÒNG NÀY
# Biến toàn cục để tránh khởi tạo nhiều client
sensor_client = None

def on_connect_sensor(client, userdata, flags, rc):
    print("Connected to MQTT Broker - Sensor")
    client.subscribe("datasensor")

def on_message_sensor(client, userdata, msg):
    # from .serializers import DataSensorSerializer
    try:
        data = json.loads(msg.payload.decode())
        print(f"Received sensor JSON: {data}")

        serializer = DataSensorSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            print("Saved sensor to DB:", serializer.data)
        else:
            print("Invalid sensor data:", serializer.errors)

    except Exception as e:
        print(f"Sensor Error: {e}")

history_client = None
def on_connect_history(client, userdata, flags, rc):
    print("Connected to MQTT Broker - History")
    client.subscribe("historyaction")
def on_message_history(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        print(f"Received history JSON: {data}")

        for device, action in data.items():
            history_data = {
                "device": device,   # "device1", "device2", "device3"
                "action": action    # "on" hoặc "off"
            }
            
            serializer = HistoryActionSerializer(data=history_data)
            if serializer.is_valid():
                serializer.save()
                print(f"Saved history to DB: {device} - {action}")
            else:
                print(f"Invalid history data: {serializer.errors}")

    except Exception as e:
        print(f"History Error: {e}")
def start_mqtt():
    global sensor_client , history_client
    if history_client is None:
        history_client = mqtt.Client()
        history_client.on_connect = on_connect_history
        history_client.on_message = on_message_history
        history_client.username_pw_set("anh123", "1234")
        history_client.connect("broker.hivemq.com", 1883, 60)
        history_client.loop_start()
        print("History MQTT Client started")
    if sensor_client is None:
        sensor_client = mqtt.Client()
        sensor_client.on_connect = on_connect_sensor
        sensor_client.on_message = on_message_sensor
        history_client.username_pw_set("anh123", "1234")
        sensor_client.connect("broker.hivemq.com", 1883, 60)
        sensor_client.loop_start()
        print("Sensor MQTT Client started")
    
    # Khởi tạo client cho history
