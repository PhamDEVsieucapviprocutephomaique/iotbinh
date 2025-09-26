import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";

import "../scss/Chart.scss";

const ChartTemperature = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // State lưu trữ lịch sử 20 giá trị từ API
  const [chartData, setChartData] = useState({
    labels: [],
    temperature: [],
    humidity: [],
    light: [],
  });

  // State lưu trữ giá trị max động cho ánh sáng
  const [lightMax, setLightMax] = useState(100);

  // Hàm format thời gian thành HH:MM:SS
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Hàm tính giá trị max động cho ánh sáng
  const calculateLightMax = (lightData) => {
    if (lightData.length === 0) return 100;

    const maxLightValue = Math.max(...lightData);
    // Làm tròn lên đến hàng chục gần nhất + thêm 20% buffer
    const dynamicMax = Math.ceil(maxLightValue / 10) * 10 + 10;
    return Math.max(dynamicMax, 100); // Đảm bảo tối thiểu là 100
  };

  // Hàm fetch dữ liệu từ API
  const fetchSensorData = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/datasensor/chartlatest/"
      );
      const data = await response.json();

      if (data && data.length > 0) {
        // API đã trả về 20 giá trị theo thứ tự từ cũ đến mới
        const labels = data.map((item) => item.time);
        const temperature = data.map((item) => item.temperature);
        const humidity = data.map((item) => item.humidity);
        const light = data.map((item) => item.light);

        // Tính toán giá trị max động cho ánh sáng
        const newLightMax = calculateLightMax(light);

        setLightMax(newLightMax);
        setChartData({
          labels: labels,
          temperature: temperature,
          humidity: humidity,
          light: light,
        });
      }
    } catch (error) {
      console.error("Error fetching sensor data:", error);
    }
  };

  // Cập nhật dữ liệu sensor mỗi 5 giây từ API thực tế
  useEffect(() => {
    fetchSensorData(); // Gọi ngay lần đầu

    const interval = setInterval(() => {
      fetchSensorData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chartRef.current && chartData.labels.length > 0) {
      const ctx = chartRef.current.getContext("2d");

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: chartData.labels.map(formatTime),
          datasets: [
            {
              label: "Temperature (°C)",
              data: chartData.temperature,
              borderColor: "#FF6384",
              backgroundColor: "rgba(255, 99, 132, 0.1)",
              yAxisID: "y",
              tension: 0.4,
              borderWidth: 2,
            },
            {
              label: "Humidity (%)",
              data: chartData.humidity,
              borderColor: "#36A2EB",
              backgroundColor: "rgba(54, 162, 235, 0.1)",
              yAxisID: "y",
              tension: 0.4,
              borderWidth: 2,
            },
            {
              label: "Light (lux)",
              data: chartData.light,
              borderColor: "#FFCE56",
              backgroundColor: "rgba(255, 206, 86, 0.1)",
              yAxisID: "y1",
              tension: 0.4,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Time (HH:MM:SS)",
              },
              ticks: {
                maxTicksLimit: 10,
                callback: function (value, index, values) {
                  return formatTime(chartData.labels[index]);
                },
              },
            },
            y: {
              type: "linear",
              display: true,
              position: "left",
              title: {
                display: true,
                text: "Temperature (°C) / Humidity (%)",
              },
              min: 0,
              max: 100,
              grid: {
                color: "rgba(0,0,0,0.1)",
              },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Light (lux)",
              },
              min: 0,
              max: lightMax, // Sử dụng giá trị max động
              grid: {
                drawOnChartArea: false,
              },
            },
          },
          plugins: {
            legend: {
              position: "top",
              labels: {
                usePointStyle: true,
                padding: 20,
              },
            },
            tooltip: {
              callbacks: {
                title: function (tooltipItems) {
                  const index = tooltipItems[0].dataIndex;
                  return formatTime(chartData.labels[index]);
                },
              },
            },
          },
          animation: false,
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData, lightMax]); // Thêm lightMax vào dependency

  return (
    <div className="chart-container">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default ChartTemperature;
