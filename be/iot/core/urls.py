from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DataSensorViewSet, HistoryActionViewSet
from .views import get_latest_sensor,control_device,get_latest_chart,sort_data,search_data,filter_history,search_history

router = DefaultRouter()
router.register(r'datasensor', DataSensorViewSet, basename='datasensor')
router.register(r'historyaction', HistoryActionViewSet, basename='historyaction')

urlpatterns = [
    path('device/', control_device),
    path('datasensor/latest/',get_latest_sensor),
    path('datasensor/chartlatest/',get_latest_chart),
    path('datasensor/sort/', sort_data),  # Cả GET và POST
    path('datasensor/search/', search_data),  # Thêm API search
    path('historyaction/filter/', filter_history), 
    path('historyaction/search/', search_history),  # Thêm API search history
    path('', include(router.urls)),

]
