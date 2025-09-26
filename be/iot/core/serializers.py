from rest_framework import serializers
from .models import DataSensor
from .models import HistoryAction
from django.utils import timezone

class DataSensorSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()
    class Meta:
        model = DataSensor
        fields = '__all__'
        # Hoặc chỉ định cụ thể các field:
        # fields = ['id', 'temperature', 'humidity', 'light', 'time']
    def get_time(self, obj):
        # Chuyển về timezone Việt Nam
        vn_time = timezone.localtime(obj.time)
        # Định dạng
        return vn_time.strftime("%Y-%m-%d %H:%M:%S")


class HistoryActionSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()
    class Meta:
        model = HistoryAction
        fields = '__all__'
        # Hoặc chỉ định cụ thể các field:
        # fields = ['id', 'device', 'action', 'time']
    def get_time(self, obj):
        # Chuyển về timezone Việt Nam
        vn_time = timezone.localtime(obj.time)
        # Định dạng
        return vn_time.strftime("%Y-%m-%d %H:%M:%S")