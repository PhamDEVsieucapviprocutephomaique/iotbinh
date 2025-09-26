from django.apps import AppConfig
import threading
import os


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    mqtt_started = False  # Biến cờ để theo dõi


    def ready(self):
        if not self.mqtt_started and os.environ.get('RUN_MAIN') == 'true':
            from . import mqtt_client
            self.mqtt_started = True
            
            # Chạy MQTT client trong background thread
            thread = threading.Thread(target=mqtt_client.start_mqtt)
            thread.daemon = True
            thread.start()