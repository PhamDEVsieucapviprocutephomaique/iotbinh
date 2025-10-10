
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DataSensor, HistoryAction
from .serializers import DataSensorSerializer, HistoryActionSerializer
from django.utils.timezone import localtime
import json
import time
import paho.mqtt.publish as publish
from django.http import StreamingHttpResponse,HttpResponse

# API lấy tất cả dữ liệu sensor
class DataSensorViewSet(viewsets.ModelViewSet):
    queryset = DataSensor.objects.all().order_by('id')  
    serializer_class = DataSensorSerializer

# # API lấy tất cả history action
class HistoryActionViewSet(viewsets.ModelViewSet):
    queryset = HistoryAction.objects.all().order_by('time')
    serializer_class = HistoryActionSerializer

# API custom: lấy sensor mới nhất
@api_view(['GET'])
def get_latest_sensor(request):
    latest = DataSensor.objects.order_by('-time').first()  # lấy bản ghi mới nhất theo time
    if latest:
        serializer = DataSensorSerializer(latest)   
        return Response(serializer.data)
    return Response({"detail": "No data found."}, status=404)


@api_view(['GET'])

def get_latest_chart(request):
    latest_20 = DataSensor.objects.order_by('-time')[:20]
    # Đảo ngược để có thứ tự từ cũ đến mới
    latest_20_ordered = reversed(latest_20)
    
    if latest_20:
        serializer = DataSensorSerializer(latest_20_ordered, many=True)   
        return Response(serializer.data)
    return Response({"detail": "No data found."}, status=404)


last_device_data = {}

@api_view(['POST', 'GET'])
def control_device(request):
    global last_device_data
    
    if request.method == 'POST':
        data = json.loads(request.body)
        last_device_data = data
        publish.single("device", 
            payload=json.dumps(data), 
            hostname="broker.hivemq.com")
        return Response({"data": data})

    elif request.method == 'GET':
        return Response({
            "data": last_device_data
        })
    

# API lọc dữ liệu - GET
# @api_view(['GET', 'POST'])
@api_view(['GET', 'POST'])
def sort_data(request):
    if request.method == 'GET':
        # Lấy từ query parameters
        attribute = request.GET.get('attribute')
        sort_type = request.GET.get('type')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
    else:  # POST
        # Lấy từ body
        attribute = request.data.get('attribute')
        sort_type = request.data.get('type')
        page = int(request.data.get('page', 1))
        page_size = int(request.data.get('page_size', 10))
    
    # Kiểm tra bắt buộc có cả attribute và type
    if not attribute or not sort_type:
        return Response({"detail": "Missing required parameters: attribute and type"}, status=400)
    
    # Danh sách attribute hợp lệ
    valid_attributes = ['id', 'time', 'temperature', 'humidity', 'light']
    
    if attribute not in valid_attributes:
        return Response({"detail": "Invalid attribute. Choose from: id, time, temperature, humidity, light"}, status=400)
    
    if sort_type not in ['asc', 'desc']:
        return Response({"detail": "Invalid type. Choose from: asc, desc"}, status=400)
    
    # Xử lý sort
    order_prefix = '-' if sort_type == 'desc' else ''
    all_data = DataSensor.objects.all().order_by(f'{order_prefix}{attribute}')
    
    # Pagination
    total_count = all_data.count()
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    
    # Lấy dữ liệu theo trang
    paginated_data = all_data[start_index:end_index]
    
    serializer = DataSensorSerializer(paginated_data, many=True)
    
    # THÊM FORMAT=JSON VÀO URL HOẶC DÙNG JsonResponse
    return Response(serializer.data)
# 
# API search dữ liệu - cả GET và POST
@api_view(['GET', 'POST'])
def search_data(request):
    if request.method == 'GET':
        # Lấy từ query parameters
        search_value = request.GET.get('search')
        search_type = request.GET.get('type')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
    else:  # POST
        # Lấy từ body
        search_value = request.data.get('search')
        search_type = request.data.get('type')
        page = int(request.data.get('page', 1))
        page_size = int(request.data.get('page_size', 10))
    
    # Kiểm tra bắt buộc có cả search_value và search_type
    if not search_value or not search_type:
        return Response({"detail": "Missing required parameters: search and type"}, status=400)
    
    # Danh sách search_type hợp lệ
    valid_types = ['id', 'time', 'temperature', 'humidity', 'light']
    
    if search_type not in valid_types:
        return Response({"detail": "Invalid type. Choose from: id, time, temperature, humidity, light"}, status=400)
    
    # Lấy tất cả dữ liệu trước
    all_data = DataSensor.objects.all()
    results = []
    
    # Xử lý search thủ công
    for item in all_data:
        if search_type == 'id':
            if search_value in str(item.id):
                results.append(item)
        elif search_type == 'time':
            # Format time giống như serializer
            vn_time = localtime(item.time)
            formatted_time = vn_time.strftime("%Y-%m-%d %H:%M:%S")
            if search_value in formatted_time:
                results.append(item)
        elif search_type == 'temperature':
            if search_value in str(item.temperature):
                results.append(item)
        elif search_type == 'humidity':
            if search_value in str(item.humidity):
                results.append(item)
        elif search_type == 'light':
            if search_value in str(item.light):
                results.append(item)
    
    # Pagination - chỉ lấy dữ liệu theo trang
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_results = results[start_index:end_index]
    
    serializer = DataSensorSerializer(paginated_results, many=True)
    return Response(serializer.data)
