import "../scss/Home.scss";
import { useState, useEffect, useCallback } from "react";
import ChartTemperature from "./Chart";
import axios from "axios";
const Home = () => {
  const [sensorData, setSensorData] = useState({
    temperature: 25,
    humidity: 40,
    light: 99,
  });

  // dodnaj này để lấy api giữ liệu sensor cuối cùng
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

  const getInitialControls = () => {
    const savedControls = localStorage.getItem("homeControls");
    if (savedControls) {
      return JSON.parse(savedControls);
    }
    return {
      aircon: false,
      light: false,
      fan: false,
    };
  };

  const [controls, setControls] = useState(getInitialControls);

  // Lưu vào localStorage mỗi khi controls thay đổi
  useEffect(() => {
    localStorage.setItem("homeControls", JSON.stringify(controls));
  }, [controls]);

  useEffect(() => {
    lastestdatasensor();
    const intervalId = setInterval(lastestdatasensor, 5000);

    const savedControls = localStorage.getItem("homeControls");
    if (savedControls) {
      setControls(JSON.parse(savedControls));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("homeControls", JSON.stringify(controls));
  }, [controls]);
  // fix đoạn này để post lệnh bật tắt đèn cho backend
  const toggleControl = useCallback(
    async (controlName) => {
      const deviceMap = {
        aircon: "device1",
        light: "device2",
        fan: "device3",
      };

      const newState = !controls[controlName];

      setControls((prev) => ({
        ...prev,
        [controlName]: newState,
      }));

      const postData = {
        [`${deviceMap[controlName]}`]: newState ? "on" : "off",
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
        // console.log("Device control successful:", response.data);
      } catch (error) {
        console.error("Error controlling device:", error);
        setControls((prev) => ({
          ...prev,
          [controlName]: !newState,
        }));
      }
    },
    [controls]
  );

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
          <div className="switch-container">
            <div className="control-info">
              <span className={`icon ${controls.aircon ? "active" : ""}`}>
                ❄️
              </span>
              <span className="control-text">
                {controls.aircon ? "ON" : "OFF"}
              </span>
            </div>
            <div className="switch" onClick={() => toggleControl("aircon")}>
              <div className={`slider ${controls.aircon ? "on" : "off"}`}></div>
            </div>
          </div>

          <div className="switch-container">
            <div className="control-info">
              <span className={`icon ${controls.light ? "active" : ""}`}>
                💡
              </span>
              <span className="control-text">
                {controls.light ? "ON" : "OFF"}
              </span>
            </div>
            <div className="switch" onClick={() => toggleControl("light")}>
              <div className={`slider ${controls.light ? "on" : "off"}`}></div>
            </div>
          </div>

          <div className="switch-container">
            <div className="control-info">
              <span className={`icon ${controls.fan ? "active" : ""}`}>
                <FanIcon isActive={controls.fan} />
              </span>
              <span className="control-text">
                {controls.fan ? "ON" : "OFF"}
              </span>
            </div>
            <div className="switch" onClick={() => toggleControl("fan")}>
              <div className={`slider ${controls.fan ? "on" : "off"}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;
