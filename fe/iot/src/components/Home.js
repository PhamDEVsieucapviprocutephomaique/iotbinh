import "../scss/Home.scss";
import { useState, useEffect, useCallback, useRef } from "react";
import ChartTemperature from "./Chart";
import axios from "axios";

const Home = () => {
  const [sensorData, setSensorData] = useState({
    temperature: 25,
    humidity: 40,
    light: 99,
  });

  const [deviceStates, setDeviceStates] = useState({
    aircon: false,
    light: false,
    fan: false,
  });

  const [loadingStates, setLoadingStates] = useState({
    aircon: false,
    light: false,
    fan: false,
  });

  // Ref để theo dõi trạng thái đang chờ SSE
  const pendingStatesRef = useRef({
    aircon: null,
    light: null,
    fan: null,
  });

  // ✅ 1. Lấy dữ liệu sensor cuối cùng
  const lastestdatasensor = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/datasensor/latest/"
      );
      const data = await response.json();
      setSensorData({
        temperature: data.temperature,
        humidity: data.humidity,
        light: data.light,
      });
    } catch (error) {
      console.error("Error fetching sensor data:", error);
    }
  };

  // ✅ 2. Lấy trạng thái ban đầu của devices khi web load
  const fetchInitialDeviceStates = async () => {
    try {
      const deviceMap = {
        aircon: "device1",
        light: "device2",
        fan: "device3",
      };

      const newDeviceStates = {};
      const newLoadingStates = {};

      for (const [device, apiDevice] of Object.entries(deviceMap)) {
        const response = await fetch(
          `http://127.0.0.1:8000/api/historyaction/laster/${apiDevice}`
        );
        const data = await response.json();
        const apiValue = data[apiDevice];

        newDeviceStates[device] = apiValue === "on";
        newLoadingStates[device] = apiValue === "on";
      }

      setDeviceStates(newDeviceStates);
      setLoadingStates(newLoadingStates);
      console.log("Initial device states:", newDeviceStates);
    } catch (error) {
      console.error("Error fetching initial device states:", error);
    }
  };

  // ✅ 3. Kết nối SSE để nhận realtime update từ backend
  useEffect(() => {
    const eventSource = new EventSource(
      "http://127.0.0.1:8000/api/device/stream/"
    );

    eventSource.onopen = () => {
      console.log("✅ SSE Connected");
    };

    eventSource.onmessage = (event) => {
      console.log("📡 Received SSE data:", event.data);

      const data = JSON.parse(event.data);
      console.log("📡 Parsed data:", data);

      const deviceMap = {
        device1: "aircon",
        device2: "light",
        device3: "fan",
      };

      const device = deviceMap[data.device];
      const isOn = data.action === "on";

      if (device) {
        // Kiểm tra xem có đang chờ trạng thái này không
        const isPendingState = pendingStatesRef.current[device] === isOn;

        if (isPendingState) {
          console.log(`✅ ${device} đã ${isOn ? "bật" : "tắt"} THÀNH CÔNG`);
          // Xóa trạng thái chờ
          pendingStatesRef.current[device] = null;
        }

        // Cập nhật UI với trạng thái thực tế từ backend
        setDeviceStates((prev) => ({ ...prev, [device]: isOn }));
        setLoadingStates((prev) => ({ ...prev, [device]: isOn }));
      }
    };

    eventSource.onerror = (error) => {
      console.error("❌ SSE Error:", error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // ✅ 4. Handle toggle - CHỈ GỬI LỆNH, KHÔNG THAY ĐỔI UI CHO ĐẾN KHI CÓ SSE
  const toggleControl = useCallback(
    async (controlName) => {
      const deviceMap = {
        aircon: "device1",
        light: "device2",
        fan: "device3",
      };

      const newState = !deviceStates[controlName];

      // QUAN TRỌNG: KHÔNG thay đổi loadingStates ở đây
      // Giữ nguyên trạng thái hiện tại cho đến khi nhận được SSE

      // Lưu trạng thái đang chờ vào ref
      pendingStatesRef.current[controlName] = newState;

      const postData = {
        [deviceMap[controlName]]: newState ? "on" : "off",
      };

      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/api/device/",
          postData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Device control command sent:", response.data);

        // KHÔNG cập nhật deviceStates và loadingStates ở đây - ĐỢI SSE XÁC NHẬN
      } catch (error) {
        console.error("Error controlling device:", error);
        // Nếu có lỗi, xóa trạng thái chờ
        pendingStatesRef.current[controlName] = null;
      }
    },
    [deviceStates]
  );

  // ✅ 5. Fetch dữ liệu ban đầu
  useEffect(() => {
    lastestdatasensor();
    fetchInitialDeviceStates();

    const intervalId = setInterval(lastestdatasensor, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const getCurrentDate = () => {
    const now = new Date();
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return `${days[now.getDay()]}, ngày ${now.getDate()} tháng ${
      now.getMonth() + 1
    } năm ${now.getFullYear()}`;
  };

  // Icon cánh quạt 3 cánh dạng SVG
  const FanIcon = ({ isActive }) => (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      className={`fan-icon ${isActive ? "active" : ""}`}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M12 2 L12 22" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2 L12 22"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(120 12 12)"
      />
      <path
        d="M12 2 L12 22"
        stroke="currentColor"
        strokeWidth="1.5"
        transform="rotate(240 12 12)"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );

  return (
    <div className="body-layout">
      <div className="info-row">
        <div className="info-box">
          <h3>Nhiệt độ</h3>
          <p>🌡️ {sensorData.temperature}°C</p>
        </div>
        <div className="info-box">
          <h3>Độ ẩm</h3>
          <p>💧 {sensorData.humidity}%</p>
        </div>
        <div className="info-box">
          <h3>Ánh sáng</h3>
          <p>☀️ {sensorData.light} nit</p>
        </div>
      </div>

      <div className="date-row">
        <p>{getCurrentDate()}</p>
      </div>

      <div className="main-row">
        <div className="chart-placeholder">
          <ChartTemperature />
        </div>
        <div className="controls-col">
          {/* Điều hòa */}
          <div className="switch-container">
            <div className="control-info">
              <span className={`icon ${loadingStates.aircon ? "active" : ""}`}>
                ❄️
              </span>
              <span className="control-text">
                {loadingStates.aircon ? "ON" : "OFF"}
              </span>
            </div>
            <div className="switch" onClick={() => toggleControl("aircon")}>
              <div
                className={`slider ${loadingStates.aircon ? "on" : "off"}`}
              ></div>
            </div>
          </div>

          {/* Đèn */}
          <div className="switch-container">
            <div className="control-info">
              <span className={`icon ${loadingStates.light ? "active" : ""}`}>
                💡
              </span>
              <span className="control-text">
                {loadingStates.light ? "ON" : "OFF"}
              </span>
            </div>
            <div className="switch" onClick={() => toggleControl("light")}>
              <div
                className={`slider ${loadingStates.light ? "on" : "off"}`}
              ></div>
            </div>
          </div>

          {/* Quạt */}
          <div className="switch-container">
            <div className="control-info">
              <span className={`icon ${loadingStates.fan ? "active" : ""}`}>
                <FanIcon isActive={loadingStates.fan} />
              </span>
              <span className="control-text">
                {loadingStates.fan ? "ON" : "OFF"}
              </span>
            </div>
            <div className="switch" onClick={() => toggleControl("fan")}>
              <div
                className={`slider ${loadingStates.fan ? "on" : "off"}`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
