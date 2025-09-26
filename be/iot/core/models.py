from django.db import models
from django.utils import timezone

class DataSensor(models.Model):
    temperature = models.FloatField()  # Nhiệt độ
    humidity = models.FloatField()     # Độ ẩm  
    light = models.FloatField()        # Ánh sáng
    time = models.DateTimeField(default=timezone.now)  # Thời gian
    
    class Meta:
        db_table = 'datasensor'
        
    def __str__(self):
        return f"Sensor Data - Temp: {self.temperature}, Humid: {self.humidity}, Light: {self.light}"
    
class HistoryAction(models.Model):
    device = models.CharField(max_length=10)  # Thiết bị: device1, device2, device3
    action = models.CharField(max_length=5)   # Hành động: on, off
    time = models.DateTimeField(default=timezone.now)  # Thời gian
    
    class Meta:
        db_table = 'historyaction'
        
    def __str__(self):
        return f"{self.device} - {self.action}"