# API lọc history action - cả GET và POST
# API lọc history action - cả GET và POST
@api_view(['GET', 'POST'])
def filter_history(request):
    if request.method == 'GET':
        # Lấy từ query parameters
        device_filter = request.GET.get('device')
        action_filter = request.GET.get('action')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
    else:  # POST
        # Lấy từ body
        device_filter = request.data.get('device')
        action_filter = request.data.get('action')
        page = int(request.data.get('page', 1))
        page_size = int(request.data.get('page_size', 10))
    
    # Bắt đầu với tất cả records
    results = HistoryAction.objects.all()
    
    # Áp dụng filter nếu có
    if device_filter:
        results = results.filter(device__iexact=device_filter)
    
    if action_filter:
        results = results.filter(action__iexact=action_filter.lower())  # Chuyển về chữ thường để so sánh
    
    # Sắp xếp theo thời gian mới nhất
    results = results.order_by('time')
    
    # Pagination - chỉ lấy dữ liệu theo trang
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_results = results[start_index:end_index]
    
    serializer = HistoryActionSerializer(paginated_results, many=True)
    return Response(serializer.data)


    # API search history action theo time - cả GET và POST
# API search history action theo time - cả GET và POST
@api_view(['GET', 'POST'])
def search_history(request):
    if request.method == 'GET':
        # Lấy từ query parameters
        search_time = request.GET.get('time')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
    else:  # POST
        # Lấy từ body
        search_time = request.data.get('time')
        page = int(request.data.get('page', 1))
        page_size = int(request.data.get('page_size', 10))
    
    # Kiểm tra bắt buộc có search_time
    if not search_time:
        return Response({"detail": "Missing required parameter: time"}, status=400)
    
    # Lấy tất cả dữ liệu trước
    all_data = HistoryAction.objects.all()
    results = []
    
    # Xử lý search thủ công
    for item in all_data:
        # Format time giống như serializer
        vn_time = localtime(item.time)
        formatted_time = vn_time.strftime("%Y-%m-%d %H:%M:%S")
        if search_time in formatted_time:
            results.append(item)
    
    # Sắp xếp theo thời gian mới nhất
    results.sort(key=lambda x: x.time, reverse=True)
    
    # Pagination - chỉ lấy dữ liệu theo trang
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_results = results[start_index:end_index]
    
    serializer = HistoryActionSerializer(paginated_results, many=True)
    return Response(serializer.data)
# tra ve cac gia tri cuoi cung cua device
@api_view(['GET'])
def lasterdevice1(request):
    latest_action = HistoryAction.objects.filter(device='device1').order_by('-time').first()
    result = {'device1': latest_action.action if latest_action else 'unknown'}
    return Response(result)

@api_view(['GET'])
def lasterdevice2(request):
    latest_action = HistoryAction.objects.filter(device='device2').order_by('-time').first()
    result = {'device2': latest_action.action if latest_action else 'unknown'}
    return Response(result)

@api_view(['GET'])
def lasterdevice3(request):
    latest_action = HistoryAction.objects.filter(device='device3').order_by('-time').first()
    result = {'device3': latest_action.action if latest_action else 'unknown'}
    return Response(result)


@api_view(['GET', 'POST'])
def countpagedatasensor(request):
    if request.method == 'GET':
        page_size = int(request.GET.get('page_size', 10))
    else:  # POST
        page_size = int(request.data.get('page_size', 10))
    
    total_count = DataSensor.objects.count()
    total_pages = (total_count + page_size - 1) // page_size
    
    return Response({
        "total_pages": total_pages,
        "total_count": total_count,
        "page_size": page_size
    })

@api_view(['GET', 'POST'])
def countpagehistoryaction(request):
    if request.method == 'GET':
        page_size = int(request.GET.get('page_size', 10))
    else:  # POST
        page_size = int(request.data.get('page_size', 10))
    
    total_count = HistoryAction.objects.count()
    total_pages = (total_count + page_size - 1) // page_size
    
    return Response({
        "total_pages": total_pages,
        "total_count": total_count,
        "page_size": page_size
    })




#socket

# @api_view(['GET'])
def device_status_stream(request):
    
    def event_stream():
        last_ids = {'device1': None, 'device2': None, 'device3': None}
        
        while True:
            try:
                # KIỂM TRA NHANH HƠN
                for device in ['device1', 'device2', 'device3']:
                    latest = HistoryAction.objects.filter(device=device).order_by('-time').first()
                    if latest and latest.id != last_ids[device]:
                        last_ids[device] = latest.id
                        data = json.dumps({
                            'device': device,
                            'action': latest.action,
                            'time': latest.time.strftime("%Y-%m-%d %H:%M:%S")
                        })
                        yield f"data: {data}\n\n"
                
                time.sleep(0.01)  # 🎯 GIẢM XUỐNG 10ms
                
            except Exception as e:
                print(f"SSE Error: {e}")
                break
    
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no' 
    response['Access-Control-Allow-Origin'] = '*'
    return response