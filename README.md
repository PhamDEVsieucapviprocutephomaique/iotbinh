# iotbinh

# docker compose up --build -d

# docker compose stop

# localhost:3000 fe

# các chạy code : phải bật docker lên trước  , sau đó chạy dòng compose up --build- d ở trên
 fix : nếu lỗi  đang chiếm port thì  dùng lệnh kill port đang chiếm rồi chạy lại 
 ( nếu vẫn lỗi thử sửa lại là docker-compose cho dấu - vô giữa là đươc)
  bước 2: phải kết nối với wifi ( cả eps và máy tính đều phải chung 1 mang wifi điện thoại)
  sau đó chạy lệnh ipconfig IPv4 Address hoặc Địa chỉ IPv4 tìm địa chỉ ip ( khi kêt nối với  wifi , phat 4g bằng điện thoại)
  sau đó thay hết ví dụ ban đầu là :  "http://192.168.70.133:8000/api/datasensor/search/",       thay cái 192.168.70.133 thành ip của mfay : thay full các code trong datasensor, home chart,historyaction của fe ( mỗi cái tầm 3 cái api thôi : ctrl + f : tìm chỗ nào là 192.168.... rồi thay bằng của mày là đc tầm 2 phút là xong), và cả 3 dòng của file nhúng nữa : const char* api_device1 = "http://192.168.70.133:8000/api/historyaction/laster/device1";
const char* api_device2 = "http://192.168.70.133:8000/api/historyaction/laster/device2";
const char* api_device3 = "http://192.168.70.133:8000/api/historyaction/laster/device3"; đây thay bằng của mày ( bắt buộc vì nếu muốn bỏ qua cái này phải deploy ngrok các thứ mất time )
bước 3 : nếu lỗi cứ chạy lại docker là được , ( lưu ý dùng docker ko có ci cd lên mỗi lần muốn cặp nhật code thì phải chạy lại lệnh build nó mới cập nhật)


code mỗi file có 4-500 dòng là quá ít : k có chuyện file code có 2-30 dòng đâu =)) nhé ~~ 
