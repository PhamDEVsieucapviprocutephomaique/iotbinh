from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DataSensorViewSet, HistoryActionViewSet
from .views import get_latest_sensor,control_device,get_latest_chart,sort_data,search_data,filter_history,search_history
from .views import lasterdevice1,lasterdevice2,lasterdevice3,countpagedatasensor,countpagehistoryaction,device_status_stream
router = DefaultRouter()
router.register(r'datasensor', DataSensorViewSet, basename='datasensor')
router.register(r'historyaction', HistoryActionViewSet, basename='historyaction')

urlpatterns = [
    path('device/', control_device),
    path('device/stream/', device_status_stream),
    path('datasensor/latest/',get_latest_sensor),
    path('datasensor/chartlatest/',get_latest_chart),
    path('datasensor/sort/', sort_data),  # Cả GET và POST
    path('datasensor/search/', search_data),  # Thêm API search
    path('historyaction/filter/', filter_history), 
    path('historyaction/search/', search_history),  # Thêm API search history
    path('historyaction/laster/device1',lasterdevice1),
    path('historyaction/laster/device2',lasterdevice2),
    path('historyaction/laster/device3',lasterdevice3),
    path('datasensor/countpage/',countpagedatasensor),
    path('historyaction/countpage/',countpagehistoryaction),
    path('', include(router.urls)),

]